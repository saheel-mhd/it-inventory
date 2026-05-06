import { createAssetType } from "~/server/controllers/asset-type-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createAssetType);
