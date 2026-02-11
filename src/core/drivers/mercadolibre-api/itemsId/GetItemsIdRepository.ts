import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import {
  GetItemsIdParams,
  IGetItemsIdRepository,
} from 'src/core/adapters/mercadolibre-api/itemsId/IGetItemsIdRepository';
import { ItemsId } from 'src/core/entitis/mercadolibre-api/ItemsId';

@Injectable()
export class GetSellerItemsRepository implements IGetItemsIdRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getSellerItems(params: GetItemsIdParams): Promise<ItemsId> {
    const response = await this.httpClient.get<any>('/mercadolibre/products', {
      params,
    });

    // 🔴 SCAN MODE
    if (params.useScan) {
      return {
        sellerId: response.seller_id,
        items: response.items ?? [],
        scrollId: response.scroll_id,
      };
    }

    // 🔵 OFFSET MODE
    return {
      sellerId: response.seller_id,
      items: response.items ?? [],
      pagination: {
        limit: response.pagination.limit,
        offset: response.pagination.offset,
        total: response.pagination.total,
        hasNext: response.pagination.has_next,
      },
    };
  }
}
