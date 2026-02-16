/**
 * Proxy de auth hacia el backend Laravel.
 * Evita CORS: el navegador llama a este endpoint (mismo origen) y Next.js reenvía a la API.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWithTenant } from "@/lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";

const AUTH_SUBPATHS = [
  "request-access",
  "otp/request",
  "otp/verify",
  "magic-link/verify",
] as const;

function getBackendPath(path: string[]): string | null {
  const pathStr = path.join("/");
  if (pathStr === "logout" || pathStr === "me") return pathStr;
  if (AUTH_SUBPATHS.includes(pathStr as (typeof AUTH_SUBPATHS)[number]))
    return "auth/" + pathStr;
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const backendPath = getBackendPath(path);
  if (!backendPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = `${API_URL_V2}${backendPath}`;
  const body = await req.json().catch(() => ({}));
  const authHeader = req.headers.get("authorization");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  const res = await fetchWithTenant(
    url,
    { method: "POST", headers, body: JSON.stringify(body) },
    req.headers
  );

  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (isJson) {
    return NextResponse.json(data, { status: res.status });
  }
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": contentType ?? "text/plain" },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (path.join("/") !== "me") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = `${API_URL_V2}me`;
  const authHeader = req.headers.get("authorization");
  const headers: Record<string, string> = {};
  if (authHeader) headers["Authorization"] = authHeader;

  const res = await fetchWithTenant(
    url,
    { method: "GET", headers },
    req.headers
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
