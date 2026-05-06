import { updateUser } from "~/server/controllers/user-controller";
import { withApiAdmin } from "~/server/middleware/auth";

export const PATCH = withApiAdmin(updateUser);
