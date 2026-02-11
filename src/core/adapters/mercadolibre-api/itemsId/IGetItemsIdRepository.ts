import { ItemsId } from 'src/core/entitis/mercadolibre-api/ItemsId';

export interface GetItemsIdParams {
  status?: 'active' | 'paused' | 'closed';
  offset?: number;
  limit?: number;
  useScan?: boolean;
  scrollId?: string;
}

export interface IGetItemsIdRepository {
  getSellerItems(params: GetItemsIdParams): Promise<ItemsId>;
}
