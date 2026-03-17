import { updateProduct } from "~/server/controllers/product-detail-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateProduct);
