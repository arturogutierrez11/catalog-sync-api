import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ItemsDetailsService } from 'src/app/services/itemsDetails/ItemsDetailsService';

class SyncItemsDetailsDto {
  sellerId: string;
}

@ApiTags('Processes - MercadoLibre')
@Controller('internal/items-details')
export class SyncItemsDetailsController {
  constructor(private readonly service: ItemsDetailsService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Encola el proceso de sincronización de detalles de items',
    description: `
Este endpoint:

1️⃣ Obtiene los Items IDs desde Madre  
2️⃣ Va a MercadoLibre a buscar el detalle de cada producto  
3️⃣ Guarda los datos en Madre vía UPSERT  
4️⃣ Maneja reintentos automáticos  
5️⃣ Persiste estado de sincronización  

⚠️ No ejecuta inmediatamente.
Solo encola el job en BullMQ.
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
  async runSync(@Body() body: SyncItemsDetailsDto) {
    return this.service.runSync(body.sellerId);
  }
}
