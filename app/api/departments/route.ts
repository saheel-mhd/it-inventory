import { createDepartment } from "~/server/controllers/department-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createDepartment);
