import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullMQModule } from './BullMQ/BullMQ.module';
import { ItemsIdBullModule } from './itemsId/ItemsIdBull.module';
import { ItemsIdModule } from './itemsId/ItemsId.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMQModule,
    ItemsIdModule,
  ],
})
export class AppModule {}
