export type InventoryOption = {
  id: string;
  name: string;
  assetTypeId?: string | null;
  prefix?: string | null;
  isActive?: boolean;
};

export type InventoryProduct = {
  id: string;
  product: string;
  brand: string;
  snNumber: string | null;
  sku: string;
  specification: string | null;
  orderedDate: string | null;
  cost: string | null;
  warrantyPeriodId: string | null;
  warrantyName: string | null;
  warrantyExpire: string | null;
  categoryId: string;
  assetTypeId: string;
  assignedTo: string | null;
  activeAssignmentId: string | null;
  status: string;
  createdAt: string;
  category?: InventoryOption | null;
  assetType?: InventoryOption | null;
};
