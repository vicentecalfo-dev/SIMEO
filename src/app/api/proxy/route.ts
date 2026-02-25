import { validateUpstreamUrl } from "@/app/api/proxy/validate-upstream-url";

export const runtime = "nodejs";

const REQUEST_HEADER_ALLOWLIST = ["Range", "If-None-Match", "If-Modified-Since"] as const;
const RESPONSE_HEADER_ALLOWLIST = [
  "Content-Type",
  "Content-Length",
  "Content-Range",
  "Accept-Ranges",
  "ETag",
  "Last-Modified",
  "Cache-Control",
] as const;

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Range,If-None-Match,If-Modified-Since,Content-Type",
  );
  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Type,Content-Length,Content-Range,Accept-Ranges,ETag,Last-Modified",
  );
  return headers;
}

function withCorsHeaders(base?: HeadersInit): Headers {
  const headers = new Headers(base);
  const cors = corsHeaders();
  cors.forEach((value, key) => headers.set(key, value));
  return headers;
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: withCorsHeaders({
      "Content-Type": "text/plain; charset=utf-8",
    }),
  });
}

function readUpstreamUrlFromRequest(request: Request): URL {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get("url") ?? "";
  return validateUpstreamUrl(rawUrl);
}

function buildUpstreamRequestHeaders(request: Request): Headers {
  const headers = new Headers();

  for (const headerName of REQUEST_HEADER_ALLOWLIST) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function buildClientResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  for (const headerName of RESPONSE_HEADER_ALLOWLIST) {
    const value = upstream.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return withCorsHeaders(headers);
}

async function handleProxyRequest(request: Request, method: "GET" | "HEAD"): Promise<Response> {
  let upstreamUrl: URL;
  try {
    upstreamUrl = readUpstreamUrlFromRequest(request);
  } catch {
    return createErrorResponse("URL inválida para proxy.", 400);
  }

  const upstreamHeaders = buildUpstreamRequestHeaders(request);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      redirect: "follow",
    });
  } catch {
    return createErrorResponse("Falha ao acessar upstream.", 502);
  }

  const responseHeaders = buildClientResponseHeaders(upstreamResponse);

  return new Response(method === "HEAD" ? null : upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request): Promise<Response> {
  return handleProxyRequest(request, "GET");
}

export async function HEAD(request: Request): Promise<Response> {
  return handleProxyRequest(request, "HEAD");
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

/*
Uso:
  /api/proxy?url=<URL_ENCODED>

Exemplo:
  /api/proxy?url=https%3A%2F%2Fstorage.googleapis.com%2Fmapbiomas-public%2F...

Teste manual:
1) Rodar dev server:
   pnpm dev

2) No browser:
   fetch("/api/proxy?url=" + encodeURIComponent("https://storage.googleapis.com/mapbiomas-public/...tif"), {
     headers: { Range: "bytes=0-1023" }
   }).then((r) => console.log(r.status, r.headers.get("content-range"), r.headers.get("accept-ranges")));

Esperado:
- status 206 (ideal) ou 200 (se upstream ignorar range)
- sem erro de CORS
- content-range quando 206
*/
