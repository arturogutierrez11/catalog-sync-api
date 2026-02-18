import { Worker, Job } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';
import { SyncMeliCategories } from 'src/core/interactors/SyncMeliCategories';
import {
  MELI_CATEGORIES_QUEUE_NAME,
  MeliCategoriesJobs,
} from './MeliCategories.queue';

export function startMeliCategoriesSyncWorker(
  syncMeliCategories: SyncMeliCategories,
) {
  const worker = new Worker(
    MELI_CATEGORIES_QUEUE_NAME,
    async (job: Job) => {
      if (job.name !== MeliCategoriesJobs.SYNC_MELI_CATEGORIES) {
        console.log('⚠️ Unknown job type:', job.name);
        return;
      }

      console.log('🔥 CATEGORIES JOB RECEIVED:', job.id);

      const startedAt = Date.now();

      await job.updateProgress(1);
      await job.log('▶️ Starting categories sync');

      try {
        await syncMeliCategories.execute();

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        await job.updateProgress(100);
        await job.log(`✅ Categories sync completed in ${duration}s`);

        console.log(`✅ CATEGORIES JOB COMPLETED (${duration}s)`);
      } catch (error: any) {
        console.error('❌ CATEGORIES JOB FAILED');
        console.error(error);

        await job.log(error?.message ?? 'Unknown error');

        throw error;
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`🎉 Categories job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`💥 Categories job ${job?.id} failed`);
    console.log(err);
  });

  worker.on('error', (err) => {
    console.error('🚨 Categories worker error:', err);
  });

  console.log('🚀 MeliCategories worker started');

  return worker;
}
