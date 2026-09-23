import { essentialQuestion, parseRequest } from "../../../lib/first-use";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Please add your request." }, { status: 400, headers });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 90000) {
        await reader.cancel();
        return Response.json({ error: "That request is too long. Please shorten it." }, { status: 413, headers });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const input = parseRequest(JSON.parse(new TextDecoder().decode(body)));
    if (!input) return Response.json({ error: "Please choose a task and add up to 12,000 characters of context." }, { status: 400, headers });
    const question = essentialQuestion(input);
    if (question) return Response.json({ status: "clarification_required", question }, { headers });
    // FAN-14 boundary: no generation, queue, or server persistence is claimed.
    return Response.json({ status: "ready", request: input, generationAvailable: false }, { headers });
  } catch {
    return Response.json({ error: "We could not read that request. Please try again." }, { status: 400, headers });
  }
}
