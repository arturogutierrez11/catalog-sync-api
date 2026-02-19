import { Inject, Injectable } from '@nestjs/common';
import type { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { IGetCategoriesRepository } from 'src/core/adapters/mercadolibre-api/categories/IGetCategoriesRepository';
import { Category } from 'src/core/entitis/mercadolibre-api/categories/Category';

@Injectable()
export class GetCategoriesRepository implements IGetCategoriesRepository {
  private readonly basePath = '/meli/categories';

  constructor(
    @Inject('IMeliHttpClient')
    private readonly httpClient: IMeliHttpClient,
  ) {}

  // 🔹 1) Trae SOLO nivel 1 (32 categorías root)
  async getTree(): Promise<Category[]> {
    const response = await this.httpClient.get<Category[]>(
      `${this.basePath}/tree`,
    );

    return response ?? [];
  }

  // 🔹 2) Trae rama COMPLETA de una categoría root
  async getBranchById(categoryId: string): Promise<Category> {
    if (!categoryId) {
      throw new Error('CategoryId is required');
    }

    const response = await this.httpClient.get<Category>(
      `${this.basePath}/${categoryId}/branch`,
    );

    if (!response) {
      throw new Error(`Category branch ${categoryId} not found`);
    }

    return response;
  }
}
