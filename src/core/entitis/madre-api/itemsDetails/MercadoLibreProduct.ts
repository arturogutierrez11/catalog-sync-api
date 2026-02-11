export interface MercadoLibreProduct {
  id: string;

  title: string;

  price: number;
  currency: string;

  stock: number;
  soldQuantity: number;

  status: string;
  condition: string;

  permalink: string;
  thumbnail: string;

  pictures: string[];

  sellerSku: string | null;

  brand: string | null;
  warranty: string | null;

  freeShipping: boolean;

  health: number | null;

  lastUpdated: string | null; // ISO string (la convertimos en repo SQL)

  description: string | null;
}
