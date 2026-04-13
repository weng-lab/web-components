const UPSTREAM = "https://screen.api.wenglab.org/graphql";

export async function proxyScreenGraphql(body: string): Promise<{
  status: number;
  contentType: string;
  body: string;
}> {
  const apiKey = process.env.SCREEN_API_KEY;
  if (!apiKey) throw new Error("SCREEN_API_KEY is not set");
  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body,
  });
  return {
    status: upstream.status,
    contentType: upstream.headers.get("content-type") ?? "application/json",
    body: await upstream.text(),
  };
}
