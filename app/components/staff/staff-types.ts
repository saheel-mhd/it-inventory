export type ProductOption = {
  id: string;
  sku: string;
  product: string;
};

export type StaffInventoryRow = {
  id: string;
  product: ProductOption;
  quantity: number;
  startDate: string;
  returnDate: string | null;
  returnReason?: string | null;
  returnReasonNote?: string | null;
};

export type StaffRow = {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryUsingCount: number;
  inventoryUsing: StaffInventoryRow[];
};
