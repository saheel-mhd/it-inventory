/**
 * Best-effort client IP extraction. Honors the standard proxy headers in
 * order of preference. Behind a trusted reverse proxy (Vercel, Nginx, etc.)
 * this returns the real client IP; otherwise falls back to remote-addr-style
 * headers Next.js may set.
 */
export function getClientIp(request: Request): string | null {
  const headers = request.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    null
  );
}
