import { proxyScreenGraphql } from "../lib/screen-proxy";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  try {
    const result = await proxyScreenGraphql(await req.text());
    return new Response(result.body, {
      status: result.status,
      headers: { "Content-Type": result.contentType },
    });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}
