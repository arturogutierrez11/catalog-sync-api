import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ItemsVisitsJobs,
  ItemsVisitsQueue,
} from 'src/app/drivers/repositories/processBull/itemsVisits/ItemsVisits.queue';

@Injectable()
export class ItemsVisitsService {
  async runSync(sellerId: string) {
    if (!sellerId) {
      throw new BadRequestException('sellerId is required');
    }

    const job = await ItemsVisitsQueue.add(
      ItemsVisitsJobs.SYNC_ITEMS_VISITS,
      { sellerId },
      {
        jobId: `items-visits-${sellerId}`,
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
      seller_id: sellerId,
      job_id: job.id,
      attempts: 5,
    };
  }
}
