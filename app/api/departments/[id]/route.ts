import { updateDepartment } from "~/server/controllers/department-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateDepartment);
