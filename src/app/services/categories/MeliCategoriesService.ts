import { Injectable, Logger } from '@nestjs/common';
import {
  MeliCategoriesJobs,
  MeliCategoriesQueue,
} from 'src/app/drivers/repositories/processBull/categories/MeliCategories.queue';

@Injectable()
export class MeliCategoriesService {
  private readonly logger = new Logger(MeliCategoriesService.name);

  async runSync() {
    this.logger.log('📌 Adding Meli Categories Sync job to queue...');

    const job = await MeliCategoriesQueue.add(
      MeliCategoriesJobs.SYNC_MELI_CATEGORIES,
      {},
      {
        jobId: `meli-categories-sync`,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `✅ Job queued successfully | jobId=${job.id} | attempts=5`,
    );

    return {
      status: 'queued',
      job_id: job.id,
      attempts: 5,
    };
  }
}
