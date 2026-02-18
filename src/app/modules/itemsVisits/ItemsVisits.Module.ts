import { Module, OnModuleInit } from '@nestjs/common';

import { ItemsVisitsService } from 'src/app/services/itemsVisits/ItemsVisitsService';

import { SyncItemsVisits } from 'src/core/interactors/SyncItemsVisits';

import { GetItemsIdRepository } from 'src/core/drivers/madre-api/itemsId/GetItemsIdRepository';
import { SyncStatesRepository } from 'src/core/drivers/madre-api/syncStates/SyncStatesRepository';

import { SaveItemsVisitsRepository } from 'src/core/drivers/madre-api/itemsVisits/SaveItemsVisitsRepository';

import { MeliHttpClient } from 'src/core/drivers/mercadolibre-api/http/MeliHttpClient';
import { MadreHttpClient } from 'src/core/drivers/madre-api/http/MadreHttpClient';
import { SyncItemsVisitsController } from 'src/app/controllers/itemsVisits/SyncItemsVisits.Controller';
import { GetItemsVisitsRepository } from 'src/core/drivers/mercadolibre-api/itemsVisits/GetItemsVisitsRepository';
import { startItemsVisitsSyncWorker } from 'src/app/drivers/repositories/processBull/itemsVisits/ItemsVisitsSync.worker';

@Module({
  controllers: [SyncItemsVisitsController],
  providers: [
    ItemsVisitsService,
    SyncItemsVisits,

    {
      provide: 'IGetItemsIdRepository',
      useClass: GetItemsIdRepository,
    },
    {
      provide: 'IGetItemsVisitsFromMeliRepository',
      useClass: GetItemsVisitsRepository,
    },
    {
      provide: 'ISaveItemsVisitsRepository',
      useClass: SaveItemsVisitsRepository,
    },
    {
      provide: 'ISyncStatesRepository',
      useClass: SyncStatesRepository,
    },

    {
      provide: 'IMeliHttpClient',
      useClass: MeliHttpClient,
    },
    {
      provide: 'IMadreHttpClient',
      useClass: MadreHttpClient,
    },
  ],
})
export class ItemsVisitsModule implements OnModuleInit {
  constructor(private readonly syncItemsVisits: SyncItemsVisits) {}

  onModuleInit() {
    startItemsVisitsSyncWorker(this.syncItemsVisits);
  }
}
