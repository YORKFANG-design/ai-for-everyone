const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const userId = '11111111-1111-4111-8111-111111111111';
const user = { id: userId, aud:'authenticated', role:'authenticated', email:'test@example.com', app_metadata:{provider:'email'}, user_metadata:{}, created_at:new Date().toISOString() };
const base = 'http://127.0.0.1:3000';
const token = () => `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.test-signature`;
(async () => {
  const browser = process.env.FAN17_CDP ? await chromium.connectOverCDP(process.env.FAN17_CDP) : await chromium.launch({headless:true});
  let checks = 0;
  try {
    for (const mode of ['email-code','email-hash','email-session','google']) {
      const width=mode==='google' ? 1440 : 390;
      const context = await browser.newContext({viewport:{width,height:950}});
      const page = await context.newPage();
      const records = new Map();
      let failSave = false, callback, tokenCalls=0, saves=0;
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await context.route('**/api/generate', route => route.fulfill({json:{status:'result',workflow:'reply',result:{kind:'reply',text:'Initial generated result'},meta:{traceId:'test'}}}));
      await context.route('http://127.0.0.1:54321/**', async route => {
        const request=route.request(), url=new URL(request.url());
        const respond = options => route.fulfill({...options,headers:{'access-control-allow-origin':'*',...options.headers}});
        if (request.method()==='OPTIONS') return respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
        if (url.pathname.endsWith('/authorize')) {
          assert.equal(url.searchParams.get('provider'),'google');
          assert.equal(url.searchParams.get('code_challenge_method'),'s256');
          callback=url.searchParams.get('redirect_to');
          return respond({status:302,headers:{location:callback+'&code=test-google-code'}});
        }
        if (url.pathname.endsWith('/otp')) {
          callback=url.searchParams.get('redirect_to');
          const body=request.postDataJSON(); assert.equal(body.email,'test@example.com'); assert.ok(body.code_challenge);
          return respond({json:{}});
        }
        if (url.pathname.endsWith('/verify')) {
          tokenCalls++;
          // The SDK also supplies security metadata; assert the auth contract, not its entire payload.
          const body=request.postDataJSON();
          assert.equal(body.token_hash,'test-email-hash');
          assert.equal(body.type,'email');
          return respond({json:{access_token:token(),refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user}});
        }
        if (url.pathname.endsWith('/token')) {
          tokenCalls++; const body=request.postDataJSON(); assert.ok(body.code_verifier);
          return respond({json:{access_token:token(),refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user}});
        }
        if (url.pathname.endsWith('/user')) return respond({json:user});
        if (url.pathname.endsWith('/logout')) return respond({status:204});
        if (url.pathname.endsWith('/rpc/save_workflow')) {
          saves++;
          if (failSave) return respond({status:500,json:{message:'test outage'}});
          const body=request.postDataJSON(); assert.ok(request.headers().authorization?.startsWith('Bearer '));
          records.set(body.work_id,{id:body.work_id,user_id:userId,request:body.work_request,result:body.work_result,updated_at:new Date().toISOString()});
          return respond({json:body.work_id});
        }
        if (url.pathname.endsWith('/workflow_runs')) {
          assert.equal(url.searchParams.get('user_id'),`eq.${userId}`);
          let list=[...records.values()];
          if (url.searchParams.get('id')) list=list.filter(row=>`eq.${row.id}`===url.searchParams.get('id'));
          return respond({json:request.headers().accept?.includes('vnd.pgrst.object') ? list[0] : list});
        }
        throw new Error('Unexpected auth endpoint '+url.pathname);
      });
      await page.goto(base+'/start');
      await page.getByRole('button',{name:/Reply to a customer/}).click();
      await page.locator('#context').fill('Please follow up on the proposal sent last week.');
      await page.getByRole('button',{name:/Create my result/}).click();
      const exact='您好，跟进上周的方案。\n  Thank you.  ';
      await page.getByLabel('Editable result').fill(exact);
      assert.equal(await page.getByRole('heading',{name:'Sign in to keep your work'}).count(),0);
      await page.getByRole('button',{name:'Save workflow',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Sign in to keep your work'})).toBeVisible();
      const recoverUrl=page.url();
      // Full page reload retains the exact user edit before authentication.
      await page.reload(); await expect(page.getByLabel('Editable result')).toHaveValue(exact);
      await page.getByRole('button',{name:'Save workflow',exact:true}).click();
      if(width===390) {
        await page.getByLabel('Email',{exact:true}).fill('test@example.com');
        await page.getByRole('button',{name:'Email me a sign-in link'}).click();
        await expect(page.getByText(/Check your email/)).toBeVisible();
        assert.ok(callback.includes('/auth/callback?save='));
        const pendingBefore=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('afe:pending-save:')).length);
        await page.goto(callback+'&token_hash=invalid&type=recovery');
        await expect(page.getByText(/Sign-in was cancelled/)).toBeVisible();
        assert.equal(tokenCalls,0); assert.equal(saves,0);
        assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('afe:pending-save:')).length),pendingBefore);
        failSave=true;
        const emailCallback=mode==='email-hash' ? callback+'&token_hash=test-email-hash&type=email' : mode==='email-session' ? callback+'#access_token='+token()+'&refresh_token=test-refresh&type=magiclink' : callback+'&code=test-email-code';
        await page.goto(emailCallback);
        await expect(page.getByText(/We could not save your work/)).toBeVisible();
        assert.equal(tokenCalls,mode==='email-session' ? 0 : 1);
        assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('afe:pending-save:')).length),1);
        failSave=false; await page.getByRole('button',{name:'Retry saving'}).click();
      } else await page.getByRole('button',{name:'Continue with Google'}).click();
      await page.waitForURL(base+'/work');
      await expect(page.getByRole('link',{name:'Open / reuse workflow'})).toBeVisible();
      assert.equal(records.size,1); assert.equal([...records.values()][0].result.text,exact); assert.equal(tokenCalls,mode==='email-session' ? 0 : 1);
      assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('afe:pending-save:')).length),0);
      await page.reload(); await page.getByRole('link',{name:'Open / reuse workflow'}).click();
      await expect(page.getByLabel('Editable result')).toHaveValue(exact);
      await page.getByLabel('Editable result').fill('Updated saved edit');
      await page.getByRole('button',{name:'Save workflow',exact:true}).click();
      await expect(page.getByText('Saved to your account. Find it in Recent Work.')).toBeVisible();
      assert.equal(records.size,1); assert.equal([...records.values()][0].result.text,'Updated saved edit');
      await page.goto(base+'/work');
      await expect(page.getByRole('link',{name:'Open / reuse workflow'})).toBeVisible();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      fs.mkdirSync('test-results',{recursive:true});
      await page.screenshot({path:`test-results/fan17-work-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Sign out'}).click();
      await expect(page.getByRole('heading',{name:'Sign in to keep your work'})).toBeVisible();
      assert.equal(await page.getByRole('link',{name:'Open / reuse workflow'}).count(),0);
      // Cancelled / invalid callback never marks a result saved or writes a record.
      const before=saves;
      await page.goto(base+'/auth/callback?error=access_denied');
      await expect(page.getByText(/Sign-in was cancelled/)).toBeVisible();
      assert.equal(saves,before);
      // An emailed link arrives from another document, not a same-document hash change.
      await page.goto(base+'/start');
      await page.goto(base+'/auth/callback#error=access_denied&error_code=otp_expired');
      await expect(page.getByText(/email link has expired/)).toBeVisible();
      assert.equal(saves,before);
      assert.deepEqual(errors,[]);
      await context.close(); checks++;
    }
    console.log(`PASS: ${checks} browser journeys (390px Email, 1440px Google): anonymous generation, exact edited-result recovery, Email token-hash verification / Google PKCE exchange, failed-save retry without re-exchange, account persistence, return/reuse/update, duplicate prevention, sign-out, cancelled callback, no horizontal overflow or page errors. Auth/provider responses are mocked; real delivery and OAuth remain external gates.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});

