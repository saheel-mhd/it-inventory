import { createAssetType } from "~/server/controllers/asset-type-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createAssetType);
