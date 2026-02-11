import { ItemsId } from 'src/core/entitis/mercadolibre-api/ItemsId';

export interface GetItemsIdParams {
  limit: number;
  offset: number;
  status?: 'active' | 'paused' | 'closed';
}

export interface IGetItemsIdRepository {
  getSellerItems(params: GetItemsIdParams): Promise<ItemsId>;
}
