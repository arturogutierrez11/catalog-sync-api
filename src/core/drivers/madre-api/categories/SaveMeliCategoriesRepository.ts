import { Inject, Injectable } from '@nestjs/common';
import { ISaveMeliCategoriesRepository } from 'src/core/adapters/madre-api/categories/ISaveMeliCategoriesRepository';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { FlatCategory } from 'src/core/entitis/madre-api/categories/FlatCategory';

@Injectable()
export class SaveMeliCategoriesRepository implements ISaveMeliCategoriesRepository {
  private readonly basePath = '/mercadolibre/categories';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async save(categories: FlatCategory[]): Promise<void> {
    if (!categories.length) return;

    await this.httpClient.post(this.basePath, categories);
  }
}
