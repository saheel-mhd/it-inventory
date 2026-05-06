import { updateCategory } from "~/server/controllers/category-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateCategory);
