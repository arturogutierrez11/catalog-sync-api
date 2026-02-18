import { Module, OnModuleInit } from '@nestjs/common';

/**
 * Controllers & Services
 */

/**
 * Core interactor
 */
import { UpdateItemsDetails } from 'src/core/interactors/UpdateItemsDetails';

/**
 * Repositories (MADRE API)
 */
import { GetItemsIdRepository } from 'src/core/drivers/madre-api/itemsId/GetItemsIdRepository';
import { GetItemsDetailsRepository } from 'src/core/drivers/madre-api/itemsDetails/GetItemsDetailsRepository';
import { SaveItemsDetailsRepository } from 'src/core/drivers/madre-api/itemsDetails/SaveItemsDetailsRepository';
import { UpdateItemsDetailsRepository } from 'src/core/drivers/madre-api/itemsDetails/UpdateItemsDetailsRepository';
import { SyncStatesRepository } from 'src/core/drivers/madre-api/syncStates/SyncStatesRepository';

/**
 * Repositories (MERCADOLIBRE API)
 */
import { GetProductDetailRepository } from 'src/core/drivers/mercadolibre-api/ItemsDetails/GetProductDetailRepository';

/**
 * HTTP Clients
 */
import { MeliHttpClient } from 'src/core/drivers/mercadolibre-api/http/MeliHttpClient';
import { MadreHttpClient } from 'src/core/drivers/madre-api/http/MadreHttpClient';

/**
 * Bull Worker
 */
import { UpdateItemsDetailsController } from 'src/app/controllers/itemsDetails/updated/UpdateItemsDetails.Controller';
import { UpdateItemsDetailsService } from 'src/app/services/itemsDetails/updated/UpdateItemsDetailsService';
import { UpdateItemsDetailsWorker } from 'src/app/drivers/repositories/processBull/ItemsDetail/updated/UpdateItemsDetails.worker';
import {
  UPDATE_ITEMS_DETAILS_QUEUE_NAME,
  UpdateItemsDetailsQueue,
} from 'src/app/drivers/repositories/processBull/ItemsDetail/updated/UpdatedDetailsJob.queue';

@Module({
  controllers: [UpdateItemsDetailsController],

  providers: [
    UpdateItemsDetailsService,
    UpdateItemsDetails,

    // QUEUE
    {
      provide: UPDATE_ITEMS_DETAILS_QUEUE_NAME,
      useValue: UpdateItemsDetailsQueue,
    },

    // MADRE
    {
      provide: 'IGetItemsIdRepository',
      useClass: GetItemsIdRepository,
    },
    {
      provide: 'IGetItemsDetailsRepository',
      useClass: GetItemsDetailsRepository,
    },
    {
      provide: 'ISaveItemsDetailsRepository',
      useClass: SaveItemsDetailsRepository,
    },
    {
      provide: 'IUpdateItemsDetailsRepository',
      useClass: UpdateItemsDetailsRepository,
    },
    {
      provide: 'ISyncStatesRepository',
      useClass: SyncStatesRepository,
    },

    // MELI
    {
      provide: 'IMeliProductDetailRepository',
      useClass: GetProductDetailRepository,
    },

    // HTTP
    {
      provide: 'IMadreHttpClient',
      useClass: MadreHttpClient,
    },
    {
      provide: 'IMeliHttpClient',
      useClass: MeliHttpClient,
    },
  ],
})
export class UpdateItemsDetailsModule implements OnModuleInit {
  constructor(private readonly interactor: UpdateItemsDetails) {}

  onModuleInit() {
    UpdateItemsDetailsWorker(this.interactor);
  }
}
