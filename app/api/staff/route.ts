import { createStaff } from "~/server/controllers/staff-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createStaff);
