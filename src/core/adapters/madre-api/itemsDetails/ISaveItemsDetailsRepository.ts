import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

export interface ISaveItemsDetailsRepository {
  saveBulk(params: {
    sellerId: string;
    products: MercadoLibreProduct[];
  }): Promise<number>;

  get(params: {
    sellerId: string;
    limit: number;
    offset: number;
  }): Promise<any>;
}
