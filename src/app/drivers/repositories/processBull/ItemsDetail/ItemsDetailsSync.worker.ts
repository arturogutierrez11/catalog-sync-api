import { Worker, Job } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';
import { SyncItemsDetails } from 'src/core/interactors/SyncItemsDetails';
import {
  ITEMS_DETAILS_QUEUE_NAME,
  ItemsDetailsJobs,
} from './ItemsDetails.queue';

type SyncItemsDetailsPayload = {
  sellerId: string;
};

export function startItemsDetailsSyncWorker(
  syncItemsDetails: SyncItemsDetails,
) {
  return new Worker<SyncItemsDetailsPayload>(
    ITEMS_DETAILS_QUEUE_NAME,
    async (job: Job<SyncItemsDetailsPayload>) => {
      if (job.name !== ItemsDetailsJobs.SYNC_ITEMS_DETAILS) return;

      const { sellerId } = job.data;

      const startedAt = Date.now();

      await job.log(`▶️ Starting items details sync for ${sellerId}`);
      await job.updateProgress(1);

      try {
        await syncItemsDetails.execute(sellerId);

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        await job.updateProgress(100);
        await job.log(`✅ ItemsDetails sync completed in ${duration}s`);
      } catch (error: any) {
        await job.log(`❌ Sync failed: ${error?.message}`);
        await job.log(error?.stack ?? 'No stack trace');

        throw error; // 🔥 necesario para retry automático
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1, // 🔥 correcto para no matar la API de Meli
    },
  );
}
