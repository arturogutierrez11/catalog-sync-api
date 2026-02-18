import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { ItemsIdService } from 'src/app/services/itemsId/ItemsIdService';

@ApiTags('Sync Data Mercado Libre')
@Controller('internal/items-id')
export class ItemsIdController {
  constructor(private readonly service: ItemsIdService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Encola el proceso de sincronización de items IDs de MercadoLibre',

    description: `
Dispara el proceso **ItemsId** vía BullMQ.

📌 **Notas**
- No ejecuta lógica directa
- Encola el job
- El progreso se maneja con sync_states en madre-api
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        seller_id: {
          type: 'string',
          example: '1757836744',
        },
      },
      required: ['seller_id'],
    },
  })
  async sync(@Body() body: { seller_id: string }) {
    return this.service.runSync(body.seller_id);
  }
}
