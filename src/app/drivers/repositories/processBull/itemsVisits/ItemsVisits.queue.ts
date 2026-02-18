import { Queue } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';

export const ITEMS_VISITS_QUEUE_NAME = 'items-visits';

export enum ItemsVisitsJobs {
  SYNC_ITEMS_VISITS = 'sync-items-visits',
}

export const ItemsVisitsQueue = new Queue(ITEMS_VISITS_QUEUE_NAME, {
  connection: bullmqConnection,
});
