import { createWarrantyPeriod } from "~/server/controllers/warranty-period-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createWarrantyPeriod);
