import {
  createLocation,
  listLocations,
} from "~/server/controllers/location-controller";
import { withApiManager, withApiSession } from "~/server/middleware/auth";

export const GET = withApiSession(listLocations);
export const POST = withApiManager(createLocation);
