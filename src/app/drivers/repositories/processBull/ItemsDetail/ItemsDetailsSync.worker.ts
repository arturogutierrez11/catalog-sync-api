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

      await job.log(`▶️ Starting items details sync for ${sellerId}`);
      await job.updateProgress(0);

      const startedAt = Date.now();

      try {
        await syncItemsDetails.execute(sellerId);

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        await job.updateProgress(100);
        await job.log(`✅ ItemsDetails sync completed in ${duration}s`);
      } catch (error: any) {
        await job.log(`❌ ItemsDetails sync failed: ${error?.message}`);
        throw error; // 🔥 importante para que Bull reintente
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );
}
