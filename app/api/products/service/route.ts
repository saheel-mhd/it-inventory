import { completeProductService } from "~/server/controllers/product-service-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(completeProductService);
