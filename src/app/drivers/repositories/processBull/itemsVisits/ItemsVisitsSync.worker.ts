import { Worker, Job } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';
import { SyncItemsVisits } from 'src/core/interactors/SyncItemsVisits';
import { ITEMS_VISITS_QUEUE_NAME, ItemsVisitsJobs } from './ItemsVisits.queue';

type SyncItemsVisitsPayload = {
  sellerId: string;
};

export function startItemsVisitsSyncWorker(syncItemsVisits: SyncItemsVisits) {
  const worker = new Worker<SyncItemsVisitsPayload>(
    ITEMS_VISITS_QUEUE_NAME,
    async (job: Job<SyncItemsVisitsPayload>) => {
      if (job.name !== ItemsVisitsJobs.SYNC_ITEMS_VISITS) {
        console.log('⚠️ Unknown job type received:', job.name);
        return;
      }

      console.log('🔥 VISITS JOB RECEIVED:', job.id);

      const { sellerId } = job.data;

      const startedAt = Date.now();

      await job.log(`▶️ Starting items visits sync for ${sellerId}`);
      await job.updateProgress(1);

      try {
        await syncItemsVisits.execute(sellerId);

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        await job.updateProgress(100);
        await job.log(`✅ ItemsVisits sync completed in ${duration}s`);

        console.log(`✅ VISITS JOB COMPLETED: ${job.id} (${duration}s)`);
      } catch (error: any) {
        console.error('❌ VISITS JOB FAILED:', job.id);
        console.error(error);

        await job.log(`❌ Sync failed: ${error?.message}`);
        await job.log(error?.stack ?? 'No stack trace');

        throw error;
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1, // importante
    },
  );

  worker.on('completed', (job) => {
    console.log(`🎉 Visits job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`💥 Visits job ${job?.id} failed`);
    console.log(err);
  });

  worker.on('error', (err) => {
    console.error('🚨 Visits Worker error:', err);
  });

  return worker;
}
