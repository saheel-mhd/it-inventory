export type Option = {
  id: string;
  name: string;
  isActive?: boolean;
};

export type CategoryOption = Option & {
  assetTypeId?: string | null;
  prefix?: string | null;
};

export type ProductStatusOption = {
  value: string;
  label: string;
};

export type ProductFormState = {
  product: string;
  brand: string;
  snNumber: string;
  sku: string;
  specification: string;
  orderedDate: string;
  cost: string;
  warrantyPeriodId: string;
  warrantyExpire: string;
  categoryId: string;
  assetTypeId: string;
  status: string;
};

export type ProductFormErrors = Partial<
  Record<keyof ProductFormState | "general", string>
>;

export const emptyProductForm: ProductFormState = {
  product: "",
  brand: "",
  snNumber: "",
  sku: "",
  specification: "",
  orderedDate: "",
  cost: "",
  warrantyPeriodId: "",
  warrantyExpire: "",
  categoryId: "",
  assetTypeId: "",
  status: "",
};
