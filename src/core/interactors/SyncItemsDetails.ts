import { Inject, Injectable } from '@nestjs/common';
import type { IGetItemsIdRepository } from '../adapters/madre-api/itemsId/IGetItemsIdRepository';
import type { ISyncStatesRepository } from '../adapters/madre-api/syncStates/ISyncStatesRepository';
import type { IMeliProductDetailRepository } from '../adapters/mercadolibre-api/getDetails/IMeliProductDetailRepository';
import type { ISaveItemsDetailsRepository } from '../adapters/madre-api/itemsDetails/ISaveItemsDetailsRepository';

import type { MeliProductDetail } from '../entitis/mercadolibre-api/MeliProductDetail';
import type { ItemsIdPage } from '../entitis/madre-api/itemsId/ItemsIdPage';
import type { MercadoLibreProduct } from '../entitis/madre-api/itemsDetails/MercadoLibreProduct';

@Injectable()
export class SyncItemsDetails {
  private readonly PROCESS_NAME = 'items_details_sync';

  private readonly PAGE_LIMIT = 50;
  private readonly THROTTLE_MS = 150;

  private readonly MAX_PAGE_RETRIES = 3;
  private readonly MAX_ITEM_RETRIES = 3;
  private readonly MAX_SAVE_RETRIES = 3;
  private readonly MAX_FAILED_PAGES = 10;

  constructor(
    @Inject('IGetItemsIdRepository')
    private readonly itemsIdRepo: IGetItemsIdRepository,

    @Inject('IMeliProductDetailRepository')
    private readonly meliDetailRepo: IMeliProductDetailRepository,

    @Inject('ISaveItemsDetailsRepository')
    private readonly madreProductsRepo: ISaveItemsDetailsRepository,

    @Inject('ISyncStatesRepository')
    private readonly syncStatesRepo: ISyncStatesRepository,
  ) {}

  async execute(sellerId: string): Promise<void> {
    const state = await this.syncStatesRepo.getState({
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
    });

    let lastId: number | null = state?.last_offset ?? null;

    if (!state) {
      await this.syncStatesRepo.postState('start', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
      });
    }

    lastId = await this.processAll(sellerId, lastId);

    await this.syncStatesRepo.postState('done', {
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
      last_offset: lastId,
    });
  }

  private async processAll(
    sellerId: string,
    startLastId: number | null,
  ): Promise<number | null> {
    let lastId = startLastId;
    let hasNext = true;
    let failedPages = 0;

    while (hasNext) {
      let pageResponse: ItemsIdPage | null = null;
      let attempts = 0;

      while (attempts < this.MAX_PAGE_RETRIES) {
        try {
          pageResponse = await this.itemsIdRepo.get({
            sellerId,
            limit: this.PAGE_LIMIT,
            lastId,
          });
          break;
        } catch (error) {
          attempts++;
          console.error(
            `[SyncItemsDetails] Page lastId=${lastId} failed (attempt ${attempts})`,
          );
          await this.sleep(2000);
        }
      }

      if (!pageResponse) {
        failedPages++;

        await this.syncStatesRepo.postState('failed', {
          process_name: this.PROCESS_NAME,
          seller_id: sellerId,
          last_offset: lastId,
        });

        if (failedPages >= this.MAX_FAILED_PAGES) {
          throw new Error('Too many failed pages, aborting sync');
        }

        continue;
      }

      console.log(
        `[SyncItemsDetails] FETCH IDS lastId=${lastId} | received=${pageResponse.items.length}`,
      );

      const detailedProducts: MercadoLibreProduct[] = [];

      // 🔥 (todavía secuencial — lo mejoramos abajo)
      for (const itemId of pageResponse.items) {
        const detail = await this.fetchProductWithRetry(itemId);

        if (detail) {
          detailedProducts.push(this.mapToMadreProduct(sellerId, detail));
        }

        await this.sleep(this.THROTTLE_MS);
      }

      if (detailedProducts.length) {
        await this.saveWithRetry(sellerId, detailedProducts);

        console.log(
          `[SyncItemsDetails] SAVED ${detailedProducts.length} products`,
        );
      }

      hasNext = pageResponse.hasNext;
      lastId = pageResponse.lastId;

      await this.syncStatesRepo.postState('offset', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: lastId,
      });
    }

    return lastId;
  }

  // ─────────────────────────────────────────────
  // ITEM RETRY
  // ─────────────────────────────────────────────
  private async fetchProductWithRetry(
    productId: string,
  ): Promise<MeliProductDetail | null> {
    let attempts = 0;

    while (attempts < this.MAX_ITEM_RETRIES) {
      try {
        const product = await this.meliDetailRepo.getProductById(productId);

        console.log(`[SyncItemsDetails] DETAIL OK ${productId}`);

        return product;
      } catch (error) {
        attempts++;
        console.error(
          `[SyncItemsDetails] DETAIL FAIL ${productId} (attempt ${attempts})`,
        );
        await this.sleep(1500);
      }
    }

    console.error(`[SyncItemsDetails] DETAIL permanently failed ${productId}`);

    return null;
  }

  // ─────────────────────────────────────────────
  // MAP TO MADRE ENTITY
  // ─────────────────────────────────────────────
  private mapToMadreProduct(
    sellerId: string,
    detail: MeliProductDetail,
  ): MercadoLibreProduct {
    return {
      id: detail.id,
      title: detail.title,

      price: detail.price,
      currency: detail.currency,

      stock: detail.stock,
      soldQuantity: detail.soldQuantity,

      status: detail.status,
      condition: detail.condition,

      permalink: detail.permalink,
      thumbnail: detail.thumbnail,

      pictures: detail.pictures ?? [],

      sellerSku: detail.sellerSku ?? null,
      brand: detail.brand ?? null,
      warranty: detail.warranty ?? null,

      freeShipping: detail.freeShipping ?? false,

      health: detail.health ?? null,
      lastUpdated: detail.lastUpdated ?? null,
      //description: detail.description ?? null,
    };
  }

  // ─────────────────────────────────────────────
  // SAVE RETRY
  // ─────────────────────────────────────────────
  private async saveWithRetry(
    sellerId: string,
    products: MercadoLibreProduct[],
  ): Promise<void> {
    const CHUNK_SIZE = 10;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);

      let attempts = 0;

      while (attempts < this.MAX_SAVE_RETRIES) {
        try {
          await this.madreProductsRepo.saveBulk({
            sellerId,
            products: chunk,
          });

          break;
        } catch (error) {
          attempts++;
          console.error(`[SyncItemsDetails] SAVE failed (attempt ${attempts})`);
          await this.sleep(2000);
        }
      }

      if (attempts === this.MAX_SAVE_RETRIES) {
        throw new Error('Bulk save permanently failed');
      }
    }
  }

  // ─────────────────────────────────────────────
  // UTIL
  // ─────────────────────────────────────────────
  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
