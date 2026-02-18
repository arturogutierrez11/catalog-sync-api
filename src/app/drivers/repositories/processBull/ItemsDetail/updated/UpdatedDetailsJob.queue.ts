import { Queue } from 'bullmq';
import { bullmqConnection } from 'src/app/drivers/redis/bullmq.connection';

export const UPDATE_ITEMS_DETAILS_QUEUE_NAME = 'update-items-details';

export enum UpdateItemsDetailsJobs {
  UPDATE_ITEMS_DETAILS = 'update-items-details',
}

export const UpdateItemsDetailsQueue = new Queue(
  UPDATE_ITEMS_DETAILS_QUEUE_NAME,
  {
    connection: bullmqConnection,
  },
);
