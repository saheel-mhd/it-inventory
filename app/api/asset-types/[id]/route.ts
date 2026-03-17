import { updateAssetType } from "~/server/controllers/asset-type-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateAssetType);
