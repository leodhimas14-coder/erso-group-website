// Reads a fuel report photo with Claude for /karburant/. The page sends the photo and the
// prompt; the API key stays here (Netlify env ANTHROPIC_API_KEY). KARBURANT_PIN, when set,
// is a shared code staff type once so strangers can't spend the key.
// The answer can take a minute, so the response streams: spaces keep the connection open
// and the JSON result follows (leading whitespace is valid JSON).
import Anthropic from "npm:@anthropic-ai/sdk";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default async (req) => {
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  const pin = Netlify.env.get("KARBURANT_PIN") || "";
  if (req.method === "GET") return json({ configured: !!apiKey, pin: !!pin });
  if (req.method !== "POST") return json({ error: "bad_request" }, 405);
  if (!apiKey) return json({ error: "not_configured" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (pin && body.pin !== pin) return json({ error: "bad_pin" }, 401);
  const { image, mediaType, prompt } = body;
  if (typeof image !== "string" || typeof prompt !== "string" || !TYPES.includes(mediaType) || prompt.length > 20000) {
    return json({ error: "bad_request" }, 400);
  }
  if (image.length > 7_000_000) return json({ error: "too_large" }, 413);

  const client = new Anthropic({ apiKey });
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      ctrl.enqueue(enc.encode(" "));
      const beat = setInterval(() => ctrl.enqueue(enc.encode(" ")), 10_000);
      let result;
      try {
        const msg = await client.beta.messages
          .stream({
            model: "claude-opus-5-5",
            max_tokens: 16000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium" },
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
                { type: "text", text: prompt },
              ],
            }],
          })
          .finalMessage();
        if (msg.stop_reason === "refusal") result = { error: "refused" };
        else result = { text: msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""), truncated: msg.stop_reason === "max_tokens" };
      } catch (e) {
        console.error("lexo-foto", e?.status, e?.message);
        result = { error: e instanceof Anthropic.RateLimitError ? "rate_limited" : "upstream_error" };
      } finally {
        clearInterval(beat);
      }
      ctrl.enqueue(enc.encode(JSON.stringify(result)));
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
};

export const config = { path: "/api/lexo-foto" };
