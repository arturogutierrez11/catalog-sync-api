export type FlatCategory = {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  path: string;
};
