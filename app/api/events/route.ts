const allowed = new Set(["first_result_copied", "first_result_regenerated", "save_workflow_clicked"]);

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 4000) return new Response(null, { status: 413 });
    const body = JSON.parse(text) as Record<string, unknown>;
    if (typeof body.event !== "string" || !allowed.has(body.event)) return new Response(null, { status: 400 });
    const workflow = typeof body.workflow === "string" ? body.workflow : null;
    const action = typeof body.action === "string" ? body.action : null;
    console.info(JSON.stringify({ event: body.event, workflow, action, at: new Date().toISOString() }));
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
