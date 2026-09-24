// Run the actual migration in PostgreSQL/WASM. Auth roles/claims emulate Supabase;
// Google and email delivery must still be verified against a configured project.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
  await db.exec(fs.readFileSync('supabase/migrations/202609240001_fan17.sql','utf8'));
  const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const request={version:1,task:'reply',input:'Follow up on a proposal.',clarification:''};
  const result={kind:'reply',text:'Hello, checking in.\n  Thanks.'};
  const save=()=>db.query('select public.save_workflow($1,$2,$3)',[id,request,result]);
  await db.exec('set role anon');
  await assert.rejects(save);
  await assert.rejects(()=>db.query('select * from public.workflow_runs'));
  await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'");
  await save(); await save();
  let rows=(await db.query('select * from public.workflow_runs')).rows;
  assert.equal(rows.length,1); assert.deepEqual(rows[0].result,result);
  assert.equal(rows[0].user_id,'11111111-1111-4111-8111-111111111111');
  await assert.rejects(()=>db.query("update public.workflow_runs set user_id='22222222-2222-4222-8222-222222222222'"));
  await db.exec("set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222'");
  assert.equal((await db.query('select * from public.workflow_runs')).rows.length,0);
  await assert.rejects(save);
  await db.query('update public.workflow_runs set result=$1 where id=$2',[{kind:'reply',text:'stolen'},id]);
  await assert.rejects(()=>db.query('insert into public.workflow_runs(id,user_id,request,result) values($1,$2,$3,$4)',['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111',request,result]));
  await db.exec("set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'");
  assert.deepEqual((await db.query('select result from public.workflow_runs')).rows[0].result,result);
  for (const invalid of [{}, {...request, input:null}, {...request,task:null}, {...request,clarification:null}, {...request, input:''}, {...request,task:'other'}, {...request,input:'x'.repeat(12001)}]) {
    await assert.rejects(()=>db.query('select public.save_workflow($1,$2,$3)',[id,invalid,result]));
  }
  await assert.rejects(()=>db.query('select public.save_workflow($1,$2,$3)',[id,request,{kind:'plan',goal:'mismatch',steps:[]}]));
  for (const [task,value] of [['summary',{kind:'summary',summary:'Summary',keyPoints:['point'],actions:[]}],['plan',{kind:'plan',goal:'Goal',steps:[{step:'First',detail:null}]}]]) {
    await db.query('select public.save_workflow($1,$2,$3)',[id,{...request,task},value]);
    assert.deepEqual((await db.query('select result from public.workflow_runs')).rows[0].result,value);
  }
  await db.exec("reset role; delete from auth.users where id='11111111-1111-4111-8111-111111111111'");
  assert.equal((await db.query('select * from public.workflow_runs')).rows.length,0);
  await db.close();
  console.log('PASS: actual migration, anonymous denial, owner save/update, idempotency, exact edited result, two-user read/write isolation, ownership transfer denial, validation, three workflows, user deletion cascade.');
})().catch(e=>{console.error(e);process.exitCode=1;});
