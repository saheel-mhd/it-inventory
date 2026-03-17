import { updateUser } from "~/server/controllers/user-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateUser);
