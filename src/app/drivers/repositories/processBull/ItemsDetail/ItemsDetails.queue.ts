import { Queue } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';

export const ITEMS_DETAILS_QUEUE_NAME = 'items-details';

export enum ItemsDetailsJobs {
  SYNC_ITEMS_DETAILS = 'sync-items-details',
}

export const ItemsDetailsQueue = new Queue(ITEMS_DETAILS_QUEUE_NAME, {
  connection: bullmqConnection,
});
