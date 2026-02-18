import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullMQModule } from './BullMQ/BullMQ.module';
import { ItemsIdBullModule } from './itemsId/ItemsIdBull.module';
import { ItemsIdModule } from './itemsId/ItemsId.module';
import { ItemsDetailsModule } from './itemsDetails/ItemsDetails.Module';
import { ItemsVisitsModule } from './itemsVisits/ItemsVisits.Module';
import { MeliCategoriesModule } from './categories/MeliCategories.Module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMQModule,
    ItemsIdModule,
    ItemsDetailsModule,
    ItemsVisitsModule,
    MeliCategoriesModule,
  ],
})
export class AppModule {}
