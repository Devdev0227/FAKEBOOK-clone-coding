const assert=require('node:assert/strict'),{create,NEGATIVE_COMMENTS,DEFENSE_COMMENTS}=require('../js/ambient.js');
let time=Date.parse('2026-11-13T00:00:00Z'),forced=null,seed=482,fail=false;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');map.set(k,v)}};
const put=(k,v)=>map.set(k,JSON.stringify(v)),read=k=>JSON.parse(map.get(k));
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
const engine=create({storage,now:()=>time,random});engine.boot();
assert.equal(NEGATIVE_COMMENTS.length,30);assert.equal(new Set(NEGATIVE_COMMENTS).size,30);assert.equal(DEFENSE_COMMENTS.length,20);assert.equal(new Set(DEFENSE_COMMENTS).size,20);assert.equal(engine.profiles.filter(p=>p.temperament==='blunt').length,3);
const normalAuthor=engine.profiles.find(p=>p.temperament!=='blunt');let index=0;
const post=()=>({id:'p'+ ++index,authorId:'alice',text:'그냥 일상을 기록했어요.',createdAt:new Date(time).toISOString(),comments:[]});
const normal=()=>({id:'c'+index,authorId:normalAuthor.id,author:normalAuthor.name,text:'소식 잘 보고 가요.',simulated:true,likedBy:[],createdAt:new Date(time).toISOString()});
forced=.04;let own=post();assert(!engine.autoComment(own,'alice',normal(),.03).negative);
let dummy=post();let c=engine.autoComment(dummy,'alice',normal(),.05);assert(c.negative);assert(dummy.negativeCommentUsed);assert(c.defensePlan.dueAt>=time+120000&&c.defensePlan.dueAt<=time+600000);assert(engine.profiles.some(p=>p.id===c.authorId&&p.temperament==='blunt'));dummy.comments.push(c);
let other=post();assert(!engine.autoComment(other,'alice',normal(),.05).negative); // 연속/간격 제한
put('fakebookPosts',[dummy]);const snapshot=map.get('fakebookPosts');engine.tickDefenses('alice');assert.equal(map.get('fakebookPosts'),snapshot);
time=c.defensePlan.dueAt;engine.tickDefenses('alice');let stored=read('fakebookPosts')[0].comments[0];assert.equal(stored.replies.length,1);assert(stored.replies[0].defense);assert.notEqual(stored.replies[0].authorId,c.authorId);assert.notEqual(stored.replies[0].authorId,dummy.authorId);assert(DEFENSE_COMMENTS.includes(stored.replies[0].text));assert(!stored.replies[0].defensePlan);
engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments[0].replies.length,1);
// 글당 한 번만 부정적 댓글: 원 댓글이 삭제돼도 생성 횟수를 보존.
time+=600000;put('fakebookConversation:alice',{});dummy.comments=[];forced=.001;assert(!engine.autoComment(dummy,'alice',normal(),.05).negative);
// 3%/5%의 경계와 내용별 후보 선택.
let own2=post();put('fakebookConversation:alice',{});let negative=engine.autoComment(own2,'alice',normal(),.03);assert(negative.negative);
assert(engine.negativeCandidates({text:'러닝 운동 기록'}).includes('이 정도로 벌써 뿌듯해?'));assert(!engine.negativeCandidates({text:'아무 이야기'}).includes('구도가 조금 아쉬워 보이네.'));
// 숨김/끄기/삭제된 부모는 예정 답글을 만들지 않음.
const planned=(id,hidden=false)=>({id,authorId:'alice',comments:[{id:'neg-'+id,authorId:c.authorId,negative:true,negativeAt:time,hiddenBy:hidden?['alice']:[],defensePlan:{dueAt:time-1,done:false}}]});
put('fakebookPosts',[planned('hidden',true)]);engine.tickDefenses('alice');stored=read('fakebookPosts')[0].comments[0];assert(stored.defensePlan.cancelled);assert(!stored.replies);
put('fakebookSimulation:alice',{negativeComments:false});put('fakebookConversation:alice',{});assert(!engine.autoComment(post(),'alice',normal(),.05).negative);assert.equal(engine.conversationSettings('bob').negativeComments,true);
put('fakebookPosts',[planned('disabled')]);engine.tickDefenses('alice');assert(read('fakebookPosts')[0].comments[0].defensePlan.cancelled);
put('fakebookSimulation:alice',{negativeComments:true});engine.tickDefenses('alice');assert(!read('fakebookPosts')[0].comments[0].replies);
put('fakebookPosts',[{id:'deleted-parent',authorId:'alice',comments:[]}]);engine.tickDefenses('alice');assert.equal(read('fakebookPosts')[0].comments.length,0);
// 긴 미접속에도 한 번에 제지 답글 최대 2개. 새 엔진으로 재접속해도 중복 없음.
put('fakebookPosts',[planned('one'),planned('two'),planned('three')]);engine.tickDefenses('alice');assert.equal(read('fakebookPosts').filter(p=>p.comments[0].replies?.length).length,2);
const again=create({storage,now:()=>time,random});again.boot();again.tickDefenses('alice');assert(read('fakebookPosts').filter(p=>['one','two','three'].includes(p.id)).every(p=>p.comments[0].replies.length===1));
const final=map.get('fakebookPosts');again.tickDefenses('alice');assert.equal(map.get('fakebookPosts'),final);
// 65% 경계: 댓글 생성 3%를 통과시킨 뒤 65% 이상이면 답글 예약 없음.
let sequence=[.01,.2,.2,.9];const noReply=create({storage,now:()=>time,random:()=>sequence.length?sequence.shift():.9});
noReply.boot();sequence=[.01,.2,.2,.9];put('fakebookConversation:alice',{});const nr=noReply.autoComment(post(),'alice',normal(),.03);assert(nr.negative);assert(!nr.defensePlan);
fail=true;assert.doesNotThrow(()=>engine.tickDefenses('alice'));fail=false;
console.log('PASS: 30 contextual negative/20 defense phrases, 3 designated personas, 3%/5% decision thresholds, no consecutive negatives and lifetime post cap; 65% delayed replies, different authors, no chains/duplicates, hidden/deleted/disabled cancellation, account preferences, offline batch bound and persistence');
