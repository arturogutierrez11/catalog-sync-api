import { Inject, Injectable } from '@nestjs/common';
import type { ISaveItemsIdRepository } from '../adapters/madre-api/itemsId/ISaveItemsIdRepository';
import type { ISyncStatesRepository } from '../adapters/madre-api/syncStates/ISyncStatesRepository';
import type { IGetItemsIdRepository } from '../adapters/mercadolibre-api/itemsId/IGetItemsIdRepository';
import { ItemsId } from '../entitis/mercadolibre-api/ItemsId';

@Injectable()
export class SyncItemsId {
  private readonly PROCESS_NAME = 'items_id_sync';

  private readonly PAGE_LIMIT = 100;
  private readonly BULK_SIZE = 1000;
  private readonly THROTTLE_MS = 200;

  private readonly MAX_PAGE_RETRIES = 3;
  private readonly MAX_SAVE_RETRIES = 3;
  private readonly MAX_FAILED_PAGES = 10;

  constructor(
    @Inject('IGetItemsIdRepository')
    private readonly meliItemsRepo: IGetItemsIdRepository,

    @Inject('ISaveItemsIdRepository')
    private readonly madreSaveItemsRepo: ISaveItemsIdRepository,

    @Inject('ISyncStatesRepository')
    private readonly syncStatesRepo: ISyncStatesRepository,
  ) {}

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

  private async processAll(
    sellerId: string,
    startScrollId?: string,
  ): Promise<string | null> {
    let scrollId: string | undefined = startScrollId;
    let buffer: string[] = [];
    let hasMore = true;

    while (hasMore) {
      let pageResponse: ItemsId | null = null;
      let attempts = 0;

      while (attempts < this.MAX_PAGE_RETRIES) {
        try {
          pageResponse = await this.meliItemsRepo.getSellerItems({
            status: 'active',
            limit: this.PAGE_LIMIT,
            useScan: true,
            scrollId,
          });

          break;
        } catch (error) {
          attempts++;
          console.error(
            `[SyncItemsId] Scroll request failed (attempt ${attempts})`,
          );

          await this.sleep(2000);
        }
      }

      if (!pageResponse) {
        throw new Error('Scan request permanently failed');
      }

      const received = pageResponse.items.length;

      console.log(`[SyncItemsId] SCAN | received=${received}`);

      if (received === 0) {
        hasMore = false;
        break;
      }

      buffer.push(...pageResponse.items);
      scrollId = pageResponse.scrollId;

      if (buffer.length >= this.BULK_SIZE) {
        await this.saveWithRetry(sellerId, buffer);
        buffer = [];

        await this.syncStatesRepo.postState('offset', {
          process_name: this.PROCESS_NAME,
          seller_id: sellerId,
          last_offset: 0, // ya no usamos offset
        });
      }

      await this.sleep(this.THROTTLE_MS);
    }

    if (buffer.length) {
      await this.saveWithRetry(sellerId, buffer);
    }

    return scrollId ?? null;
  }

  private async saveWithRetry(
    sellerId: string,
    items: string[],
  ): Promise<void> {
    let attempts = 0;

    while (attempts < this.MAX_SAVE_RETRIES) {
      try {
        await this.madreSaveItemsRepo.save({
          sellerId,
          status: 'active',
          items,
        });

        console.log(`[SyncItemsId] BULK SAVE SUCCESS | ${items.length} items`);

        return;
      } catch (error) {
        attempts++;

        console.error(`[SyncItemsId] BULK SAVE failed (attempt ${attempts})`);

        await this.sleep(3000);
      }
    }

    console.error('[SyncItemsId] BULK SAVE permanently failed');

    await this.syncStatesRepo.postState('failed', {
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
    });

    // 🔥 Importante: lanzar error para que Bull reintente el job completo
    throw new Error('Bulk save permanently failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
