import { resignStaff } from "~/server/controllers/staff-assignment-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(resignStaff);
