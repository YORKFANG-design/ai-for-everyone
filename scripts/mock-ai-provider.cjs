const http = require("node:http");
const port = Number(process.env.MOCK_AI_PORT || 4111);
function bodyFor(messages) {
  const joined = messages.map(m => m.content || "").join("\n");
  const transform = joined.includes("Revise the existing result");
  if (joined.includes('"kind":"reply"')) {
    const text = joined.includes("meaningfully shorter") ? "Thanks for reviewing the proposal. Happy to answer any questions." : joined.includes("warmer and more human") ? "Hi — I hope you’re doing well. Just checking in on the proposal and happy to help with any questions whenever it suits you." : joined.includes("more professional") ? "Hello — I’m following up regarding the proposal. Please let me know if I can clarify any details or support the next step." : transform ? "Hi — a quick follow-up on the proposal. I’m happy to answer any questions or adjust the next step when convenient." : "Hi — just checking in to see if you had any questions about the proposal. Happy to clarify anything when convenient.";
    return { kind: "reply", text };
  }
  if (joined.includes('"kind":"summary"')) return { kind: "summary", summary: transform ? "Friday launch remains the agreed target." : "The team agreed to launch Friday.", keyPoints: ["Launch is planned for Friday.", "Sam will finish the draft Tuesday."], actions: [{ task: "Finish the draft", owner: "Sam", deadline: "Tuesday" }] };
  return { kind: "plan", goal: "Prepare for the customer meeting", steps: transform ? [{ step: "Review the brief", detail: null }, { step: "Prepare three options", detail: null }] : [{ step: "Review the customer brief", detail: null }, { step: "Prepare three options", detail: null }, { step: "Send the agenda", detail: null }] };
}
const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/chat/completions") { res.writeHead(404).end(); return; }
  if (req.headers.authorization !== "Bearer test-key") { res.writeHead(401).end(); return; }
  let raw = ""; for await (const chunk of req) raw += chunk;
  const input = JSON.parse(raw);
  const content = JSON.stringify(bodyFor(input.messages || []));
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 100, completion_tokens: 50 } }));
});
server.listen(port, "127.0.0.1", () => console.log("mock-ai-ready:" + port));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
