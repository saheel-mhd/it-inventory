import { createProductDamage } from "~/server/controllers/product-damage-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createProductDamage);
