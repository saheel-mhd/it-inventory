import { createCategory } from "~/server/controllers/category-controller";
import { withApiManager } from "~/server/middleware/auth";

export const POST = withApiManager(createCategory);
