import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

export interface IGetItemsDetailsRepository {
  getByIds(params: {
    sellerId: string;
    ids: string[];
  }): Promise<MercadoLibreProduct[]>;
}
