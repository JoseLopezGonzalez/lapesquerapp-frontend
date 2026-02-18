export function safeRedirectFrom(from: string | null | undefined): string | null {
  if (!from || typeof from !== "string") return null;
  const path = from.trim();
  if (
    path === "" ||
    !path.startsWith("/") ||
    path.includes("//") ||
    /^https?:\/\//i.test(path)
  )
    return null;
  return path;
}

export interface LoginRedirectUser {
  role?: string | string[] | null;
}

export function getRedirectUrl(user: LoginRedirectUser, searchString = ""): string {
  const params = new URLSearchParams(
    typeof searchString === "string" ? searchString : ""
  );
  const from = params.get("from");
  const safeFrom = safeRedirectFrom(from);
  const role = Array.isArray(user?.role) ? user?.role[0] : user?.role;
  if (role === "operario") return "/operator";
  if (role === "comercial") return "/comercial";
  return safeFrom || "/admin/home";
}
