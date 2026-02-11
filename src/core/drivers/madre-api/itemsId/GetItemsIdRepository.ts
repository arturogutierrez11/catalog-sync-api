import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { IGetItemsIdRepository } from 'src/core/adapters/madre-api/itemsId/IGetItemsIdRepository';
import { ItemsIdPage } from 'src/core/entitis/madre-api/itemsId/ItemsIdPage';

@Injectable()
export class GetItemsIdRepository implements IGetItemsIdRepository {
  private readonly basePath = '/items/ids';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async get(params: {
    sellerId: string;
    limit: number;
    offset: number;
  }): Promise<ItemsIdPage> {
    return this.httpClient.get<ItemsIdPage>(this.basePath, {
      params: {
        seller_id: params.sellerId,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }
}
