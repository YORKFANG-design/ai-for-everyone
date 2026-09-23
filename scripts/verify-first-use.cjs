const assert = require('node:assert/strict');
(async () => {
 const url='http://127.0.0.1:3000/api/first-use';
 const send=body=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 for(const task of ['reply','summary','plan','other']) {
  const r=await send({version:1,task,input:'Prepare a launch plan for our Friday release.',clarification:''});
  assert.equal(r.status,200); const data=await r.json(); assert.equal(data.status,'ready'); assert.equal(data.generationAvailable,false); assert.equal(data.request.task,task);
 }
 for(const body of [{}, {version:1,task:'unknown',input:'hello',clarification:''},{version:1,task:'plan',input:'  ',clarification:''},{version:1,task:'plan',input:'x'.repeat(12001),clarification:''}]) assert.equal((await send(body)).status,400);
 const r=await send({version:1,task:'summary',input:'Summarize',clarification:''}); assert.equal((await r.json()).status,'clarification_required');
 assert.equal((await send({version:1,task:'summary',input:'Summarize',clarification:'Launch Friday. Sam drafts Tuesday.'})).status,200);
 assert.equal((await fetch(url,{method:'POST',body:'{'})).status,400);
 assert.equal((await fetch(url,{method:'POST',body:'x'.repeat(90001)})).status,413);
 console.log('PASS: 12 API cases; four tasks, clarification, invalid input, malformed and oversized bodies.');
})().catch(e=>{console.error(e);process.exit(1)});
