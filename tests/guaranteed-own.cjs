const assert=require('node:assert/strict'),{create,TEXTS,TEMPLATE_PAIRS}=require('../js/ambient.js');
let time=Date.parse('2026-11-13T00:00:00Z'),seed=732,forced=null,fail=false;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');map.set(k,v)}};
const read=k=>JSON.parse(map.get(k)),put=(k,v)=>map.set(k,JSON.stringify(v));
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
put('fakebookUsers',[{id:'alice',name:'김학생'},{id:'bob',name:'이학생'}]);
let engine=create({storage,now:()=>time,random});engine.boot();
const make=(id,text,authorId='alice')=>({id,text,authorId,author:authorId==='alice'?'김학생':'이학생',createdAt:new Date(time-30*86400000).toISOString(),comments:[],likedBy:[],savedBy:[]});
// 가장 높은 난수에서도 확률 없이 부모 1개, 답글 2개를 반드시 생성.
forced=.999;const own=make('own','맥락을 알 수 없는 자유 입력 글');const foreign=make('foreign','다른 계정 글','bob');const demo={...make('demo',TEXTS[0],'demo-1'),demo:true};put('fakebookPosts',[own,foreign,demo]);
engine.tickOwnConversations('alice');let posts=read('fakebookPosts'),job=posts[0].ownConversation;assert(job.dueAt>=time+60000&&job.dueAt<=time+180000);assert.equal(posts[0].comments.length,0);assert(!posts[1].ownConversation);assert(!posts[2].ownConversation);
const due=job.dueAt;engine=create({storage,now:()=>time,random});engine.boot();engine.tickOwnConversations('alice');assert.equal(read('fakebookPosts').find(p=>p.id==='own').ownConversation.dueAt,due);
time=due;engine.tickOwnConversations('alice');let p=read('fakebookPosts').find(p=>p.id==='own'),c=p.comments[0];assert.equal(p.comments.filter(c=>c.negative).length,1);assert.equal(c.negativePairId,'own:general');assert(c.defensePlan.guaranteed);assert.equal(c.defensePlan.target,2);assert(c.defensePlan.dueAt>=time+60000&&c.defensePlan.dueAt<=time+180000);
engine.tickOwnConversations('alice');assert.equal(read('fakebookPosts').find(p=>p.id==='own').comments.length,1);
engine.tickDefenses('alice');assert(!read('fakebookPosts').find(p=>p.id==='own').comments[0].replies);
const replyDue=c.defensePlan.dueAt;time=replyDue;engine.tickDefenses('bob');assert(!read('fakebookPosts').find(p=>p.id==='own').comments[0].replies);engine.tickDefenses('alice');p=read('fakebookPosts').find(p=>p.id==='own');c=p.comments[0];assert.equal(c.replies.length,2);assert.equal(new Set(c.replies.map(r=>r.authorId)).size,2);assert(c.replies.every(r=>r.authorId!==c.authorId&&r.authorId!==p.authorId));assert.equal(new Set(c.replies.map(r=>r.text)).size,2);assert(c.defensePlan.done);assert(p.ownConversation.completed);
const snapshot=map.get('fakebookPosts');engine=create({storage,now:()=>time,random});engine.boot();engine.tickOwnConversations('alice');engine.tickDefenses('alice');assert.equal(map.get('fakebookPosts'),snapshot);
// 이미 완료한 스레드 삭제로 다시 생성하지 않음.
p.comments=[];put('fakebookPosts',[p]);engine.tickOwnConversations('alice');engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments.length,0);
// 이전 확률형 기능의 사용 플래그만 남은 글도 이번 확정 예약은 한 번 실행합니다.
const stale=make('stale','임의의 새 기록');stale.negativeCommentUsed=true;put('fakebookPosts',[stale]);engine.tickOwnConversations('alice');time=read('fakebookPosts')[0].ownConversation.dueAt;engine.tickOwnConversations('alice');assert.equal(read('fakebookPosts')[0].comments.filter(c=>c.negative).length,1);
// 낮은 난수에서는 답글 1개, 본문이 매칭되는 글에는 전용 문구 사용.
forced=0;put('fakebookPosts',[make('template',TEXTS[20])]);engine.tickOwnConversations('alice');time=read('fakebookPosts')[0].ownConversation.dueAt;engine.tickOwnConversations('alice');c=read('fakebookPosts')[0].comments[0];assert.equal(c.text,TEMPLATE_PAIRS[20].negative);assert.equal(c.defensePlan.target,1);time=c.defensePlan.dueAt;engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments[0].replies[0].text,TEMPLATE_PAIRS[20].defense);
// 과거 부정적 댓글을 재사용하고, 이미 있던 제지 답글을 중복 생성하지 않음.
const old=make('legacy',TEXTS[0]);old.negativeCommentUsed=true;old.comments=[{id:'old-negative',negative:true,authorId:'demo-1',text:TEMPLATE_PAIRS[0].negative,negativeContextText:TEXTS[0],replies:[{id:'old-defense',authorId:'demo-2',text:TEMPLATE_PAIRS[0].defense,defense:true}]}];put('fakebookPosts',[old]);engine.tickOwnConversations('alice');assert.equal(read('fakebookPosts')[0].comments.length,1);assert(read('fakebookPosts')[0].ownConversation.completed);time+=600000;engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments[0].replies.length,1);
// 오래 미접속했어도 부모 생성 직후 답글까지 한꺼번에 생성하지 않음.
put('fakebookPosts',[make('offline','임의 글')]);engine.tickOwnConversations('alice');time+=100*86400000;engine.tickOwnConversations('alice');engine.tickDefenses('alice');c=read('fakebookPosts')[0].comments[0];assert(c.defensePlan.dueAt>time);assert(!c.replies);
// 부모 삭제와 계정 경계, 저장 실패도 안전하게 처리.
let gone=read('fakebookPosts')[0];gone.comments=[];put('fakebookPosts',[gone]);engine.tickOwnConversations('alice');assert(read('fakebookPosts')[0].ownConversation.completed);engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments.length,0);
fail=true;assert.doesNotThrow(()=>engine.tickOwnConversations('alice'));
console.log('PASS: guaranteed negative at 1–3min for old/new/free-text own posts, 1–2 delayed distinct defenses, contextual/fallback wording, persisted schedules/counts, legacy reuse, deletion/no-repeat, account/demo exclusion, offline staging and save failure');
