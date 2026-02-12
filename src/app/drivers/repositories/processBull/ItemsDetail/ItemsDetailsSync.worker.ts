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
  const worker = new Worker<SyncItemsDetailsPayload>(
    ITEMS_DETAILS_QUEUE_NAME,
    async (job: Job<SyncItemsDetailsPayload>) => {
      // Seguridad extra
      if (job.name !== ItemsDetailsJobs.SYNC_ITEMS_DETAILS) {
        console.log('⚠️ Unknown job type received:', job.name);
        return;
      }

      console.log('🔥 JOB RECEIVED:', job.id);

      const { sellerId } = job.data;

      const startedAt = Date.now();

      await job.log(`▶️ Starting items details sync for ${sellerId}`);
      await job.updateProgress(1);

      try {
        await syncItemsDetails.execute(sellerId);

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        await job.updateProgress(100);
        await job.log(`✅ ItemsDetails sync completed in ${duration}s`);

        console.log(`✅ JOB COMPLETED: ${job.id} (${duration}s)`);
      } catch (error: any) {
        console.error('❌ JOB FAILED:', job.id);
        console.error(error);

        await job.log(`❌ Sync failed: ${error?.message}`);
        await job.log(error?.stack ?? 'No stack trace');

        throw error; // 🔥 NECESARIO para que Bull haga retry
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1, // no saturar MercadoLibre
    },
  );

  // 🔔 Eventos globales del worker

  worker.on('completed', (job) => {
    console.log(`🎉 Worker event: job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`💥 Worker event: job ${job?.id} failed`);
    console.log(err);
  });

  worker.on('error', (err) => {
    console.error('🚨 Worker error:', err);
  });

  console.log('🚀 ItemsDetails worker started');

  return worker;
}
