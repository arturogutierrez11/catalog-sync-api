import { FlatCategory } from 'src/core/entitis/madre-api/categories/FlatCategory';

export interface ISaveMeliCategoriesRepository {
  save(categories: FlatCategory[]): Promise<void>;
}
