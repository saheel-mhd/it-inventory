import { updateWarrantyPeriod } from "~/server/controllers/warranty-period-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateWarrantyPeriod);
