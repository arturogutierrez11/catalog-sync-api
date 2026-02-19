import { Category } from 'src/core/entitis/mercadolibre-api/categories/Category';

export interface IGetCategoriesRepository {
  getTree(): Promise<Category[]>;

  getBranchById(categoryId: string): Promise<Category>;

  getFullTree(): Promise<Category[]>;
}
