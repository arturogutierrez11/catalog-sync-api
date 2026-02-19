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

  // 🔹 Trae SOLO categorías root
  async getTree(): Promise<Category[]> {
    const response = await this.httpClient.get<Category[]>(
      `${this.basePath}`, // 👈 SIN /tree
    );

    return response ?? [];
  }

  // 🔹 Trae categoría completa por ID
  async getBranchById(categoryId: string): Promise<Category> {
    if (!categoryId) {
      throw new Error('CategoryId is required');
    }

    const response = await this.httpClient.get<Category>(
      `${this.basePath}/${categoryId}`, // 👈 SIN /branch
    );

    if (!response) {
      throw new Error(`Category ${categoryId} not found`);
    }

    return response;
  }
}
