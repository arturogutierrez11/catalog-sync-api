import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { IGetItemsIdRepository } from 'src/core/adapters/madre-api/itemsId/IGetItemsIdRepository';
import { ItemsIdPage } from 'src/core/entitis/madre-api/itemsId/ItemsIdPage';

@Injectable()
export class GetItemsIdRepository implements IGetItemsIdRepository {
  private readonly basePath = '/mercadolibre/items';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async get(params: {
    sellerId: string;
    limit: number;
    lastId?: number;
  }): Promise<ItemsIdPage> {
    const response = await this.httpClient.get<any>(this.basePath, {
      params: {
        sellerId: params.sellerId,
        limit: params.limit,
        lastId: params.lastId ?? undefined,
      },
    });

    return {
      items: response.items ?? [],
      limit: Number(response.limit),
      count: Number(response.count),
      lastId:
        response.lastId !== undefined && response.lastId !== null
          ? Number(response.lastId)
          : null,
      hasNext: Boolean(response.hasNext),
    };
  }
}
