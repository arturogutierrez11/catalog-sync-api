import { MercadoLibreProduct } from 'src/core/entitis/madre-api/itemsDetails/MercadoLibreProduct';

export interface IUpdateItemsDetailsRepository {
  updateBulk(params: {
    sellerId: string;
    products: MercadoLibreProduct[];
  }): Promise<{ updated: number }>;
}
