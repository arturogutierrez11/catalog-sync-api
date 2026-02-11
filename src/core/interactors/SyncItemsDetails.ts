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

  // ─────────────────────────────────────────────
  // PUBLIC ENTRY
  // ─────────────────────────────────────────────
  async execute(sellerId: string): Promise<void> {
    const state = await this.syncStatesRepo.getState({
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
    });

    let offset = state?.last_offset ?? 0;

    if (!state) {
      await this.syncStatesRepo.postState('start', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
      });
    }

    offset = await this.processAll(sellerId, offset);

    await this.syncStatesRepo.postState('done', {
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
      last_offset: offset,
    });
  }

  // ─────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────
  private async processAll(
    sellerId: string,
    startOffset: number,
  ): Promise<number> {
    let offset = startOffset;
    let hasNext = true;
    let failedPages = 0;

    while (hasNext) {
      let pageResponse: ItemsIdPage | null = null;
      let attempts = 0;

      // 🔁 Retry por página
      while (attempts < this.MAX_PAGE_RETRIES) {
        try {
          pageResponse = await this.itemsIdRepo.get({
            sellerId,
            limit: this.PAGE_LIMIT,
            offset,
          });
          break;
        } catch (error) {
          attempts++;
          console.error(
            `[SyncItemsDetails] Page offset=${offset} failed (attempt ${attempts})`,
          );
          await this.sleep(2000);
        }
      }

      // ❌ Página falló completamente
      if (!pageResponse) {
        failedPages++;

        await this.syncStatesRepo.postState('failed', {
          process_name: this.PROCESS_NAME,
          seller_id: sellerId,
          last_offset: offset,
        });

        if (failedPages >= this.MAX_FAILED_PAGES) {
          throw new Error('Too many failed pages, aborting sync');
        }

        offset += this.PAGE_LIMIT;
        continue;
      }

      console.log(
        `[SyncItemsDetails] FETCH IDS offset=${offset} | received=${pageResponse.items.length}`,
      );

      const detailedProducts: MercadoLibreProduct[] = [];

      // ─────────────────────────────────────────
      // FETCH DETAILS PER ITEM
      // ─────────────────────────────────────────
      for (const itemId of pageResponse.items) {
        const detail = await this.fetchProductWithRetry(itemId);

        if (detail) {
          detailedProducts.push(this.mapToMadreProduct(sellerId, detail));
        }

        await this.sleep(this.THROTTLE_MS);
      }

      // ─────────────────────────────────────────
      // SAVE BULK
      // ─────────────────────────────────────────
      if (detailedProducts.length) {
        await this.saveWithRetry(sellerId, detailedProducts);

        console.log(
          `[SyncItemsDetails] SAVED ${detailedProducts.length} products`,
        );
      }

      hasNext = pageResponse.pagination.has_next;
      offset += this.PAGE_LIMIT;

      await this.syncStatesRepo.postState('offset', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: offset,
      });
    }

    return offset;
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
      description: detail.description ?? null,
    };
  }

  // ─────────────────────────────────────────────
  // SAVE RETRY
  // ─────────────────────────────────────────────
  private async saveWithRetry(
    sellerId: string,
    products: MercadoLibreProduct[],
  ): Promise<void> {
    let attempts = 0;

    while (attempts < this.MAX_SAVE_RETRIES) {
      try {
        await this.madreProductsRepo.saveBulk({
          sellerId,
          products,
        });

        return;
      } catch (error) {
        attempts++;
        console.error(`[SyncItemsDetails] SAVE failed (attempt ${attempts})`);
        await this.sleep(2000);
      }
    }

    throw new Error('Bulk save permanently failed');
  }

  // ─────────────────────────────────────────────
  // UTIL
  // ─────────────────────────────────────────────
  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
