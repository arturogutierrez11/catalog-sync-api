import { Worker, Job } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';
import { UpdateItemsDetails } from 'src/core/interactors/UpdateItemsDetails';
import { UPDATE_ITEMS_DETAILS_QUEUE_NAME } from './UpdatedDetailsJob.queue';

type Payload = {
  sellerId: string;
};

export function UpdateItemsDetailsWorker(interactor: UpdateItemsDetails) {
  const worker = new Worker<Payload>(
    UPDATE_ITEMS_DETAILS_QUEUE_NAME,
    async (job: Job<Payload>) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 RAW JOB RECEIVED');
      console.log('Job ID:', job.id);
      console.log('Job Name:', job.name);
      console.log('Attempts Made:', job.attemptsMade);
      console.log('Payload:', JSON.stringify(job.data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (job.name !== 'update-items-details') {
        console.log('⚠️ Unknown job type received:', job.name);
        return;
      }

      const { sellerId } = job.data;

      if (!sellerId) {
        console.error('❌ sellerId is missing in job payload');
        throw new Error('sellerId is required');
      }

      console.log(`🔥 UPDATE JOB STARTED`);
      console.log(`Seller ID: ${sellerId}`);

      const startedAt = Date.now();

      try {
        await interactor.execute(sellerId);

        const duration = ((Date.now() - startedAt) / 1000).toFixed(2);

        console.log(`✅ UPDATE JOB COMPLETED`);
        console.log(`Job ID: ${job.id}`);
        console.log(`Duration: ${duration}s`);
      } catch (error) {
        console.error(`❌ UPDATE JOB FAILED: ${job.id}`);
        console.error('Error stack:', error);

        throw error; // 🔥 necesario para retry automático
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

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

  return worker;
}
