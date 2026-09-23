const assert = require("node:assert/strict");
const base = process.env.TEST_APP_URL || "http://127.0.0.1:3000";
async function post(path, body) { return fetch(base + path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }); }
(async () => {
  const request = { version:1, task:"reply", input:"A customer has not replied to our proposal for a week. Help me follow up without sounding pushy.", clarification:"" };
  let r = await post("/api/generate", request); assert.equal(r.status,200); let data=await r.json(); assert.equal(data.status,"result"); const current=data.result;
  for (const action of ["shorter","warmer","professional","another"]) {
    r = await post("/api/generate", { request, action, currentResult: current }); assert.equal(r.status,200); data=await r.json(); assert.equal(data.status,"result"); assert.equal(data.result.kind,"reply"); assert.ok(data.result.text); assert.equal(data.meta.estimatedCostUsd,0.0002);
  }
  r = await post("/api/generate", { request, action:"invalid", currentResult:current }); assert.equal(r.status,400);
  r = await post("/api/generate", { request, action:"shorter", currentResult:{kind:"reply",text:""} }); assert.equal(r.status,400);
  r = await post("/api/events", { event:"first_result_copied", workflow:"reply" }); assert.equal(r.status,204);
  r = await post("/api/events", { event:"not_allowed", workflow:"reply" }); assert.equal(r.status,400);
  console.log("PASS: FAN-16 quick actions preserve request context; invalid transforms rejected; copy instrumentation endpoint verified.");
})().catch(e=>{console.error(e);process.exit(1)});
