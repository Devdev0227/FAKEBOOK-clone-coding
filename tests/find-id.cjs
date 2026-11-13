const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/auth.js'),'utf8');
function setup(formId){
 const ids=formId==='findIdForm'?['findIdForm','findIdName','findIdPhone','findIdResult','foundId','findIdMessage']:['findPasswordForm','findName','findPhone','findPasswordMessage'];
 const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',hidden:true,events:{},addEventListener(k,f){this.events[k]=f}}]));
 const store=new Map([['fakebookUsers',JSON.stringify([null,{id:'AliceCase',name:'김학생',phone:'01012345678',password:'not-shown'},{id:'Bob',name:'이학생',phone:'0212345678',password:'also-not-shown'}])],['fakebookCurrentUser','existing-session']]),session=new Map([['fakebookResetUserId','existing-reset']]);
 const context={document:{querySelector:s=>nodes[s.slice(1)]||null},localStorage:{getItem:k=>store.get(k)||null,setItem(){throw Error('lookup must not write')}},sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)},location:{},alert(){}};
 vm.createContext(context);vm.runInContext(source,context);
 return {nodes,store,session,context,submit:()=>nodes[formId].events.submit({preventDefault(){}})};
}
let x=setup('findIdForm');const n=x.nodes;
const lookup=(name,phone)=>{n.findIdName.value=name;n.findIdPhone.value=phone;x.submit()};
const original=[...x.store.entries()],originalReset=[...x.session.entries()];
lookup(' 김학생 ',' 01012345678 ');assert.equal(n.foundId.textContent,'AliceCase');assert.equal(n.findIdResult.hidden,false);assert(n.findIdMessage.textContent.includes('AliceCase'));assert.equal(n.findIdMessage.className,'auth-success');
lookup('김학생','0212345678');assert.equal(n.findIdResult.hidden,true);assert.equal(n.foundId.textContent,'');assert(n.findIdMessage.textContent.includes('일치하는'));
for(const phone of ['', '010-1234-5678','010abcdef00','123','010123456789']){lookup('김학생',phone);assert(n.findIdMessage.textContent.includes('전화번호'));assert.equal(n.findIdResult.hidden,true);}
lookup('','01012345678');assert(n.findIdMessage.textContent.includes('이름'));lookup('이학생','0212345678');assert.equal(n.foundId.textContent,'Bob');
n.findIdForm.events.input();assert.equal(n.findIdResult.hidden,true);assert.equal(n.foundId.textContent,'');assert.equal(n.findIdMessage.textContent,'');
x.store.set('fakebookProfiles',JSON.stringify({AliceCase:{name:'바꾼표시이름'}}));lookup('바꾼표시이름','01012345678');assert.equal(n.findIdResult.hidden,true);lookup('김학생','01012345678');assert.equal(n.foundId.textContent,'AliceCase');
assert.deepEqual([...x.store.entries()].filter(([k])=>k!=='fakebookProfiles'),original);assert.deepEqual([...x.session.entries()],originalReset);assert.equal(x.context.location.href,undefined);
for(const bad of ['invalid-json','{}','null','[]']){x.store.set('fakebookUsers',bad);lookup('김학생','01012345678');assert.equal(n.findIdResult.hidden,true);assert.equal(n.foundId.textContent,'');}
// 기존 비밀번호 찾기 플로우도 이름/전화번호 확인 후 재설정 아이디를 저장.
x=setup('findPasswordForm');x.store.set('fakebookUsers',JSON.stringify([{id:'AliceCase',name:'김학생',phone:'01012345678',password:'not-shown'}]));x.nodes.findName.value='김학생';x.nodes.findPhone.value='01012345678';x.submit();assert.equal(x.session.get('fakebookResetUserId'),'AliceCase');assert.equal(x.context.location.href,'reset-password.html');
const html=fs.readFileSync(path.join(__dirname,'../find-id.html'),'utf8'),login=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert(login.includes('href="find-id.html"'));for(const id of ['findIdForm','findIdName','findIdPhone','findIdMessage','findIdResult','foundId'])assert(html.includes(`id="${id}"`));assert(html.includes('href="find-password.html"'));assert(html.includes('aria-live="polite"'));assert(html.includes('name="viewport"'));
console.log('PASS: exact signup name+phone lookup, trim, 10/11 digits, mismatch/invalid/empty/corrupt data, stale-result clearing, case-preserved ID, display-name independence, no account/session/reset mutation, password recovery regression and page links');
