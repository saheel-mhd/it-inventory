import { ComponentType } from "react";

export type NamedItem = {
  id: string;
  name: string;
  isActive: boolean;
};

export type CategoryItem = NamedItem & {
  assetTypeName: string | null;
  prefix?: string | null;
};

export type WarrantyItem = NamedItem & {
  months: number;
};

export type ConfigureGridProps = {
  initialCategories: CategoryItem[];
  initialAssetTypes: NamedItem[];
  initialDepartments: NamedItem[];
  initialWarrantyPeriods: WarrantyItem[];
};

export type ToastState = {
  type: "error" | "success";
  message: string;
} | null;

export type ConfigType = "category" | "assetType" | "department" | "warranty";

export type ConfigMeta = {
  key: ConfigType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  listTitle: string;
  addTitle: string;
  editTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  createEndpoint: string;
  itemEndpoint: string;
  successAddMessage: string;
  successEditMessage: string;
  successInactiveMessage: string;
  successActiveMessage: string;
};

export type GenericItem = NamedItem | CategoryItem | WarrantyItem;
