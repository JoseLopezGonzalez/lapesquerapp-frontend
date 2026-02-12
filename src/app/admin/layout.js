import AdminLayoutClient from "./AdminLayoutClient";

// Avoid prerendering admin routes so client-only hooks (e.g. useIsLoggingOut)
// are never run on the server. Required for AdminRouteProtection and Loader.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
