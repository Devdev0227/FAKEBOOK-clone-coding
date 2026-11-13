const assert=require('node:assert/strict'),{create,POSITIVE_COMMENTS,OWN_COMMENT_PAIRS,OWN_PAIRS,TEXTS,TEMPLATE_PAIRS}=require('../js/ambient.js');
let time=Date.parse('2026-11-13T00:00:00Z'),seed=345,forced=null;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},random=()=>{seed=(seed*1664525+1013904223)>>>0;return forced??seed/4294967296};
const engine=create({storage,now:()=>time,random});engine.boot();
const positives=Object.values(POSITIVE_COMMENTS).flat();assert.equal(positives.length,56);assert.equal(new Set(positives).size,56);assert.equal(OWN_COMMENT_PAIRS.length,30);assert.equal(new Set(OWN_COMMENT_PAIRS.map(p=>p.negative)).size,30);assert(OWN_COMMENT_PAIRS.every(p=>p.defense));
const subjects=['오늘 러닝 3km 완주 기록.','오늘 파스타를 직접 만들었어.','주말에 바다 여행 다녀왔어.','밀린 과제를 끝냈어.','소설을 다 읽었어.','영화 보고 왔어.','책상 정리 완료!','버그를 해결했어.'];
for(let i=0;i<subjects.length;i++) {
 const options=engine.conversationOptions({text:subjects[i]},true);assert.equal(options.length,3);assert.equal(engine.positiveCandidates({text:subjects[i]}).length,27);
 for(const value of [.01,.5,.99]) {
  forced=value;const post={id:'topic-'+i+'-'+value,authorId:'alice',text:subjects[i],comments:[],createdAt:new Date(time).toISOString()};map.set('fakebookPosts',JSON.stringify([post]));engine.tickOwnConversations('alice');let current=JSON.parse(map.get('fakebookPosts'))[0];time=current.ownConversation.dueAt;engine.tickOwnConversations('alice');current=JSON.parse(map.get('fakebookPosts'))[0];const comment=current.comments[0],pair=options.find(p=>p.id===comment.negativePairId);assert(pair);assert.equal(comment.text,pair.negative);assert.equal(comment.defensePlan.primaryDefense,pair.defense);
  time=comment.defensePlan.dueAt;engine.tickDefenses('alice');const replies=JSON.parse(map.get('fakebookPosts'))[0].comments[0].replies;assert.equal(replies[0].text,pair.defense);assert(replies.length>=1&&replies.length<=2);assert.equal(new Set(replies.map(r=>r.text)).size,replies.length);
 }
}
const general=new Set();for(const value of [.01,.18,.35,.52,.69,.86]) {forced=value;const post={id:'general-'+value,authorId:'alice',text:'분류할 수 없는 내 일상',comments:[]};map.set('fakebookPosts',JSON.stringify([post]));engine.tickOwnConversations('alice');time=JSON.parse(map.get('fakebookPosts'))[0].ownConversation.dueAt;engine.tickOwnConversations('alice');general.add(JSON.parse(map.get('fakebookPosts'))[0].comments[0].text);}assert.equal(general.size,6);
// 50종 더미 글의 전용 문구는 그대로 보존.
for(let i=0;i<50;i++)assert.deepEqual(engine.conversationOptions({text:TEXTS[i]},true),[TEMPLATE_PAIRS[i]]);
assert.equal(engine.positiveCandidates({text:'특별한 맥락 없음'}).length,24);assert.equal(engine.positiveCandidates({text:'파일 첨부',media:[{id:'x'}]}).length,32);
// 이모지 선택은 난수·예약과 독립적으로 안정적이며 글/댓글 각각 약 30%.
const posts=Array.from({length:10000},(_,i)=>({id:'emoji-'+i,authorId:'demo-1',demo:true,text:'산책과 일상 기록',comments:[{id:'comment-'+i,authorId:'demo-2',simulated:true,text:'산책 소식 잘 봤어.'}]}));
engine.decoratePosts(posts);const postRatio=posts.filter(p=>p.emoji).length/posts.length,commentRatio=posts.filter(p=>p.comments[0].emoji).length/posts.length;assert(postRatio>.27&&postRatio<.33,postRatio);assert(commentRatio>.27&&commentRatio<.33,commentRatio);
assert(posts.every(p=>p.text==='산책과 일상 기록'&&p.comments[0].text==='산책 소식 잘 봤어.'));
const snapshot=JSON.stringify(posts);engine.decoratePosts(posts);assert.equal(JSON.stringify(posts),snapshot);
const human={id:'human',authorId:'alice',text:'내 글',comments:[{id:'manual',authorId:'alice',text:'내 댓글'}]};const original=JSON.stringify(human);engine.decoratePosts([human]);assert.equal(JSON.stringify(human),original);
const mixed={id:'mixed',authorId:'alice',text:'내 글',comments:[{id:'bot',authorId:'demo-1',simulated:true,text:'일반 반응',replies:[{id:'def',authorId:'demo-2',simulated:true,defense:true,text:'서로 배려하자.'}]}]};engine.decoratePosts([mixed]);assert(!mixed.emojiVersion);assert.equal(mixed.comments[0].emojiVersion,1);assert.equal(mixed.comments[0].replies[0].emojiVersion,1);
const already={id:'already',authorId:'demo-1',demo:true,text:'기존 이모지 🙂',comments:[]};engine.decoratePosts([already]);assert.equal(already.emoji,'');
console.log(`PASS: 56 unique positives, 30 paired own negatives including 6 generic variants, contextual defense/count preservation; emoji post ${(postRatio*100).toFixed(1)}% / comment ${(commentRatio*100).toFixed(1)}%, stable metadata with unchanged canonical/user text and no extra emoji stacking`);
