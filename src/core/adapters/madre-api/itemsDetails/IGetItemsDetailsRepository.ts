import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

export interface IGetItemsDetailsRepository {
  getByIds(params: { ids: string[] }): Promise<MercadoLibreProduct[]>;
}
