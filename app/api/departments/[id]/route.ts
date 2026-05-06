import { updateDepartment } from "~/server/controllers/department-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateDepartment);
