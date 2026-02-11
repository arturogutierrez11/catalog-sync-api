import { Module, OnModuleInit } from '@nestjs/common';
import { startItemsIdSyncWorker } from 'src/app/drivers/repositories/processBull/itemsId/ItemsIdSync.worker';
import { SyncItemsId } from 'src/core/interactors/SyncItemsId';

@Module({
  providers: [SyncItemsId],
})
export class ItemsIdBullModule implements OnModuleInit {
  constructor(private readonly syncItemsId: SyncItemsId) {}

  onModuleInit() {
    startItemsIdSyncWorker(this.syncItemsId);
  }
}
