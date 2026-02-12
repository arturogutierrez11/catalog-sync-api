export type ItemsIdPage = {
  items: string[];
  limit: number;
  count: number;
  lastId: number | null;
  hasNext: boolean;
};
