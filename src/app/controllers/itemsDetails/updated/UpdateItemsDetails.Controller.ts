import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UpdateItemsDetailsService } from 'src/app/services/itemsDetails/updated/UpdateItemsDetailsService';

class UpdateItemsDto {
  sellerId: string;
}

@ApiTags('Internal - Update Items Details')
@Controller('internal/items-details')
export class UpdateItemsDetailsController {
  constructor(private readonly service: UpdateItemsDetailsService) {}

  @Post('update')
  @ApiOperation({
    summary: 'Encola actualización parcial de productos',
  })
  @ApiBody({
    schema: {
      example: {
        sellerId: '1757836744',
      },
    },
  })
  async run(@Body() body: UpdateItemsDto) {
    return this.service.runUpdate(body.sellerId);
  }
}
