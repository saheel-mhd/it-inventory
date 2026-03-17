import { createUser } from "~/server/controllers/user-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createUser);
