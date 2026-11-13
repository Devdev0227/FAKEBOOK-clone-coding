const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{create}=require('../js/media-carousel.js');
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.events={};this.value='';this.files=[];this.paused=true;}
 remove(){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
 append(...nodes){for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
 replaceChildren(...nodes){for(const node of this.children)node.parentNode=null;this.children=[];this.append(...nodes);}
 insertBefore(node,before){node.remove();const i=before?this.children.indexOf(before):this.children.length;assert(i>=0);node.parentNode=this;this.children.splice(i,0,node);}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,f){this.events[k]=f;} click(){return this.events.click?.({currentTarget:this});}
 pause(){this.paused=true;this.pauseCount=(this.pauseCount||0)+1;}
 focus(){} querySelector(tag){return walk(this).find(n=>n!==this&&n.tagName===tag.toUpperCase());}
}
const walk=n=>[n,...n.children.flatMap(walk)],doc={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)},flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
const find=(root,cls)=>walk(root).find(n=>n.className===cls),points=root=>walk(root).filter(n=>n.className==='media-carousel-dot');
(async()=>{
 let calls=[],resolveSlow;const video=new Element('video');
 const carousel=create({count:3,document:doc,load:async i=>{calls.push(i);if(i===1)return new Promise(r=>resolveSlow=r);if(i===2)throw Error('missing');return new Element('img');}});
 await flush();assert.deepEqual(calls,[0]);assert.equal(points(carousel.element)[0].attrs['aria-pressed'],'true');
 carousel.goTo(1);carousel.goTo(2);resolveSlow(video);await flush();assert.equal(video.paused,true);assert(find(carousel.element,'media-carousel-placeholder').textContent.includes('불러오지 못'));
 carousel.goTo(1);await flush();assert.equal(carousel.currentIndex,1);video.paused=false;carousel.goTo(0);assert(video.paused);assert.equal(calls.filter(i=>i===1).length,1);
 carousel.goTo(100);assert.equal(carousel.currentIndex,2);carousel.goTo(-1);assert.equal(carousel.currentIndex,0);points(carousel.element)[1].click();assert.equal(carousel.currentIndex,1);
 let prevented=false;carousel.element.events.keydown({key:'End',target:carousel.element,preventDefault(){prevented=true;}});assert(prevented);assert.equal(carousel.currentIndex,2);
 carousel.element.events.keydown({key:'ArrowLeft',target:video,preventDefault(){throw Error('native video key intercepted')}});assert.equal(carousel.currentIndex,2);
 carousel.dispose();carousel.goTo(0);assert.equal(carousel.currentIndex,2);
 const single=create({count:1,document:doc,load:async()=>new Element('img')});assert(find(single.element,'media-carousel-dots').hidden);assert(find(single.element,'media-carousel-arrow media-carousel-next').hidden);
 // 실제 feed.js를 통해 첨부 개수·용량과 미리보기/저장/상호작용 통합 검증.
 const ids=['localPosts','postText','postButton','postMedia','mediaPreview','feedMessage','feedTitle','homeLink','savedLink'],nodes=Object.fromEntries(ids.map(id=>[id,new Element()])),composer=new Element(),store=new Map(),files=new Map(),handlers={};let serial=0,reads=0,revoked=[];
 store.set('fakebookCurrentUser',JSON.stringify({id:'alice',name:'Alice'}));
 const db={transaction(name,mode){const tx={objectStore(){return {put:(file,id)=>files.set(id,file),delete:id=>files.delete(id),get(id){reads++;const request={};queueMicrotask(()=>{request.result=files.get(id);request.onsuccess()});return request;}}}};if(mode==='readwrite')queueMicrotask(()=>tx.oncomplete());return tx;}};
 const context={document:{...doc,querySelector:s=>s==='.feed-composer'?composer:nodes[s.slice(1)],getElementById:id=>nodes[id]},window:{FakebookCarousel:{create},addEventListener:(k,f)=>handlers[k]=f},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{hash:'#home'},indexedDB:{open(){const req={};queueMicrotask(()=>{req.result=db;req.onsuccess()});return req;}},URL:{createObjectURL:()=>`blob:${++serial}`,revokeObjectURL:url=>revoked.push(url)},console,confirm:()=>true};
 // Nodeで読み込んだ factory にはテスト用 document を渡す。
 context.window.FakebookCarousel.create=options=>create({...options,document:doc});
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/feed.js'),'utf8'),context);
 const file=(size=100*1024*1024,type='image/png')=>({name:'sample',type,size});const choose=list=>{nodes.postMedia.files=list;nodes.postMedia.events.change()};
 choose(Array.from({length:11},()=>file()));assert(nodes.feedMessage.textContent.includes('10개'));assert.equal(nodes.mediaPreview.children.length,0);
 choose([file(100*1024*1024+1)]);assert.equal(nodes.mediaPreview.children.length,0);choose([file(1,'text/plain')]);assert.equal(nodes.mediaPreview.children.length,0);
 choose(Array.from({length:10},(_,i)=>file(100*1024*1024,i===1?'video/mp4':'image/png')));await flush();assert.equal(points(nodes.mediaPreview).length,10);assert.equal(serial,1);points(nodes.mediaPreview)[9].click();await flush();assert.equal(serial,2);assert.equal(points(nodes.mediaPreview)[9].attrs['aria-pressed'],'true');
 walk(nodes.mediaPreview).find(n=>n.textContent==='현재 첨부 취소').click();await flush();assert.equal(points(nodes.mediaPreview).length,9);assert(revoked.includes('blob:1')&&revoked.includes('blob:2'));
 choose(Array.from({length:10},(_,i)=>file(100*1024*1024,i===1?'video/mp4':'image/png')));await flush();nodes.postText.value='사진 10개';await nodes.postButton.click();await flush();
 assert.equal(JSON.parse(store.get('fakebookPosts'))[0].media.length,10);assert.equal(files.size,10);assert.equal(reads,1);
 const article=nodes.localPosts.children[0],dots=points(article);dots[1].click();await flush();const playing=walk(article).find(n=>n.tagName==='VIDEO');playing.paused=false;playing.currentTime=14;dots[2].click();await flush();assert(playing.paused);assert.equal(reads,3);
 const activeDot=dots[2];find(article,'icon-button heart-button').click();assert.equal(nodes.localPosts.children[0],article);assert.equal(points(article)[2],activeDot);assert.equal(activeDot.attrs['aria-pressed'],'true');assert.equal(reads,3);
 const form=article.children.find(n=>n.className==='feed-comments');form.children[0].value='댓글';form.events.submit({preventDefault(){}});await flush();const updated=nodes.localPosts.children[0];assert.equal(points(updated)[2],activeDot);assert.equal(activeDot.attrs['aria-pressed'],'true');assert.equal(reads,3);
 const html=fs.readFileSync(path.join(__dirname,'../main.html'),'utf8');assert(html.includes('최대 10개 · 파일당 100MB'));assert(html.indexOf('js/media-carousel.js')<html.indexOf('js/feed.js'));
 console.log('PASS: 10 files at exactly 100MiB, reject 11/oversize/MIME, preview dots/removal/URL cleanup, persisted attachments, lazy read, arrows/dots/keys/bounds, hidden video pause/loading race, errors/single item/dispose and slide position after likes/comments');
})().catch(e=>{console.error(e);process.exitCode=1});
