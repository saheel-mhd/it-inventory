import { updateCategory } from "~/server/controllers/category-controller";
import { withApiSession } from "~/server/middleware/auth";

export const PATCH = withApiSession(updateCategory);
