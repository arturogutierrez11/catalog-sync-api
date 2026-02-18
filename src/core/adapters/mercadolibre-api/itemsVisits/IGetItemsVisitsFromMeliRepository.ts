import { MeliItemVisit } from 'src/core/entitis/mercadolibre-api/itemsVisits/MeliItemVisit';

export interface IGetItemsVisitsFromMeliRepository {
  getByItemId(itemId: string): Promise<MeliItemVisit>;
}
