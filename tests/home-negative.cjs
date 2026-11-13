const assert=require('node:assert/strict'),{create,TEXTS,TEMPLATE_PAIRS}=require('../js/ambient.js');
let time=Date.parse('2026-11-13T00:00:00Z'),seed=241,fail=false,forced=null;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');map.set(k,v)}};
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
const read=()=>JSON.parse(map.get('fakebookPosts'));
let engine=create({storage,now:()=>time,random});engine.boot();
const base=Array.from({length:20},(_,i)=>({id:'post-'+i,authorId:engine.profiles[i].id,author:engine.profiles[i].name,demo:true,text:TEXTS[i],comments:[],likedBy:[],savedBy:[],createdAt:new Date(time-i*60000).toISOString()}));
base.push({id:'own',authorId:'alice',text:TEXTS[0],comments:[],createdAt:new Date(time).toISOString()});map.set('fakebookPosts',JSON.stringify(base));
map.set('fakebookConversation:alice',JSON.stringify({lastWasNegative:true,nextNegativeAt:time+86400000}));forced=.999;
let posts=read();assert.equal(engine.ensureHomeNegative(posts,'alice'),true);let ids=engine.selectHomePosts(posts);assert.equal(ids.length,10);let shown=ids.map(id=>posts.find(p=>p.id===id));assert(shown.some(p=>p.comments.some(c=>c.negative)));assert.equal(new Set(shown.map(p=>p.text)).size,10);assert.equal(new Set(shown.map(p=>p.authorId)).size,10);assert(!shown.some(p=>p.text===TEXTS[0]));
const featured=shown.find(p=>p.comments.some(c=>c.negative)),c=featured.comments.find(c=>c.negative),pair=engine.conversationPair(featured);assert.equal(c.text,pair.negative);assert.notEqual(c.authorId,featured.authorId);assert(featured.negativeCommentUsed);assert.equal(c.homeExample,true);
const snapshot=map.get('fakebookPosts');assert.equal(engine.ensureHomeNegative(posts,'alice'),false);assert.equal(map.get('fakebookPosts'),snapshot);assert.deepEqual(engine.selectHomePosts(posts,10,ids),ids);
// 기존 부정 댓글을 우선 선택하며 순위가 뒤여도 항상 포함.
for(let n=0;n<100;n++){forced=null;const selected=engine.selectHomePosts(posts);assert.equal(selected.length,10);assert(selected.some(id=>posts.find(p=>p.id===id).comments.some(c=>c.negative)));assert.equal(new Set(selected.map(id=>posts.find(p=>p.id===id).text)).size,10);}
// 같은 접속 중 댓글/좋아요 갱신은 목록을 재추첨하지 않음.
posts.find(p=>p.id===ids[2]).likedBy.push('alice');assert.deepEqual(engine.selectHomePosts(posts,10,ids),ids);
// 현재 선택 밖의 부정 댓글을 보충할 때 기존 슬롯은 가능한 한 유지.
const noFeature=engine.selectHomePosts(posts.filter(p=>p.id!==featured.id));const supplemented=engine.selectHomePosts(posts,10,noFeature);assert(supplemented.includes(featured.id));assert(supplemented.filter(id=>noFeature.includes(id)).length>=8);
// 재접속해도 이미 생성한 예시 댓글을 중복 저장하지 않음.
engine=create({storage,now:()=>time,random});engine.boot();posts=read();assert.equal(posts.find(p=>p.id===featured.id).comments.filter(c=>c.negative).length,1);engine.ensureHomeNegative(posts,'alice');assert.equal(read().find(p=>p.id===featured.id).comments.filter(c=>c.negative).length,1);
// 저장 실패는 전달받은 화면 데이터에 가짜 댓글을 표시하지 않음.
const clean=base.filter(p=>p.id!=='own').map(p=>({...p,comments:[],negativeCommentUsed:false}));map.set('fakebookPosts',JSON.stringify(clean));posts=read();fail=true;assert.equal(engine.ensureHomeNegative(posts,'alice'),false);assert(posts.every(p=>!p.comments.length));assert(read().every(p=>!p.comments.length));fail=false;
// 적은 후보/후보 없음, 같은 내용 중복, 사진만/알 수 없는 템플릿은 안전하게 처리.
map.set('fakebookPosts',JSON.stringify([clean[0]]));posts=read();engine.ensureHomeNegative(posts,'alice');assert.equal(engine.selectHomePosts(posts).length,1);assert(posts[0].comments.some(c=>c.negative));
assert.deepEqual(engine.selectHomePosts([]),[]);assert.deepEqual(engine.selectHomePosts(posts,0),[]);assert.equal(engine.ensureHomeNegative([],'alice'),false);
console.log('PASS: home includes a contextual negative example despite random/cooldown, max 10 with unique text/authors, own-text exclusion, stable selections/minimal replenishment, persisted single example, reload, save-failure safety and scarce/empty candidates');
