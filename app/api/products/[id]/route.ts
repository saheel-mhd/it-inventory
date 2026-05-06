import { updateProduct } from "~/server/controllers/product-detail-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateProduct);
