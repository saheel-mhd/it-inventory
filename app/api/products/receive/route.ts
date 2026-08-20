import { receiveProducts } from "~/server/controllers/receive-products-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(receiveProducts);
