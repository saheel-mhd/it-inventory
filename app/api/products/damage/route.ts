import { createProductDamage } from "~/server/controllers/product-damage-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createProductDamage);
