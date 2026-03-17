import { changePassword } from "~/server/controllers/auth-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(changePassword);
