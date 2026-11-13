const assert=require('node:assert/strict'),{create,LIMITS,TEXTS}=require('../js/ambient.js');
const M=60000,H=60*M,D=24*H;
let time=Date.parse('2026-11-13T00:00:00Z'),seed=431,forced=null,fail=false;
const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');map.set(k,v)}};
const read=k=>JSON.parse(map.get(k));const put=(k,v)=>map.set(k,JSON.stringify(v));
put('fakebookUsers',[{id:'alice',name:'김학생'},{id:'bob',name:'이학생'}]);
put('fakebookDummyProfiles',[{id:'demo-1',name:'기존 친구',avatar:'old',bio:'보존'}]);
put('fakebookPosts',[{id:'demo-post:demo-1:1',authorId:'demo-1',author:'기존 친구',text:'옛 반복 글',demo:true,likedBy:['alice'],savedBy:['alice'],comments:[{id:'keep',text:'기존 댓글'}]}]);
const activity=create({storage,now:()=>time,random:rng});activity.boot();
assert.equal(activity.profiles.length,40);assert.equal(activity.profiles[0].name,'기존 친구');assert.equal(activity.profiles[0].bio,'보존');
assert.equal(new Set(activity.profiles.map(p=>p.avatarKind)).size,6);assert.equal(TEXTS.length,50);
assert(activity.profiles.every(p=>p.sampleIndices.length>=0&&p.sampleIndices.length<=3));
let preserved=read('fakebookPosts').find(p=>p.id==='demo-post:demo-1:1');assert(preserved);assert.deepEqual(preserved.comments,[{id:'keep',text:'기존 댓글'}]);assert.deepEqual(preserved.likedBy,['alice']);assert.equal(preserved.text,'옛 반복 글');
const snapshot=map.get('fakebookPosts'),catalog=map.get('fakebookDummyProfiles');create({storage,now:()=>time,random:rng}).boot();assert.equal(map.get('fakebookPosts'),snapshot);assert.equal(map.get('fakebookDummyProfiles'),catalog);
for(const p of activity.profiles){const count=read('fakebookPosts').filter(x=>x.authorId===p.id).length;assert(count<=3);}
activity.tickRequests('alice');assert(read('fakebookFriends:alice').requests.length<=4);
let s=read('fakebookFriends:alice');s.requests=['demo-2'];s.friends=['demo-1'];s.requestExpiry={'demo-2':time+M};s.nextRequestAt=time+100*H;put('fakebookFriends:alice',s);time+=2*M;activity.tickRequests('alice');s=read('fakebookFriends:alice');assert.equal(s.requests.length,0);assert(s.requestCooldown['demo-2']>time);assert.deepEqual(s.friends,['demo-1']);
// 長기간 미접속 후에도 도착 요청은 최대 2개, 다음 도착은 미래로 예약.
s.nextRequestAt=time-30*D;put('fakebookFriends:alice',s);activity.tickRequests('alice');s=read('fakebookFriends:alice');assert(s.requests.length<=2);assert(!s.requests.includes('demo-1'));assert(!s.requests.includes('demo-2'));assert(s.nextRequestAt>time);
let before=map.get('fakebookFriends:alice');activity.tickRequests('alice');assert.equal(map.get('fakebookFriends:alice'),before);
for(let i=0;i<400;i++){time+=20*M;activity.tickRequests('alice');const s=read('fakebookFriends:alice');assert(s.requests.length<=10);assert.equal(new Set(s.requests).size,s.requests.length);assert(s.requests.every(id=>s.requestExpiry[id]>time));assert(Object.keys(s.requestExpiry).length<=10);assert(Object.keys(s.requestCooldown).length<=40);}
assert(!map.has('fakebookFriends:bob'));activity.tickRequests('bob');assert(map.has('fakebookFriends:bob'));
// 실제 본인 글에만 반응하며 전체·글별 상한, 중복 방지, 쿨다운 확인.
put('fakebookPosts',Array.from({length:8},(_,i)=>({id:'p'+i,authorId:i===7?'bob':'alice',author:i===7?'이학생':'김학생',text:'테스트 글',likedBy:[],comments:[],createdAt:new Date(time-H).toISOString()})));
forced=.5;activity.tickPosts('alice');let posts=read('fakebookPosts');assert(posts.reduce((n,p)=>n+p.likedBy.length,0)<=LIMITS.reactionsPerTick);assert.equal(posts[7].likedBy.length,0);const after=map.get('fakebookPosts');activity.tickPosts('alice');assert.equal(map.get('fakebookPosts'),after);
for(let i=0;i<60;i++){time+=13*M;activity.tickPosts('alice');}
posts=read('fakebookPosts');assert(posts.slice(0,7).every(p=>p.likedBy.length<=12&&new Set(p.likedBy).size===p.likedBy.length));assert(posts.some(p=>p.likedBy.length===12));
forced=.1;for(let i=0;i<40;i++){time+=13*M;activity.tickPosts('alice');}posts=read('fakebookPosts');assert(posts.some(p=>p.comments.length===3));assert(posts.every(p=>p.comments.length<=3));assert(posts.every(p=>new Set(p.comments.map(c=>c.authorId)).size===p.comments.length));assert(posts.every(p=>new Set(p.comments.map(c=>c.text)).size===p.comments.length));
let p=posts[0];assert.equal(p.ambient.comments,3);p.comments=[];put('fakebookPosts',posts);time+=13*M;activity.tickPosts('alice');assert.equal(read('fakebookPosts')[0].comments.length,0);
const oldPost={id:'old',authorId:'alice',text:'old',createdAt:new Date(time-8*D).toISOString()};put('fakebookPosts',[oldPost]);assert.equal(activity.tickPosts('alice'),false);assert.deepEqual(read('fakebookPosts'),[oldPost]);
fail=true;time+=D;assert.doesNotThrow(()=>activity.tick('alice'));fail=false;
console.log('PASS: 40 varied profiles, stable 0–3/50 sample allocation and legacy interaction migration; expiring bounded requests/cooldowns/offline catch-up/account isolation; probabilistic reactions, no duplicate likes/comments, age/lifetime/batch limits, deletion preservation and quota failures');


