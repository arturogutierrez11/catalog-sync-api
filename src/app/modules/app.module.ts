import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullMQModule } from './BullMQ/BullMQ.module';
import { ItemsIdBullModule } from './itemsId/ItemsIdBull.module';
import { ItemsIdModule } from './itemsId/ItemsId.module';
import { ItemsDetailsModule } from './itemsDetails/ItemsDetails.Module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMQModule,
    ItemsIdModule,
    ItemsDetailsModule,
  ],
})
export class AppModule {}
