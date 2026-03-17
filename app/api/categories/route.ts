import { createCategory } from "~/server/controllers/category-controller";
import { withApiSession } from "~/server/middleware/auth";

export const POST = withApiSession(createCategory);
