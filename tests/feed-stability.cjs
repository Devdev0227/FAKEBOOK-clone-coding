// DOM 정체성과 첨부 파일 수명으로 전체 목록 재생성 회귀를 검사합니다.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let active=null;
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.events={};this.value='';this.resetCount=0;}
 remove(){if(this.parentNode){const list=this.parentNode.children;list.splice(list.indexOf(this),1);this.parentNode=null;}}
 append(...nodes){for(const n of nodes){n.remove();n.parentNode=this;this.children.push(n);}}
 insertBefore(n,before){n.remove();const i=before?this.children.indexOf(before):this.children.length;assert(i>=0);n.parentNode=this;this.children.splice(i,0,n);}
 replaceChildren(...nodes){this.resetCount++;for(const n of this.children)n.parentNode=null;this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,f){this.events[k]=f;}
 querySelector(tag){return walk(this).find(n=>n!==this&&n.tagName===tag.toUpperCase());}
 pause(){this.paused=true;}
 focus(){active=this;} click(){active=this;return this.events.click?.({currentTarget:this});}
}
const walk=n=>[n,...n.children.flatMap(walk)],store=new Map(),handlers={},composer=new Element();let fail=false,reads=0,created=0,revoked=[];
const nodes=Object.fromEntries(['localPosts','postText','postButton','postMedia','mediaPreview','feedMessage','feedTitle','homeLink','savedLink'].map(id=>[id,new Element()]));
const root=nodes.localPosts;
store.set('fakebookCurrentUser',JSON.stringify({id:'alice',name:'Alice'}));
store.set('fakebookPosts',JSON.stringify([
 {id:'a',authorId:'alice',author:'Alice',text:'본문',createdAt:'2026-02-01',likedBy:[],savedBy:[],media:[{id:'video'},{id:'image'}],comments:[{id:'c',authorId:'alice',author:'Alice',text:'댓글',likedBy:[],replies:[{id:'r',authorId:'bob',author:'Bob',text:'답글',likedBy:[]}]}]},
 {id:'b',authorId:'bob',author:'Bob',text:'다른 글',createdAt:'2026-01-01',comments:[]}
]));
const db={transaction(){return {objectStore(){return {get(id){reads++;const r={};queueMicrotask(()=>{r.result={type:id==='video'?'video/mp4':'image/png',name:id};r.onsuccess()});return r;}}}}}};
const context={document:{querySelector:s=>s==='.feed-composer'?composer:nodes[s.slice(1)],getElementById:id=>nodes[id],createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v)}},window:{addEventListener:(k,f)=>handlers[k]=f},location:{hash:'#home'},indexedDB:{open(){const r={};queueMicrotask(()=>{r.result=db;r.onsuccess()});return r;}},URL:{createObjectURL(){return 'blob:'+ ++created},revokeObjectURL:url=>revoked.push(url)},console,confirm:()=>true};
const click=(text,scope=root)=>{const b=walk(scope).find(n=>n.tagName==='BUTTON'&&n.textContent===text);assert(b,text);b.click();return b};
const icons=(kind,scope=root)=>walk(scope).filter(n=>n.className===`icon-button ${kind}-button`);
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
(async()=>{
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/media-carousel.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/feed.js'),'utf8'),context);await flush();
 const a=root.children[0],b=root.children[1],gallery=walk(a).find(n=>n.className==='media-grid');
 assert.equal(reads,1); // 보이지 않는 큰 첨부는 미리 읽지 않습니다.
 walk(gallery).find(n=>n.attrs['aria-label']==='다음 첨부 파일').click();
 await flush();
 const video=walk(gallery).find(n=>n.tagName==='VIDEO'),image=walk(gallery).find(n=>n.tagName==='IMG'); assert(video&&image);
 walk(gallery).find(n=>n.attrs['aria-label']==='이전 첨부 파일').click();
 video.currentTime=27;video.paused=false;
 const resets=root.resetCount,heart=icons('heart',a)[0];heart.click();
 assert.equal(root.children[0],a);assert.equal(root.children[1],b);assert.equal(active,heart);assert.equal(heart.attrs['aria-pressed'],'true');assert.equal(heart.children[1].textContent,'1');assert.equal(root.resetCount,resets);
 icons('heart',a)[1].click();icons('heart',a)[2].click();icons('bookmark',a)[0].click();
 assert.equal(root.children[0],a);assert.equal(walk(a).find(n=>n.tagName==='VIDEO'),video);assert.equal(video.currentTime,27);assert.equal(video.paused,false);assert.equal(reads,2);assert.equal(created,2);assert.deepEqual(revoked,[]);
 // 편집 중 다른 버튼을 눌러도 입력 내용과 펼친 폼을 보존.
 click('게시물 수정',a);let editor=walk(a).find(n=>n.className==='post-edit-form');editor.children[0].value='아직 저장하지 않은 초안';icons('heart',a)[0].click();assert.equal(editor.hidden,false);assert.equal(editor.children[0].value,'아직 저장하지 않은 초안');assert.equal(root.children[0],a);
 click('수정 취소',editor);
 // 저장 실패 시 화면의 선택 상태가 앞서 바뀌지 않음.
 fail=true;const pressed=heart.attrs['aria-pressed'];heart.click();assert.equal(heart.attrs['aria-pressed'],pressed);assert.equal(root.children[0],a);fail=false;
 // 댓글 추가는 해당 카드만 바꾸고 미디어와 나머지 카드는 그대로 유지.
 let form=a.children.find(n=>n.className==='feed-comments');form.children[0].value='추가 댓글';form.events.submit({preventDefault(){}});await flush();
 const updated=root.children[0];assert.notEqual(updated,a);assert.equal(root.children[1],b);assert.equal(walk(updated).find(n=>n.tagName==='VIDEO'),video);assert.equal(walk(updated).find(n=>n.tagName==='IMG'),image);assert.equal(video.currentTime,27);assert.equal(reads,2);assert.equal(created,2);
 // 같은 데이터로 다시 갱신해도 카드/첨부 파일을 다시 만들지 않음.
 handlers.storage({key:'fakebookPosts'});await flush();assert.equal(root.children[0],updated);assert.equal(reads,2);
 context.location.hash='#saved';handlers.hashchange();assert.equal(root.children.length,1);assert.equal(root.children[0],updated);
 icons('bookmark',updated)[0].click();assert.equal(root.children[0].textContent,'저장한 게시물이 없습니다.');assert.equal(revoked.length,2);assert.equal(root.resetCount,resets);
 const legacy={id:'negative-parent',authorId:'demo-1',author:'가상 친구',text:'이전 부정적 댓글',negative:true,hiddenBy:['alice'],likedBy:[]};
 store.set('fakebookPosts',JSON.stringify([{id:'legacy-post',authorId:'alice',text:'내 글',createdAt:'2026-01-01',comments:[legacy]}]));context.location.hash='#home';handlers.hashchange();
 assert(walk(root).some(n=>n.textContent===legacy.text));assert(!walk(root).some(n=>['댓글 숨기기','다시 표시','숨긴 댓글입니다.'].includes(n.textContent)));
 console.log('PASS: post/comment/reply likes and bookmarks reuse DOM/focus; editor drafts survive; failed saves preserve state; comment update retains other cards and image/video playback/URLs; saved removal releases URLs and preserves empty state');
})().catch(e=>{console.error(e);process.exitCode=1});



