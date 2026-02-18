import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ItemsVisitsService } from 'src/app/services/itemsVisits/ItemsVisitsService';

class SyncItemsVisitsDto {
  sellerId: string;
}

@ApiTags('Sync Data Mercado Libre')
@Controller('internal/items-visits')
export class SyncItemsVisitsController {
  constructor(private readonly service: ItemsVisitsService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Encola el proceso de sincronización de visitas de items',
    description: `
Este endpoint:

1️⃣ Obtiene los Items IDs desde Madre  
2️⃣ Va a MercadoLibre a buscar las visitas de cada item  
3️⃣ Guarda las visitas en Madre vía UPSERT  
4️⃣ Maneja reintentos automáticos  
5️⃣ Persiste estado de sincronización  

⚠️ Solo encola el job en BullMQ.
    `,
  })
  @ApiBody({
    schema: {
      example: {
        sellerId: '1757836744',
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'queued',
        seller_id: '1757836744',
        job_id: '123',
        attempts: 5,
      },
    },
  })
  async runSync(@Body() body: SyncItemsVisitsDto) {
    return this.service.runSync(body.sellerId);
  }
}
