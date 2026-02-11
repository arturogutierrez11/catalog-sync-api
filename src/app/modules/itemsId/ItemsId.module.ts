import { Module, OnModuleInit } from '@nestjs/common';

/**
 * Controllers & Services (HTTP)
 */
import { ItemsIdController } from 'src/app/controllers/itemsId/ItemsId.controller';
import { ItemsIdService } from 'src/app/services/itemsId/ItemsIdService';

/**
 * Core interactor
 */
import { SyncItemsId } from 'src/core/interactors/SyncItemsId';

/**
 * Repositories (MADRE API)
 */
import { SaveItemsIdRepository } from 'src/core/drivers/madre-api/itemsId/SaveItemsIdRepository';
import { SyncStatesRepository } from 'src/core/drivers/madre-api/syncStates/SyncStatesRepository';

/**
 * Repositories (MERCADOLIBRE API)
 */

/**
 * HTTP Clients
 */
import { MeliHttpClient } from 'src/core/drivers/mercadolibre-api/http/MeliHttpClient';
import { MadreHttpClient } from 'src/core/drivers/madre-api/http/MadreHttpClient';

/**
 * BullMQ Worker bootstrap
 */
import { startItemsIdSyncWorker } from 'src/app/drivers/repositories/processBull/itemsId/ItemsIdSync.worker';
import { GetSellerItemsRepository } from 'src/core/drivers/mercadolibre-api/itemsId/GetItemsIdRepository';

@Module({
  controllers: [ItemsIdController],

  providers: [
    /**
     * Services
     */
    ItemsIdService,

    /**
     * Core interactor
     */
    SyncItemsId,

    /**
     * Repositories bindings
     */
    {
      provide: 'IGetItemsIdRepository',
      useClass: GetSellerItemsRepository, // 🔥 MERCADOLIBRE
    },
    {
      provide: 'ISaveItemsIdRepository',
      useClass: SaveItemsIdRepository, // MADRE
    },
    {
      provide: 'ISyncStatesRepository',
      useClass: SyncStatesRepository, // MADRE
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

  exports: [
    // por si otro módulo lo necesita
    SyncItemsId,
  ],
})
export class ItemsIdModule implements OnModuleInit {
  constructor(private readonly syncItemsId: SyncItemsId) {}

  onModuleInit() {
    // 🔥 Levanta el worker UNA sola vez
    startItemsIdSyncWorker(this.syncItemsId);
  }
}
