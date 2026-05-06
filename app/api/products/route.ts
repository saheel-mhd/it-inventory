import {
  createProduct,
  listProducts,
} from "~/server/controllers/products-controller";
import { withApiManager, withApiSession } from "~/server/middleware/auth";

export const POST = withApiManager(createProduct);
export const GET = withApiSession(listProducts);
