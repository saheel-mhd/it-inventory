import { updateWarrantyPeriod } from "~/server/controllers/warranty-period-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateWarrantyPeriod);
