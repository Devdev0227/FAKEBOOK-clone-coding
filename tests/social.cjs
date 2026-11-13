const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
class Element {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this.attrs={};this.value='';this.files=[];}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(){this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,f){this.events[k]=f;}
 click(){return this.events.click?.({currentTarget:this});}
}
const nodes=Object.fromEntries(['socialPanel','sidebarAvatar','welcomeName','sidebarBio','homeLink','friendsLink','savedLink'].map(id=>[id,new Element()]));
const feed=new Element(),store=new Map(),events={};let fail=false;
const login=id=>store.set('fakebookCurrentUser',JSON.stringify({id,name:id==='alice'?'김학생':'이학생'}));login('alice');
store.set('fakebookUsers',JSON.stringify([{id:'alice',name:'김학생'},{id:'bob',name:'이학생'}]));
const window={addEventListener(k,f){(events[k]??=[]).push(f)},dispatchEvent(e){events[e.type]?.forEach(f=>f(e))}};
const context={document:{getElementById:id=>nodes[id],querySelector:s=>s==='.app-feed'?feed:null,createElement:tag=>new Element(tag)},window,Event:class{constructor(type){this.type=type}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v)}},location:{hash:'#friends'},console,confirm:()=>true,URL:{},Image:class{}};
const walk=n=>[n,...n.children.flatMap(walk)], all=()=>walk(nodes.socialPanel),find=text=>{const n=all().find(n=>n.textContent===text);assert(n,text);return n};
const fire=()=>window.dispatchEvent({type:'hashchange'});const go=hash=>{context.location.hash=hash;fire()};
store.set('fakebookFriends:alice',JSON.stringify({friends:[],dismissed:[],requests:['demo-1','demo-2'],nextRequestAt:Date.now()+86400000}));
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/ambient.js'),'utf8'),context);
const source=fs.readFileSync(path.join(__dirname,'../js/social.js'),'utf8');vm.runInNewContext(source,context);
const rows=()=>all().filter(n=>n.className==='friend-row');const state=()=>JSON.parse(store.get('fakebookFriends:alice'));
assert.equal(rows().length,10);assert.equal(new Set(rows().map(row=>walk(row).find(n=>n.tagName==='img').src)).size,rows().length);const seeded=store.get('fakebookDummyProfiles');fire();assert.equal(store.get('fakebookDummyProfiles'),seeded);
walk(rows()[0]).find(n=>n.textContent==='친구 추가').click();assert.equal(state().friends.length,1);
find('모든 친구 (1)').click();assert.equal(rows().length,1);
find('친구 삭제').click();assert.equal(state().friends.length,0);
find('요청 (2)').click();walk(rows()[0]).find(n=>n.textContent==='확인').click();assert.equal(state().requests.length,1);assert.equal(state().friends.length,1);
walk(rows()[0]).find(n=>n.textContent==='삭제').click();assert.equal(state().requests.length,0);
find('추천').click();let count=rows().length;const dismissedName=walk(rows()[0]).find(n=>n.className==='friend-name').textContent;walk(rows()[0]).find(n=>n.textContent==='삭제').click();assert.equal(rows().length,10);assert(!all().some(n=>n.className==='friend-name'&&n.textContent===dismissedName));
find('삭제한 추천 다시 보기').click();assert.equal(rows().length,10);assert.equal(state().dismissed.length,0);
let search=all().find(n=>n.type==='search');search.value='no-match';search.events.input();assert.equal(rows().length,0);search.value='';search.events.input();
go('#profile/demo-3');assert(all().some(n=>n.className==='profile-detail'));
go('#settings');let form=all().find(n=>n.tagName==='form');const field=id=>walk(form).find(n=>n.id===id);const submit=()=>form.events.submit({preventDefault(){}});
field('profileName').value='정연 테스트';field('profileBio').value='<script>소개</script>';field('profileBirthday').value='2999-01-01';submit();assert(!store.has('fakebookProfiles'));
field('profileBirthday').value='2006-04-12';fail=true;submit();assert(!store.has('fakebookProfiles'));fail=false;submit();fire();
assert.equal(window.FakebookSocial.profile('alice').name,'정연 테스트');assert.equal(window.FakebookSocial.profile('alice').bio,'<script>소개</script>');assert.equal(nodes.welcomeName.textContent,'정연 테스트님');
assert.equal(JSON.parse(store.get('fakebookUsers'))[0].name,'김학생');
const author=window.FakebookSocial.author('alice','김학생');assert.equal(author.children[1].textContent,'정연 테스트');assert.equal(author.href,'#profile/alice');
go('#settings');form=all().find(n=>n.tagName==='form');field('profileName').value='취소이름';go('#profile');assert.equal(window.FakebookSocial.profile('alice').name,'정연 테스트');
go('#settings');form=all().find(n=>n.tagName==='form');login('bob');submit();assert.equal(window.FakebookSocial.profile('bob').name,'이학생');
go('#friends');find('모든 친구 (0)').click();assert.equal(rows().length,0);assert.equal(nodes.welcomeName.textContent,'이학생님');
go('#home');assert.equal(feed.hidden,false);assert.equal(nodes.socialPanel.hidden,true);assert.equal(nodes.homeLink.attrs['aria-current'],'page');go('#saved');assert.equal(nodes.savedLink.attrs['aria-current'],'page');
nodes.sidebarAvatar.onerror();assert.equal(nodes.sidebarAvatar.src,'img/default-avatar.svg');assert.equal(nodes.sidebarAvatar.onerror,null);
const failed=window.FakebookSocial.author('demo-3','가상 친구').children[0];failed.onerror();assert.equal(failed.src,'img/default-avatar.svg');assert.equal(failed.onerror,null);
const homeData=JSON.parse(store.get('fakebookPosts'));const selection=window.FakebookSocial.homePostIds(homeData);assert.deepEqual(window.FakebookSocial.homePostIds(homeData),selection);homeData[0].comments.push({text:'추가 댓글'});assert.deepEqual(window.FakebookSocial.homePostIds(homeData),selection);
store.delete('fakebookCurrentUser');window.dispatchEvent({type:'storage',key:'fakebookCurrentUser'});assert.equal(context.location.href,'index.html');
console.log('PASS: seeded profile persistence; friend add/remove, request accept/reject, dismiss/restore/search; profile validation/save/cancel/quota failure; display name/author links; account isolation and stale form guard; routes and logout');



