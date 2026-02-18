import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { IUpdateItemsDetailsRepository } from 'src/core/adapters/madre-api/itemsDetails/IUpdateItemsDetailsRepository';

@Injectable()
export class UpdateItemsDetailsRepository implements IUpdateItemsDetailsRepository {
  private readonly basePath = '/mercadolibre/products';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async updateBulk(params: {
    sellerId: string;
    products: {
      id: string;
      categoryId?: string | null;
      price?: number;
      stock?: number;
      soldQuantity?: number;
      status?: string;
      freeShipping?: boolean;
      health?: number;
      lastUpdated?: string;
    }[];
  }): Promise<{ updated: number }> {
    if (!params.products?.length) {
      return { updated: 0 };
    }

    const response = await this.httpClient.patch<{ updated: number }>(
      this.basePath,
      params,
    );

    return {
      updated: response?.updated ?? 0,
    };
  }
}
