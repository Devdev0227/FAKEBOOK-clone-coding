const assert=require('node:assert/strict'),{create,CONTENT,TEXTS}=require('../js/ambient.js');
const time=Date.parse('2026-11-13T12:00:00Z'),map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
let seed=2456;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
assert.equal(CONTENT.length,50);assert.equal(new Set(TEXTS).size,50);
for(const item of CONTENT){assert(item.comments.length>=2&&item.comments.length<=5);assert.equal(new Set(item.comments).size,item.comments.length);}
const keep={id:'demo-post:demo-1:0',authorId:'demo-1',author:'원래 친구',demo:true,text:TEXTS[0],createdAt:new Date(time-600000).toISOString(),likedBy:['alice'],savedBy:['alice'],comments:[{id:'user-comment',authorId:'alice',text:'내가 쓴 댓글'}]};
map.set('fakebookPosts',JSON.stringify([keep]));map.set('fakebookDummyProfiles',JSON.stringify([{id:'demo-1',name:'원래 친구',ambientCatalog:1,sampleIndices:[0]}]));map.set('fakebookFriends:alice',JSON.stringify({friends:['demo-1'],requests:[],dismissed:[]}));
let engine=create({storage,now:()=>time,random});engine.boot();let posts=JSON.parse(map.get('fakebookPosts'));
const old=posts.find(p=>p.id===keep.id);assert.equal(old.text,keep.text);assert(old.likedBy.includes('alice'));assert.deepEqual(old.savedBy,['alice']);assert(old.comments.some(c=>c.id==='user-comment'&&c.text==='내가 쓴 댓글'));assert.equal(JSON.parse(map.get('fakebookFriends:alice')).friends[0],'demo-1');
for(const post of posts){
 const template=CONTENT.find(item=>item.text===post.text);assert(template);
 const seeded=post.comments.filter(c=>c.seeded);assert(seeded.length>=2&&seeded.length<=5);assert.equal(new Set(seeded.map(c=>c.id)).size,seeded.length);assert.equal(new Set(seeded.map(c=>c.authorId)).size,seeded.length);
 assert(seeded.every(c=>template.comments.includes(c.text)&&c.authorId!==post.authorId&&engine.profiles.some(p=>p.id===c.authorId)&&Date.parse(c.createdAt)>=Date.parse(post.createdAt)&&Date.parse(c.createdAt)<=time));
 assert.equal(new Set(post.likedBy).size,post.likedBy.length);assert(!post.likedBy.includes(post.authorId));
}
const snapshot=map.get('fakebookPosts');engine=create({storage,now:()=>time,random});engine.boot();assert.equal(map.get('fakebookPosts'),snapshot);
const rec=engine.recommendations(engine.shuffle(engine.profiles));assert.equal(rec.length,10);assert.equal(new Set(rec.map(p=>p.avatar)).size,10);assert(rec.filter(p=>p.avatarKind==='default').length<=1);
assert.equal(engine.recommendations(Array.from({length:20},(_,i)=>({id:i,avatar:'img/default-avatar.svg'}))).length,1);
const selected=engine.selectHomePosts(posts);assert(selected.length>0&&selected.length<=10);const home=selected.map(id=>posts.find(p=>p.id===id));assert.equal(new Set(home.map(p=>p.text)).size,home.length);assert.equal(new Set(home.map(p=>p.authorId)).size,home.length);
const dup=[...posts,{...posts[0],id:'duplicate'}, {id:'own',authorId:'alice',text:posts[0].text}];const uniqueHome=engine.selectHomePosts(dup).map(id=>dup.find(p=>p.id===id));assert(uniqueHome.every(p=>p.text!==posts[0].text));assert.equal(new Set(uniqueHome.map(p=>p.text)).size,uniqueHome.length);
assert.deepEqual(engine.selectHomePosts([]),[]);
console.log('PASS: 50 unique content templates with 2–5 matched replies, persisted dummy-author comments and randomized unique likes; preserved user interactions; photo-unique recommendations; content/author-unique bounded home sampling and empty cases');
