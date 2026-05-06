import { updateAssetType } from "~/server/controllers/asset-type-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateAssetType);
