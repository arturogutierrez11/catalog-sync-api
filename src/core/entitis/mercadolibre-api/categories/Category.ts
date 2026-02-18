export type Category = {
  id: string;
  name: string;
  hasChildren: boolean;
  children: Category[];
};
