import { MeliProductDetail } from 'src/core/entitis/mercadolibre-api/MeliProductDetail';

export interface IMeliProductDetailRepository {
  getProductById(productId: string): Promise<MeliProductDetail>;
}
