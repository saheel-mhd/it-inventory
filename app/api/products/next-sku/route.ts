import { getNextSku } from "~/server/controllers/products-controller";
import { withApiSession } from "~/server/middleware/auth";

export const GET = withApiSession(getNextSku);
