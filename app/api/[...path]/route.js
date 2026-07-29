const DJANGO = process.env.DJANGO_API_URL || "http://localhost:8000";

async function handler(request, { params }) {
  const path = (await params).path.join("/");
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${DJANGO}/${path}/${query ? "?" + query : ""}`;

  const token = request.headers.get("authorization");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  // Forward body for POST/PUT
  let body;
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    body = await request.text();
  }

  const res = await fetch(url, { method: request.method, headers, body });

  // Handle file downloads (Excel)
  const contentType = res.headers.get("content-type") || "";
  if (
    contentType.includes("spreadsheet") ||
    contentType.includes("octet-stream")
  ) {
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": res.headers.get("content-disposition") || "",
      },
    });
  }

  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
