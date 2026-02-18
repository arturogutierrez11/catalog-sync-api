import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { UPDATE_ITEMS_DETAILS_QUEUE_NAME } from 'src/app/drivers/repositories/processBull/ItemsDetail/updated/UpdatedDetailsJob.queue';

@Injectable()
export class UpdateItemsDetailsService {
  constructor(
    @Inject(UPDATE_ITEMS_DETAILS_QUEUE_NAME)
    private readonly queue: Queue,
  ) {}

  async runUpdate(sellerId: string) {
    const job = await this.queue.add(
      'update-items-details',
      { sellerId },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
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
