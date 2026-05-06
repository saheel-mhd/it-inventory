import { createUser } from "~/server/controllers/user-controller";
import { withApiAdmin } from "~/server/middleware/auth";

export const POST = withApiAdmin(createUser);
