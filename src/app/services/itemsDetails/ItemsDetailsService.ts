import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ItemsDetailsJobs,
  ItemsDetailsQueue,
} from 'src/app/drivers/repositories/processBull/ItemsDetail/ItemsDetails.queue';

@Injectable()
export class ItemsDetailsService {
  async runSync(sellerId: string) {
    if (!sellerId) {
      throw new BadRequestException('sellerId is required');
    }

    const job = await ItemsDetailsQueue.add(
      ItemsDetailsJobs.SYNC_ITEMS_DETAILS,
      { sellerId },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },

        // 🔥 importante
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    return {
      status: 'queued',
      seller_id: sellerId,
      job_id: job.id,
      attempts: 5,
    };
  }
}
