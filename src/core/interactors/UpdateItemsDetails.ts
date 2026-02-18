import { Inject, Injectable } from '@nestjs/common';

import type { IGetItemsIdRepository } from '../adapters/madre-api/itemsId/IGetItemsIdRepository';
import type { IGetItemsDetailsRepository } from '../adapters/madre-api/itemsDetails/IGetItemsDetailsRepository';
import type { ISaveItemsDetailsRepository } from '../adapters/madre-api/itemsDetails/ISaveItemsDetailsRepository';
import type { IUpdateItemsDetailsRepository } from '../adapters/madre-api/itemsDetails/IUpdateItemsDetailsRepository';
import type { IMeliProductDetailRepository } from '../adapters/mercadolibre-api/getDetails/IMeliProductDetailRepository';
import type { ISyncStatesRepository } from '../adapters/madre-api/syncStates/ISyncStatesRepository';

import type { ItemsIdPage } from '../entitis/madre-api/itemsId/ItemsIdPage';
import type { MercadoLibreProduct } from '../entitis/madre-api/itemsDetails/MercadoLibreProduct';
import type { MeliProductDetail } from '../entitis/mercadolibre-api/MeliProductDetail';

@Injectable()
export class UpdateItemsDetails {
  private readonly PROCESS_NAME = 'items_details_update';

  private readonly PAGE_LIMIT = 50;
  private readonly THROTTLE_MS = 120;

  private readonly MAX_PAGE_RETRIES = 3;
  private readonly MAX_ITEM_RETRIES = 3;
  private readonly MAX_FAILED_PAGES = 10;

  constructor(
    @Inject('IGetItemsIdRepository')
    private readonly itemsIdRepo: IGetItemsIdRepository,

    @Inject('IGetItemsDetailsRepository')
    private readonly madreSearchRepo: IGetItemsDetailsRepository,

    @Inject('ISaveItemsDetailsRepository')
    private readonly saveRepo: ISaveItemsDetailsRepository,

    @Inject('IUpdateItemsDetailsRepository')
    private readonly updateRepo: IUpdateItemsDetailsRepository,

    @Inject('IMeliProductDetailRepository')
    private readonly meliRepo: IMeliProductDetailRepository,

    @Inject('ISyncStatesRepository')
    private readonly syncStatesRepo: ISyncStatesRepository,
  ) {}

  async execute(sellerId: string): Promise<void> {
    const state = await this.syncStatesRepo.getState({
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
    });

    let lastId: number = state?.last_offset ?? 0;
    if (!state) {
      await this.syncStatesRepo.postState('start', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: 0,
      });

      lastId = 0;
    }

    lastId = await this.processAll(sellerId, lastId);

    await this.syncStatesRepo.postState('done', {
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
      last_offset: lastId ?? 0,
    });
  }

  private async processAll(
    sellerId: string,
    startLastId: number,
  ): Promise<number> {
    let lastId = startLastId;
    let hasNext = true;
    let failedPages = 0;

    while (hasNext) {
      let page: ItemsIdPage | null = null;
      let attempts = 0;

      while (attempts < this.MAX_PAGE_RETRIES) {
        try {
          page = await this.itemsIdRepo.get({
            sellerId,
            limit: this.PAGE_LIMIT,
            lastId,
          });
          break;
        } catch (error) {
          attempts++;
          await this.sleep(2000);
        }
      }

      if (!page) {
        failedPages++;
        if (failedPages >= this.MAX_FAILED_PAGES) {
          throw new Error('Too many failed pages');
        }
        continue;
      }

      const ids = page.items;

      // 🔎 Buscar existentes en Madre
      const existing = await this.madreSearchRepo.getByIds({
        sellerId,
        ids,
      });

      const existingIds = new Set(existing.map((p) => p.id));

      const toInsert: MercadoLibreProduct[] = [];
      const toUpdate: MercadoLibreProduct[] = [];

      for (const id of ids) {
        const detail = await this.fetchWithRetry(id);
        if (!detail) continue;

        const mapped = this.mapProduct(detail);

        if (existingIds.has(id)) {
          toUpdate.push(mapped); // 🔥 COMPLETO
        } else {
          toInsert.push(mapped);
        }

        await this.sleep(this.THROTTLE_MS);
      }

      // 🔄 UPDATE COMPLETO
      if (toUpdate.length) {
        await this.updateRepo.updateBulk({
          sellerId,
          products: toUpdate,
        });
      }

      // ➕ INSERT COMPLETO
      if (toInsert.length) {
        await this.saveRepo.saveBulk({
          sellerId,
          products: toInsert,
        });
      }

      hasNext = page.hasNext;
      lastId = page.lastId ?? lastId;

      // actualizar offset progresivamente
      await this.syncStatesRepo.postState('offset', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: lastId,
      });
    }

    return lastId;
  }

  private async fetchWithRetry(id: string): Promise<MeliProductDetail | null> {
    let attempts = 0;

    while (attempts < this.MAX_ITEM_RETRIES) {
      try {
        return await this.meliRepo.getProductById(id);
      } catch (error) {
        attempts++;
        await this.sleep(1500);
      }
    }

    return null;
  }

  private mapProduct(detail: MeliProductDetail): MercadoLibreProduct {
    return {
      id: detail.id,
      categoryId: detail.categoryId ?? null,

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
    };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
