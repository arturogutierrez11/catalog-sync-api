import { Inject, Injectable } from '@nestjs/common';
import type { IGetItemsIdRepository } from '../adapters/madre-api/itemsId/IGetItemsIdRepository';
import type { ISyncStatesRepository } from '../adapters/madre-api/syncStates/ISyncStatesRepository';
import type { IGetItemsVisitsFromMeliRepository } from '../adapters/mercadolibre-api/itemsVisits/IGetItemsVisitsFromMeliRepository';
import type { ISaveItemsVisitsRepository } from '../adapters/madre-api/itemsVisits/ISaveItemsVisitsRepository';

import type { ItemsIdPage } from '../entitis/madre-api/itemsId/ItemsIdPage';

@Injectable()
export class SyncItemsVisits {
  private readonly PROCESS_NAME = 'items_visits_sync';

  private readonly PAGE_LIMIT = 50;
  private readonly THROTTLE_MS = 120;

  private readonly MAX_PAGE_RETRIES = 3;
  private readonly MAX_ITEM_RETRIES = 3;
  private readonly MAX_SAVE_RETRIES = 3;
  private readonly MAX_FAILED_PAGES = 10;

  constructor(
    @Inject('IGetItemsIdRepository')
    private readonly itemsIdRepo: IGetItemsIdRepository,

    @Inject('IGetItemsVisitsFromMeliRepository')
    private readonly meliVisitsRepo: IGetItemsVisitsFromMeliRepository,

    @Inject('ISaveItemsVisitsRepository')
    private readonly saveVisitsRepo: ISaveItemsVisitsRepository,

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

  // ─────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────
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

      // 🔁 Retry por página
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
            `[SyncItemsVisits] Page lastId=${lastId} failed (attempt ${attempts})`,
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
          throw new Error('Too many failed pages, aborting visits sync');
        }

        continue;
      }

      console.log(
        `[SyncItemsVisits] FETCH IDS lastId=${lastId} | received=${pageResponse.items.length}`,
      );

      // ─────────────────────────────────────────
      // FETCH VISITS PER ITEM
      // ─────────────────────────────────────────
      for (const itemId of pageResponse.items) {
        const visits = await this.fetchVisitsWithRetry(itemId);

        if (visits !== null) {
          await this.saveWithRetry(itemId, visits);
        }

        await this.sleep(this.THROTTLE_MS);
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
  // VISITS RETRY
  // ─────────────────────────────────────────────
  private async fetchVisitsWithRetry(itemId: string): Promise<number | null> {
    let attempts = 0;

    while (attempts < this.MAX_ITEM_RETRIES) {
      try {
        const response = await this.meliVisitsRepo.getByItemId(itemId);
        console.log(
          `[SyncItemsVisits] VISITS OK ${itemId} → ${response.total}`,
        );

        return response.total;
      } catch (error) {
        attempts++;
        console.error(
          `[SyncItemsVisits] VISITS FAIL ${itemId} (attempt ${attempts})`,
        );
        await this.sleep(1500);
      }
    }

    console.error(`[SyncItemsVisits] VISITS permanently failed ${itemId}`);

    return null;
  }

  // ─────────────────────────────────────────────
  // SAVE RETRY
  // ─────────────────────────────────────────────
  private async saveWithRetry(
    itemId: string,
    totalVisits: number,
  ): Promise<void> {
    let attempts = 0;

    while (attempts < this.MAX_SAVE_RETRIES) {
      try {
        await this.saveVisitsRepo.saveItemsVisits({
          itemId,
          totalVisits,
        });

        return;
      } catch (error) {
        attempts++;
        console.error(
          `[SyncItemsVisits] SAVE failed ${itemId} (attempt ${attempts})`,
        );
        await this.sleep(2000);
      }
    }

    throw new Error('Visits save permanently failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
