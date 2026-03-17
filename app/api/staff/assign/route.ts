import { assignProductToStaff } from "~/server/controllers/staff-assignment-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(assignProductToStaff);
