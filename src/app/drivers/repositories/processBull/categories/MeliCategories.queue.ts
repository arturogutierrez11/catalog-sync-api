import { Queue } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';

export const MELI_CATEGORIES_QUEUE_NAME = 'meli-categories';

export enum MeliCategoriesJobs {
  SYNC_MELI_CATEGORIES = 'sync-meli-categories',
}

export const MeliCategoriesQueue = new Queue(MELI_CATEGORIES_QUEUE_NAME, {
  connection: bullmqConnection,
});
