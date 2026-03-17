import { updateStaff } from "~/server/controllers/staff-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateStaff);
