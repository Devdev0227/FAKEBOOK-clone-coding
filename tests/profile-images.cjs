const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{create,AVATARS}=require('../js/ambient.js');
const root=path.join(__dirname,'..'),files=Object.values(AVATARS).flat();
assert.equal(new Set(files).size,36);for(const file of files)assert(fs.existsSync(path.join(root,file)),file);
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
map.set('fakebookDummyProfiles',JSON.stringify([{id:'demo-1',name:'기존 친구',bio:'원래 소개',birthday:'2001-05-12',ambientCatalog:1,sampleCatalogVersion:2,avatar:'data:image/svg+xml,old',sampleIndices:[2]}]));
let seed=390;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
let engine=create({storage,random:rng});engine.boot();const p=engine.profiles[0];assert.equal(p.name,'기존 친구');assert.equal(p.bio,'원래 소개');assert.equal(p.birthday,'2001-05-12');assert.deepEqual(p.sampleIndices,[2]);assert.equal(p.avatarAssetVersion,2);
assert(engine.profiles.every(p=>files.includes(p.avatar)));assert.equal(new Set(engine.profiles.map(p=>p.avatar)).size,36);
const snapshot=map.get('fakebookDummyProfiles'),posts=map.get('fakebookPosts');engine=create({storage,random:rng});engine.boot();assert.equal(map.get('fakebookDummyProfiles'),snapshot);assert.equal(map.get('fakebookPosts'),posts);
const sources=JSON.parse(fs.readFileSync(path.join(root,'img/profiles/sources.json'),'utf8'));assert.equal(sources.length,27);
for(const source of sources){const file=path.join(root,'img/profiles',source.file);assert.equal(fs.statSync(file).size,source.bytes);const data=fs.readFileSync(file);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert(source.source.startsWith('https://images.unsplash.com/'));assert.equal(source.license,'https://unsplash.com/license');}
assert(sources.reduce((n,s)=>n+s.bytes,0)<400000);
for(const file of AVATARS.face){const svg=fs.readFileSync(path.join(root,file),'utf8');assert(svg.includes('viewBox="0 0 256 256"'));assert(!/<script|<image|href=/.test(svg));}
console.log('PASS: all 36 local image paths, 27 WebP signatures/source records/size budget, 8 self-contained face SVGs, complete varied allocation, one-time migration and reload persistence without identity/post changes');

