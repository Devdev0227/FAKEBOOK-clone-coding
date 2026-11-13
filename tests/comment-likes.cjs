const assert=require('node:assert/strict');
const {create}=require('../js/ambient.js');
let seed=8421,force=null,fail=false;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return force??seed/4294967296;};
const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');data.set(k,v);}};
const put=posts=>data.set('fakebookPosts',JSON.stringify(posts));
const get=()=>JSON.parse(data.get('fakebookPosts'));
const engine=create({storage,random});engine.boot();
const comment=(id,authorId='human')=>({id,authorId,text:'직접 쓴 댓글',likedBy:[]});
// Inclusive endpoints, numeric legacy likes, and every reply depth.
for(const [post,max] of [[{likedBy:[]},3],[{likedBy:['a','b'],legacyLikes:4},9],[{likes:7},10]]) {
  const c=comment('root');c.replies=[comment('reply','demo-1')];
  put([{id:'post',...post,comments:[c]}]);force=.999999;
  assert.equal(engine.tickCommentLikes(),true);
  const root=get()[0].comments[0];
  for(const item of [root,...root.replies]) {
    assert.equal(item.likedBy.length,max);
    assert.equal(new Set(item.likedBy).size,max);
    assert(!item.likedBy.includes(item.authorId));
    assert(item.likedBy.every(id=>engine.profiles.some(p=>p.id===id)));
    assert.equal(item.commentLikePlan.postLikes,max-3);
  }
  force=0;const before=data.get('fakebookPosts');
  assert.equal(engine.tickCommentLikes(),false);assert.equal(data.get('fakebookPosts'),before);
}
put([{id:'zero',likedBy:[],comments:[comment('zero')]}]);
assert.equal(engine.tickCommentLikes(),true);assert.equal(get()[0].comments[0].likedBy.length,0);
// Preserve manual likes and existing counts even above the initial target.
put([{id:'manual',likedBy:[],comments:[{...comment('manual'),likedBy:['human','demo-1','demo-2','demo-3','demo-4']}]}]);
engine.tickCommentLikes();assert.deepEqual(get()[0].comments[0].likedBy,['human','demo-1','demo-2','demo-3','demo-4']);
let post=get()[0];post.likedBy=['extra'];put([post]);engine.tickCommentLikes();
assert.equal(get()[0].comments[0].likedBy.length,5);
// A user's removal/addition is never undone, including after a reload.
post=get()[0];post.likedBy=[];post.comments[0].likedBy=['human'];put([post]);
create({storage,random}).boot();assert.deepEqual(get().find(p=>p.id==='manual').comments[0].likedBy,['human']);
// Large post totals stop at the distinct available dummy accounts.
force=.999999;put([{id:'large',legacyLikes:10000,comments:[comment('large','demo-1')]}]);
engine.tickCommentLikes();assert.equal(get()[0].comments[0].likedBy.length,39);
// Newly written human comments, positive/negative bots, and defensive replies all participate.
force=null;put([{id:'new',authorId:'other',comments:[comment('human'),{...comment('positive','demo-2'),simulated:true},{...comment('negative','demo-3'),simulated:true,negative:true,replies:[{...comment('defense','demo-4'),defense:true,simulated:true}]}],likedBy:['a','b','c']}]);
engine.tick('human');post=get()[0];
for(const c of [...post.comments,...post.comments.flatMap(c=>c.replies||[])])assert(c.commentLikePlan);
// Quota failures report failure and leave the saved record untouched; retry works.
put([{id:'fail',comments:[comment('fail')],likedBy:[]}]);const saved=data.get('fakebookPosts');
fail=true;assert.equal(engine.tickCommentLikes(),false);assert.equal(data.get('fakebookPosts'),saved);
fail=false;assert.equal(engine.tickCommentLikes(),true);
// Population range and coverage, with each result stable after processing.
put(Array.from({length:1000},(_,i)=>({id:'p'+i,likedBy:['a','b'],comments:[comment('c'+i)]})));
engine.tickCommentLikes();const counts=get().map(p=>p.comments[0].likedBy.length);
assert(counts.every(n=>n>=0&&n<=5));assert.equal(new Set(counts).size,6);
const snapshot=data.get('fakebookPosts');assert.equal(engine.tickCommentLikes(),false);assert.equal(data.get('fakebookPosts'),snapshot);
console.log('PASS: comment/reply like range 0..post+3, legacy totals, endpoint coverage, unique non-self dummy IDs, human likes/removals preserved, account cap, one-time persistence/reload, new-comment ticks and quota retry');
