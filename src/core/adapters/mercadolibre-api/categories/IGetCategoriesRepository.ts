import { Category } from 'src/core/entitis/mercadolibre-api/categories/Category';

export interface IGetCategoriesRepository {
  getTree(): Promise<{ id: string; name: string }[]>;
  getBranchById(categoryId: string): Promise<Category>;
}
