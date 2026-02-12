import { ItemsIdPage } from 'src/core/entitis/madre-api/itemsId/ItemsIdPage';

export interface IGetItemsIdRepository {
  get(params: {
    sellerId: string;
    limit: number;
    lastId?: number | null;
  }): Promise<ItemsIdPage>;
}
