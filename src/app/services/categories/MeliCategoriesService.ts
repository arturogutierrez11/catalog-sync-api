import { Injectable } from '@nestjs/common';
import {
  MeliCategoriesJobs,
  MeliCategoriesQueue,
} from 'src/app/drivers/repositories/processBull/categories/MeliCategories.queue';

@Injectable()
export class MeliCategoriesService {
  async runSync() {
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

    return {
      status: 'queued',
      job_id: job.id,
      attempts: 5,
    };
  }
}
