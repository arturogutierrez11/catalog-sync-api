import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { MeliCategoriesService } from 'src/app/services/categories/MeliCategoriesService';

@ApiTags('Sync Data Mercado Libre')
@Controller('internal/meli-categories')
export class SyncMeliCategoriesController {
  constructor(private readonly service: MeliCategoriesService) {}

  @Post('sync')
  @ApiOperation({
    summary:
      'Encola el proceso de sincronización de categorías de MercadoLibre',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'queued',
        job_id: 'meli-categories-sync',
        attempts: 5,
      },
    },
  })
  runSync() {
    return this.service.runSync();
  }
}
