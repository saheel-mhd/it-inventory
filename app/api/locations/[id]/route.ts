import { updateLocation } from "~/server/controllers/location-controller";
import { withApiManager } from "~/server/middleware/auth";

export const PATCH = withApiManager(updateLocation);
