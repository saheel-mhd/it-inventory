import {
  createProduct,
  listProducts,
} from "~/server/controllers/products-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createProduct);
export const GET = withApiSession(listProducts);
