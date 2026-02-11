import { Module, OnModuleInit } from '@nestjs/common';

/**
 * Controllers & Services
 */
import { SyncItemsDetailsController } from 'src/app/controllers/itemsDetails/SyncItemsDetails.controller';

/**
 * Core interactor
 */
import { SyncItemsDetails } from 'src/core/interactors/SyncItemsDetails';

/**
 * Repositories (MADRE API)
 */
import { GetItemsIdRepository } from 'src/core/drivers/madre-api/itemsId/GetItemsIdRepository';
import { SaveItemsDetailsRepository } from 'src/core/drivers/madre-api/itemsDetails/SaveItemsDetailsRepository';
import { SyncStatesRepository } from 'src/core/drivers/madre-api/syncStates/SyncStatesRepository';

/**
 * Repositories (MERCADOLIBRE API)
 */

/**
 * HTTP Clients
 */
import { MeliHttpClient } from 'src/core/drivers/mercadolibre-api/http/MeliHttpClient';
import { MadreHttpClient } from 'src/core/drivers/madre-api/http/MadreHttpClient';
import { ItemsDetailsService } from 'src/app/services/itemsDetails/ItemsDetailsService';
import { GetProductDetailRepository } from 'src/core/drivers/mercadolibre-api/ItemsDetails/GetProductDetailRepository';
import { startItemsDetailsSyncWorker } from 'src/app/drivers/repositories/processBull/ItemsDetail/ItemsDetailsSync.worker';

/**
 * Bull Worker
 */

@Module({
  controllers: [SyncItemsDetailsController],

  providers: [
    /**
     * Service
     */
    ItemsDetailsService,

    /**
     * Core interactor
     */
    SyncItemsDetails,

    /**
     * Repository bindings
     */
    {
      provide: 'IGetItemsIdRepository',
      useClass: GetItemsIdRepository, // MADRE
    },
    {
      provide: 'IMeliProductDetailRepository',
      useClass: GetProductDetailRepository, // MELI
    },
    {
      provide: 'ISaveItemsDetailsRepository',
      useClass: SaveItemsDetailsRepository, // MADRE
    },
    {
      provide: 'ISyncStatesRepository',
      useClass: SyncStatesRepository,
    },

    /**
     * HTTP clients
     */
    {
      provide: 'IMeliHttpClient',
      useClass: MeliHttpClient,
    },
    {
      provide: 'IMadreHttpClient',
      useClass: MadreHttpClient,
    },
  ],

  exports: [SyncItemsDetails],
})
export class ItemsDetailsModule implements OnModuleInit {
  constructor(private readonly syncItemsDetails: SyncItemsDetails) {}

  onModuleInit() {
    startItemsDetailsSyncWorker(this.syncItemsDetails);
  }
}
