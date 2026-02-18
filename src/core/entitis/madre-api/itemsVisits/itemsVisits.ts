export type MercadoLibreItemVisit = {
  itemId: string;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
};
export type MercadoLibreItemVisitsPaginated = {
  items: MercadoLibreItemVisit[];
  total: number;
  limit: number;
  offset: number;
  count: number;
  hasNext: boolean;
  nextOffset: number | null;
};
