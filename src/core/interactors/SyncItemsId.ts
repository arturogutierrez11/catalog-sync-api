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
   * - Siempre empieza desde cero
   * - No usa offset
   * - No usa estado previo
   */
  async execute(sellerId: string): Promise<void> {
    console.log('[SyncItemsId] ===== FULL SYNC START =====');

    // 🔥 Siempre marcar start
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

      throw error; // importante para que Bull reintente
    }
  }

  /**
   * SCAN COMPLETO
   */
  private async processAll(sellerId: string): Promise<void> {
    let scrollId: string | undefined;
    let buffer: string[] = [];
    let hasMore = true;

    while (hasMore) {
      let pageResponse: ItemsId | null = null;
      let attempts = 0;

      // 🔁 Retry por request SCAN
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
            `[SyncItemsId] SCAN request failed (attempt ${attempts})`,
          );
          await this.sleep(2000);
        }
      }

      if (!pageResponse) {
        throw new Error('SCAN request permanently failed');
      }

      const received = pageResponse.items.length;

      console.log(`[SyncItemsId] SCAN | received=${received}`);

      // 🔚 Fin del scan
      if (received === 0) {
        hasMore = false;
        break;
      }

      buffer.push(...pageResponse.items);

      // 🔥 Guardar siguiente scroll_id
      scrollId = pageResponse.scrollId;

      // 🔥 Guardado por lote
      if (buffer.length >= this.BULK_SIZE) {
        await this.saveWithRetry(sellerId, buffer);
        buffer = [];
      }

      await this.sleep(this.THROTTLE_MS);
    }

    // Flush final
    if (buffer.length) {
      await this.saveWithRetry(sellerId, buffer);
    }
  }

  /**
   * Guardado con retry
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

    console.error('[SyncItemsId] BULK SAVE permanently failed');

    throw new Error('Bulk save permanently failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
