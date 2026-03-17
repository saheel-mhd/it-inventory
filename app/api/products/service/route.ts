import { completeProductService } from "~/server/controllers/product-service-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(completeProductService);
