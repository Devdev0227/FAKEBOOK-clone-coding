const assert=require('node:assert/strict'),{create,TEXTS,TEMPLATE_PAIRS,OWN_PAIRS}=require('../js/ambient.js');
let time=Date.parse('2026-11-13T00:00:00Z'),forced=null,seed=482;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
const put=(k,v)=>map.set(k,JSON.stringify(v)),read=k=>JSON.parse(map.get(k));
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
let engine=create({storage,now:()=>time,random});engine.boot();assert.equal(TEMPLATE_PAIRS.length,50);assert.equal(OWN_PAIRS.length,8);
for(let i=0;i<TEXTS.length;i++){const pair=engine.conversationPair({text:TEXTS[i]});assert.equal(pair.id,'template:'+i);assert.equal(pair.negative,TEMPLATE_PAIRS[i].negative);assert.equal(pair.defense,TEMPLATE_PAIRS[i].defense);assert(pair.negative&&pair.defense);}
assert.equal(new Set(TEMPLATE_PAIRS.map(p=>p.negative)).size,50);assert.equal(new Set(TEMPLATE_PAIRS.map(p=>p.defense)).size,50);
assert.equal(engine.conversationPair({text:'오늘 러닝 3km 완주 기록을 남겼다.'}).id,'topic:running');
for(const text of ['그냥 일상을 기록한다.','러닝을 하고 싶다.','영화 추천해줄래?','책을 읽지 않았다.','러닝 기록 때문에 힘들고 우울하다.','과제를 끝냈고 영화 보고 왔다.','친구가 러닝 악플 때문에 힘들어한다.']) assert.equal(engine.conversationPair({text}),null,text);
const author=engine.profiles.find(p=>p.temperament!=='blunt');let index=0;
const post=(text=TEXTS[0])=>({id:'p'+ ++index,authorId:'alice',text,createdAt:new Date(time).toISOString(),comments:[]});
const normal=()=>({id:'c'+index,authorId:author.id,author:author.name,text:'소식 잘 보고 가요.',simulated:true,likedBy:[],createdAt:new Date(time).toISOString()});
forced=.04;assert(!engine.autoComment(post(),'alice',normal(),.03).negative);
let dummy=post(TEXTS[20]),negative=engine.autoComment(dummy,'alice',normal(),.05);assert(negative.negative);assert.equal(negative.text,TEMPLATE_PAIRS[20].negative);assert.equal(negative.negativePairId,'template:20');assert(negative.defensePlan.dueAt>=time+120000&&negative.defensePlan.dueAt<=time+600000);dummy.comments.push(negative);
assert(!engine.autoComment(post(),'alice',normal(),.05).negative);put('fakebookPosts',[dummy]);engine.tickDefenses('alice');assert(!read('fakebookPosts')[0].comments[0].replies);
time=negative.defensePlan.dueAt;engine.tickDefenses('alice');let c=read('fakebookPosts')[0].comments[0];assert.equal(c.replies.length,1);assert.equal(c.replies[0].text,TEMPLATE_PAIRS[20].defense);assert.notEqual(c.replies[0].authorId,c.authorId);assert.notEqual(c.replies[0].authorId,dummy.authorId);assert(!c.replies[0].defensePlan);
engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments[0].replies.length,1);
time+=600000;put('fakebookConversation:alice',{});dummy.comments=[];forced=.001;assert(!engine.autoComment(dummy,'alice',normal(),.05).negative);
// 애매한 자유 입력은 난수가 낮아도 생성하지 않습니다.
put('fakebookConversation:alice',{});assert(!engine.autoComment(post('특별한 맥락이 없는 문장'),'alice',normal(),.05).negative);
// 이전 끄기 설정을 더 이상 읽지 않습니다.
put('fakebookSimulation:alice',{negativeComments:false});const own=post();const ownComment=engine.autoComment(own,'alice',normal(),.03);assert(ownComment.negative);
// 원문이 바뀌어 쌍이 맞지 않으면 답글을 취소합니다.
const changed={...own,text:TEXTS[1],comments:[ownComment]};put('fakebookPosts',[changed]);time+=600000;engine.tickDefenses('alice');assert(read('fakebookPosts')[0].comments[0].defensePlan.cancelled);assert(!read('fakebookPosts')[0].comments[0].replies);
// 예전 자동 댓글만 고치고 사용자 상호작용이 있으면 보존합니다.
const old=(id,text,engaged=false)=>({id,authorId:'alice',text,comments:[{id:'neg-'+id,authorId:'demo-1',negative:true,simulated:true,text:'맥락이 다른 옛 댓글',likedBy:engaged?['alice']:[],defensePlan:{dueAt:time+120000,done:false},replies:[{id:'def-'+id,authorId:'demo-2',defense:true,simulated:true,text:'옛 답글',likedBy:[]}]}]});
put('fakebookPosts',[old('repair',TEXTS[20]),old('keep',TEXTS[0],true),old('unknown','알 수 없는 내용')]);engine=create({storage,now:()=>time,random});engine.boot();let posts=read('fakebookPosts'),repaired=posts.find(p=>p.id==='repair').comments[0];assert.equal(repaired.text,TEMPLATE_PAIRS[20].negative);assert.equal(repaired.replies[0].text,TEMPLATE_PAIRS[20].defense);assert.equal(repaired.id,'neg-repair');
assert.equal(posts.find(p=>p.id==='keep').comments[0].text,'맥락이 다른 옛 댓글');assert(posts.find(p=>p.id==='keep').comments[0].defensePlan.cancelled);assert.equal(posts.find(p=>p.id==='unknown').comments.length,0);
const snapshot=map.get('fakebookPosts');engine.boot();assert.equal(map.get('fakebookPosts'),snapshot);
// 삭제된 부모 댓글에 답글을 생성하지 않습니다.
put('fakebookPosts',[{id:'deleted',text:TEXTS[0],comments:[]}]);engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments.length,0);
// 제지 답글 생성량과 계정 경계를 유지합니다.
const pending=[];
for(let i=0;i<3;i++) {time+=600000;put('fakebookConversation:alice',{});const item=post(TEXTS[i]);const reply=engine.autoComment(item,'alice',normal(),.03);item.comments.push(reply);pending.push(item);}
put('fakebookPosts',pending);time+=600000;engine.tickDefenses('bob');assert(read('fakebookPosts').every(p=>!p.comments[0].replies));engine.tickDefenses('alice');assert.equal(read('fakebookPosts').filter(p=>p.comments[0].replies?.length).length,2);engine.tickDefenses('alice');assert(read('fakebookPosts').every(p=>p.comments[0].replies.length===1));
console.log('PASS: 50 exact post/negative/defense pairs, 8 conservative own-post contexts, ambiguous/negative/question/multi-topic skip, probabilities/caps/delay/author/duplicate guards; edited-post cancellation; retired preferences; safe one-time legacy repair and persistence');
