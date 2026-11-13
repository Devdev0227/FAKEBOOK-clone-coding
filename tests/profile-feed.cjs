// 실제 social/feed 모듈을 함께 실행하는 DOM 모형 통합 검사.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
class Element {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this.attrs={};this.value='';this.files=[];}
 append(...nodes){for (const node of nodes) { node.remove(); node.parentNode = this; this.children.push(node); }}
 replaceChildren(){for(const node of this.children)node.parentNode=null;this.children=[];}
    remove() { if (this.parentNode) { const list = this.parentNode.children; list.splice(list.indexOf(this), 1); this.parentNode = null; } }
    insertBefore(node, before) { node.remove(); const index = before ? this.children.indexOf(before) : this.children.length; if(index < 0) throw Error('invalid reference'); this.children.splice(index, 0, node); node.parentNode = this; }
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,f){this.events[k]=f;}
 querySelector(tag){return this.children.find(n=>n.tagName===tag);}
 focus(){}
 click(){return this.events.click?.({currentTarget:this});}
}
const ids=['socialPanel','sidebarAvatar','sidebarFriends','welcomeName','sidebarBio','homeLink','friendsLink','savedLink','localPosts','postText','postButton','postMedia','mediaPreview','feedMessage','feedTitle'];
const nodes=Object.fromEntries(ids.map(id=>[id,new Element()])),feed=new Element(),composer=new Element(),store=new Map(),events={};
const walk=n=>[n,...n.children.flatMap(walk)];
const byId=id=>nodes[id]||walk(nodes.socialPanel).find(n=>n.id===id);
const login=id=>store.set('fakebookCurrentUser',JSON.stringify({id,name:id==='alice'?'김학생':'이학생'}));login('alice');
store.set('fakebookUsers',JSON.stringify([{id:'alice',name:'김학생',birthday:'2006-04-12'},{id:'bob',name:'이학생'}]));
store.set('fakebookPosts',JSON.stringify([{id:'legacy',author:'김학생',text:'기존 글',createdAt:'2026-01-01T00:00:00Z',comments:[]},{id:'bob-post',authorId:'bob',author:'이학생',text:'다른 계정 글',createdAt:'2026-01-02T00:00:00Z',comments:[]}]));
const window={addEventListener(k,f){(events[k]??=[]).push(f)},dispatchEvent(e){events[e.type]?.forEach(f=>f(e))}};
const context={document:{getElementById:byId,querySelector:s=>s==='.app-feed'?feed:s==='.feed-composer'?composer:byId(s.slice(1)),createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)},window,Event:class{constructor(type){this.type=type}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{hash:'#home'},confirm:()=>true,console,URL:{revokeObjectURL(){}},crypto:require('node:crypto').webcrypto};
store.set('fakebookDummyProfiles',JSON.stringify([{id:'demo-3',name:'가상 친구',avatar:'img/default-avatar.svg',dummy:true,ambientCatalog:1,sampleCatalogVersion:2,sampleIndices:[0,1]}]));
for(const id of ['alice','bob']) store.set('fakebookFriends:'+id,JSON.stringify({friends:[],dismissed:[],requests:[],nextRequestAt:Date.now()+86400000}));
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/ambient.js'),'utf8'),context);
const social=fs.readFileSync(path.join(__dirname,'../js/social.js'),'utf8'),feedSource=fs.readFileSync(path.join(__dirname,'../js/feed.js'),'utf8');
vm.createContext(context);vm.runInContext(social,context);vm.runInContext(feedSource,context);
const go=hash=>{context.location.hash=hash;window.dispatchEvent({type:'hashchange'})};
const profileNodes=()=>walk(byId('profilePosts'));
const form=()=>walk(nodes.socialPanel).find(n=>n.className==='profile-form');
const field=id=>walk(form()).find(n=>n.id===id);
const submit=()=>form().events.submit({preventDefault(){}});
const button=(text,list)=>{const n=list.find(n=>n.tagName==='button'&&n.textContent===text);assert(n,text);return n};
const texts=()=>walk(nodes.socialPanel).map(n=>n.textContent||'');
(async()=>{
 assert.equal(nodes.localPosts.children.length,2+context.window.FakebookSocial.homePostIds(JSON.parse(store.get('fakebookPosts'))).length); // 샘플이 홈을 채우지 않음.
 assert.equal(JSON.parse(store.get('fakebookPosts')).length,2+JSON.parse(store.get('fakebookDummyProfiles')).reduce((n,p)=>n+p.sampleIndices.length,0));
 go('#profile');assert.equal(byId('profilePosts').children.length,1);assert(texts().includes('기존 글'));assert(!texts().includes('다른 계정 글'));
 assert(texts().includes('생년월일: 2006-04-12 (나만 보기)'));assert(texts().includes('친구 0명'));
 assert.equal(context.window.FakebookSocial.profile('alice').avatar,'img/default-avatar.svg');
 go('#settings');assert.equal(field('profileBirthday').value,'2006-04-12');assert.equal(field('birthdayPublic').checked,false);
 field('profileBirthday').value='2025-02-29';submit();assert(!store.has('fakebookProfiles'));
 field('profileBirthday').value='2004-02-29';field('birthdayPublic').checked=false;submit();go('#profile');
 login('bob');go('#profile/alice');assert.equal(context.window.FakebookSocial.profile('alice').birthday,'');assert(!texts().some(t=>t.includes('2004-02-29')));assert(texts().includes('기존 글'));
 login('alice');go('#settings');field('birthdayPublic').checked=true;submit();login('bob');go('#profile/alice');assert(texts().includes('생년월일: 2004-02-29'));
 // 비공개로 복귀 후 다른 계정에 다시 숨김.
 login('alice');go('#settings');field('birthdayPublic').checked=false;submit();login('bob');go('#profile/alice');assert(!texts().some(t=>t.includes('2004-02-29')));
 go('#profile');assert(texts().includes('생년월일 미설정'));assert(texts().includes('다른 계정 글'));
 go('#profile/demo-3');assert.equal(byId('profilePosts').children.length,2);
 const countBefore=context.window.FakebookSocial.profile('demo-3').friendCount;
 button('친구 추가',walk(nodes.socialPanel)).click();assert.equal(context.window.FakebookSocial.profile('demo-3').friendCount,countBefore+1);assert.equal(byId('profilePosts').children.length,2);assert.equal(nodes.sidebarFriends.textContent,'친구 1명');
 let icons=profileNodes().filter(n=>n.className==='icon-button heart-button');icons[0].click();assert.equal(profileNodes().find(n=>n.className==='icon-button heart-button').attrs['aria-pressed'],'true');
 profileNodes().find(n=>n.className==='icon-button bookmark-button').click();
 let commentForm=byId('profilePosts').children[0].children.find(n=>n.className==='feed-comments');commentForm.children[0].value='더미 댓글';commentForm.events.submit({preventDefault(){}});assert(texts().includes('더미 댓글'));
 assert(!profileNodes().some(n=>n.textContent==='게시물 수정'));assert(!profileNodes().some(n=>n.textContent==='게시물 삭제'));
 go('#saved');assert.equal(nodes.localPosts.children.length,1);assert(walk(nodes.localPosts).some(n=>n.textContent==='더미 댓글'));
 go('#profile/demo-3');assert.equal(byId('profilePosts').children.length,2);assert(texts().includes('더미 댓글'));
 go('#profile/unknown');assert(!byId('profilePosts'));assert(texts().includes('프로필을 찾을 수 없습니다.'));
 // 새로고침 시 샘플이 중복 생성되거나 좋아요·댓글 기록이 덮어쓰이지 않음.
 const saved=JSON.parse(store.get('fakebookPosts')).filter(p=>p.demo);vm.runInContext(social,context);assert.deepEqual(JSON.parse(store.get('fakebookPosts')).filter(p=>p.demo),saved);
 login('alice');go('#home');nodes.postText.value='새 글';await nodes.postButton.click();go('#profile');assert.equal(byId('profilePosts').children.length,2);assert(texts().includes('새 글'));
 button('게시물 수정',profileNodes()).click();const editor=profileNodes().find(n=>n.className==='post-edit-form');editor.children[0].value='수정된 새 글';editor.events.submit({preventDefault(){}});assert(texts().includes('수정된 새 글'));
 console.log('PASS: signup birthday fallback, leap-date validation, owner/private/public views, anonymous avatar, per-author timeline including legacy posts, dummy post seeding/persistence, friend counts and timeline refresh, profile likes/bookmarks/comments, saved demo posts, ownership, new-post/edit integration');
})().catch(error=>{console.error(error);process.exitCode=1});




