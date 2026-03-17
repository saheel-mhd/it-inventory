import { redirect } from "next/navigation";
import { getActiveSessionStatusUser } from "~/server/auth/session";

export default async function HomePage() {
  const user = await getActiveSessionStatusUser();
  redirect(user ? "/dashboard" : "/login");
}
