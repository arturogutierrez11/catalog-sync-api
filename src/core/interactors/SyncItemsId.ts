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

  constructor(
    @Inject('IGetItemsIdRepository')
    private readonly meliItemsRepo: IGetItemsIdRepository,

    @Inject('ISaveItemsIdRepository')
    private readonly madreSaveItemsRepo: ISaveItemsIdRepository,

    @Inject('ISyncStatesRepository')
    private readonly syncStatesRepo: ISyncStatesRepository,
  ) {}

  /**
   * FULL REBUILD
   */
  async execute(sellerId: string): Promise<void> {
    console.log('[SyncItemsId] ===== FULL SYNC START =====');

    await this.syncStatesRepo.postState('start', {
      process_name: this.PROCESS_NAME,
      seller_id: sellerId,
    });

    try {
      await this.processAll(sellerId);

      await this.syncStatesRepo.postState('done', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: 0,
      });

      console.log('[SyncItemsId] ===== FULL SYNC DONE =====');
    } catch (error) {
      console.error('[SyncItemsId] ===== SYNC FAILED =====');

      await this.syncStatesRepo.postState('failed', {
        process_name: this.PROCESS_NAME,
        seller_id: sellerId,
        last_offset: 0,
      });

      throw error;
    }
  }

  /**
   * SCAN LOOP
   */
  private async processAll(sellerId: string): Promise<void> {
    let scrollId: string | undefined = undefined;
    let buffer: string[] = [];
    let pageCount = 0;

    while (true) {
      let pageResponse: ItemsId | null = null;
      let attempts = 0;

      while (attempts < this.MAX_PAGE_RETRIES) {
        try {
          console.log(`[SyncItemsId] SCROLL BEFORE CALL = ${scrollId}`);

          pageResponse = await this.meliItemsRepo.getSellerItems({
            status: 'active',
            limit: this.PAGE_LIMIT,
            useScan: true,
            scrollId,
          });

          console.log(
            `[SyncItemsId] SCROLL AFTER CALL = ${pageResponse?.scrollId}`,
          );

          break;
        } catch (error) {
          attempts++;
          console.error(
            `[SyncItemsId] SCAN request failed (attempt ${attempts})`,
          );
          await this.sleep(2000);
        }
      }

      if (!pageResponse) {
        throw new Error('SCAN request permanently failed');
      }

      const items = pageResponse.items ?? [];
      const received = items.length;

      console.log(`[SyncItemsId] PAGE ${pageCount} | received=${received}`);

      // 🔚 Fin real del scan
      if (received === 0) {
        console.log('[SyncItemsId] ===== END OF SCAN =====');
        break;
      }

      buffer.push(...items);

      // 🔥 Muy importante: actualizar scrollId
      scrollId = pageResponse.scrollId;

      console.log(`[SyncItemsId] SCROLL SET FOR NEXT LOOP = ${scrollId}`);

      // 🔥 Guardado por lote
      if (buffer.length >= this.BULK_SIZE) {
        await this.saveWithRetry(sellerId, buffer);
        buffer = [];
      }

      pageCount++;
      await this.sleep(this.THROTTLE_MS);
    }

    // Flush final
    if (buffer.length) {
      await this.saveWithRetry(sellerId, buffer);
    }
  }

  /**
   * Bulk save con retry
   */
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

    throw new Error('Bulk save permanently failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
