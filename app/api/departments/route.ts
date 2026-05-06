import { createDepartment } from "~/server/controllers/department-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createDepartment);
