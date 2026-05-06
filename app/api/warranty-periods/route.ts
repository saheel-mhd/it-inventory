import { createWarrantyPeriod } from "~/server/controllers/warranty-period-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createWarrantyPeriod);
