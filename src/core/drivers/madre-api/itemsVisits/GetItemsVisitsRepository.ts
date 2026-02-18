import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { IGetItemsVisitsRepository } from 'src/core/adapters/madre-api/itemsVisits/IGetItemsVisitsRepository';
import {
  MercadoLibreItemVisit,
  MercadoLibreItemVisitsPaginated,
} from 'src/core/entitis/madre-api/itemsVisits/itemsVisits';

@Injectable()
export class GetItemsVisitsRepository implements IGetItemsVisitsRepository {
  private readonly basePath = '/mercadolibre/item-visits';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  // ✅ GET ONE
  async getByItemId(itemId: string): Promise<MercadoLibreItemVisit | null> {
    try {
      const response = await this.httpClient.get<MercadoLibreItemVisit>(
        `${this.basePath}/${itemId}`,
      );

      return {
        itemId: response.itemId,
        totalVisits: Number(response.totalVisits),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // ✅ GET PAGINATED
  async getAll(params: {
    limit: number;
    offset: number;
  }): Promise<MercadoLibreItemVisitsPaginated> {
    const response = await this.httpClient.get<MercadoLibreItemVisitsPaginated>(
      this.basePath,
      {
        params: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return {
      items: response.items ?? [],
      total: Number(response.total),
      limit: Number(response.limit),
      offset: Number(response.offset),
      count: Number(response.count),
      hasNext: Boolean(response.hasNext),
      nextOffset:
        response.nextOffset !== undefined ? Number(response.nextOffset) : null,
    };
  }
}
