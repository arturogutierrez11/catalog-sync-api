import { Queue } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';

export const ITEMS_ID_QUEUE_NAME = 'items-id';

export enum ItemsIdJobs {
  SYNC_ITEMS_ID = 'sync-items-id',
}

export const ItemsIdQueue = new Queue(ITEMS_ID_QUEUE_NAME, {
  connection: bullmqConnection,
});
