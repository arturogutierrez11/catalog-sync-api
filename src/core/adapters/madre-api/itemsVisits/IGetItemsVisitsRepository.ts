import {
  MercadoLibreItemVisit,
  MercadoLibreItemVisitsPaginated,
} from 'src/core/entitis/madre-api/itemsVisits/itemsVisits';

export interface IGetItemsVisitsRepository {
  getByItemId(itemId: string): Promise<MercadoLibreItemVisit | null>;

  getAll(params: {
    limit: number;
    offset: number;
  }): Promise<MercadoLibreItemVisitsPaginated>;
}
