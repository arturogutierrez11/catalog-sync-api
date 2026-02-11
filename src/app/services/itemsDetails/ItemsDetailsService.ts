import { Injectable } from '@nestjs/common';
import {
  ItemsDetailsJobs,
  ItemsDetailsQueue,
} from 'src/app/drivers/repositories/processBull/ItemsDetail/ItemsDetails.queue';

@Injectable()
export class ItemsDetailsService {
  /**
   * Encola el proceso ItemsDetails
   * - No ejecuta lógica
   * - No bloquea
   * - Seguro para ejecutar manualmente
   * - Con reintentos automáticos
   */
  async runSync(sellerId: string) {
    const job = await ItemsDetailsQueue.add(
      ItemsDetailsJobs.SYNC_ITEMS_DETAILS,
      { sellerId },
      {
        jobId: `items-details-${sellerId}`,

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
