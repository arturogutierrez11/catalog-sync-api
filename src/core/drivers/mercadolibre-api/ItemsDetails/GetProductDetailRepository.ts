import { Inject, Injectable } from '@nestjs/common';
import { IMeliProductDetailRepository } from 'src/core/adapters/mercadolibre-api/getDetails/IMeliProductDetailRepository';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { MeliProductDetail } from 'src/core/entitis/mercadolibre-api/MeliProductDetail';

@Injectable()
export class GetProductDetailRepository implements IMeliProductDetailRepository {
  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  async getProductById(productId: string): Promise<MeliProductDetail> {
    const response = await this.httpClient.get<any>(
      `/meli/products/${productId}`,
    );

    return {
      id: response.id,
      title: response.title,
      price: response.price,
      currency: response.currency,
      stock: response.stock,
      soldQuantity: response.soldQuantity,
      status: response.status,
      condition: response.condition,
      permalink: response.permalink,
      thumbnail: response.thumbnail,
      pictures: response.pictures ?? [],
      sellerSku: response.sellerSku,
      brand: response.brand,
      warranty: response.warranty,
      freeShipping: response.freeShipping,
      health: response.health,
      lastUpdated: response.lastUpdated,
      description: response.description,
    };
  }
}
