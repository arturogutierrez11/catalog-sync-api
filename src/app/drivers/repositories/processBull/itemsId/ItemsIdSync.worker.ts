import { Worker } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';
import { SyncItemsId } from 'src/core/interactors/SyncItemsId';
import { ITEMS_ID_QUEUE_NAME } from './ItemsId.queue';

export function startItemsIdSyncWorker(syncItemsId: SyncItemsId) {
  return new Worker(
    ITEMS_ID_QUEUE_NAME,
    async (job) => {
      try {
        await syncItemsId.execute(job.data.sellerId);
      } catch (error) {
        throw error;
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );
}
