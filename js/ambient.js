// 브라우저 안에서만 동작하는 SNS 활동 시뮬레이션. Node에서도 같은 엔진을 검사합니다.
(function (scope) {
    'use strict';
    const MINUTE = 60000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;
    const LIMITS = Object.freeze({profiles: 40, recommendations: 10, requests: 10, offlineRequests: 2, likes: 12, comments: 3, reactionsPerTick: 6, postAge: 7 * DAY});
    const TEXTS = [
        '오늘은 평소보다 조금 일찍 일어나서 동네를 걸었다. 아침 공기가 좋네.',
        '밀린 과제 하나 끝! 잠깐 쉬었다가 다음 것도 시작해야겠다.',
        '오랜만에 책을 펼쳤는데 생각보다 시간이 빨리 갔다.',
        '이어폰으로 듣기 좋은 노래를 찾는 중. 추천 있나요?',
        '새로 생긴 카페에 다녀왔다. 다음에는 다른 메뉴도 먹어봐야지.',
        '비 오는 날 창밖 보는 시간이 은근 좋다.',
        '사진 정리하다 작년 여행 사진을 발견했다. 또 가고 싶다.',
        '오늘 저녁은 집밥. 간단하게 해 먹는 게 제일 편한 날도 있다.',
        '주말 계획은 아직 없지만 일단 늦잠은 확정.',
        '운동은 가기 전이 제일 어렵고 끝나면 항상 뿌듯하다.',
        '걷다가 예쁜 꽃을 봤다. 계절이 바뀌는 게 느껴진다.',
        '친구랑 별 얘기 없이 오래 통화했다. 이런 시간이 필요했나 보다.',
        '새로운 취미를 하나 시작해볼까 고민 중이다.',
        '코드가 드디어 돌아간다! 사소한 오타를 한참 찾았다.',
        '점심 메뉴 고르는 게 하루 중 가장 어려운 결정일지도.',
        '오늘 하늘 색이 예뻐서 잠깐 멈춰서 봤다.',
        '일정을 너무 꽉 채우지 않기로 했다. 쉬는 시간도 일정에 넣기.',
        '오랜만에 방 정리. 책상만 깔끔해져도 기분이 달라진다.',
        '영화 한 편 보고 왔다. 여운이 남아서 음악을 다시 듣는 중.',
        '이번 주도 수고 많았다. 다음 주에는 조금 덜 바쁘면 좋겠다.'
    ];
    function create({storage, now = Date.now, random = Math.random} = {}) {
        const read = (key, fallback) => { try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; } };
        const write = (key, value) => { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
        const int = (min, max) => min + Math.floor(random() * (max - min + 1));
        const pick = values => values[int(0, values.length - 1)];
        const shuffle = values => { const copy = [...values]; for (let i = copy.length - 1; i > 0; i--) { const j = int(0, i); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
        const svgUrl = body => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`);
        function avatar(kind, seed) {
            if (kind === 'default') return 'img/default-avatar.svg';
            const hue = seed % 360;
            if (kind === 'landscape') return svgUrl(`<rect width="120" height="120" fill="hsl(${190 + seed % 40} 65% 85%)"/><circle cx="88" cy="27" r="13" fill="#ffe49c"/><path d="M-10 100 35 30 90 120M42 120 90 52 135 120" fill="hsl(${120 + seed % 50} 24% 44%)"/><path d="M0 96q40-16 120 5v19H0" fill="hsl(${190 + seed % 30} 42% 60%)"/>`);
            if (kind === 'flower') return svgUrl(`<rect width="120" height="120" fill="hsl(${hue} 50% 92%)"/><path d="M60 120V52m0 44q-32 0-28-23 22 0 28 23m0-8q30 0 28-23-22 0-28 23" stroke="#528b61" stroke-width="5" fill="#85b87b"/><g fill="hsl(${(hue + 70) % 360} 65% 72%)"><ellipse cx="60" cy="36" rx="14" ry="23"/><ellipse cx="60" cy="36" rx="14" ry="23" transform="rotate(72 60 55)"/><ellipse cx="60" cy="36" rx="14" ry="23" transform="rotate(144 60 55)"/><ellipse cx="60" cy="36" rx="14" ry="23" transform="rotate(216 60 55)"/><ellipse cx="60" cy="36" rx="14" ry="23" transform="rotate(288 60 55)"/></g><circle cx="60" cy="55" r="13" fill="#ffd773"/>`);
            return svgUrl(`<rect width="120" height="120" fill="hsl(${hue} 50% 88%)"/><path d="M17 120a43 43 0 0 1 86 0" fill="hsl(${(hue+80)%360} 40% 48%)"/><circle cx="60" cy="53" r="29" fill="${pick(['#f2c5a4','#c58b64','#8d5c42','#f6d9bf'])}"/><path d="M30 51c-4-39 64-47 61 0-13-3-24-14-29-20-7 13-18 18-32 20" fill="#393333"/><circle cx="49" cy="54" r="2"/><circle cx="71" cy="54" r="2"/><path d="M51 68q9 8 18 0" fill="none" stroke="#754b3b" stroke-width="3"/>`);
        }
        let pool = [];
        function boot() {
            const old = read('fakebookDummyProfiles', []);
            pool = Array.isArray(old) ? old.map(p => ({...p})) : [];
            const names = new Set(pool.map(p => p.name));
            for (let i = 1; pool.length < LIMITS.profiles; i++) {
                if (pool.some(p => p.id === `demo-${i}`)) continue;
                const combinations = ['김','이','박','최','정','강','윤','한','송','임'].flatMap(a => ['서연','도윤','지우','민준','하린','시우','수빈','지호','예린','건우','유진','서준','하늘','은우','다온','채원'].map(b => a+b)).filter(n => !names.has(n));
                const name = combinations.length ? pick(combinations) : `친구 ${i}`; names.add(name);
                pool.push({id:`demo-${i}`, name, dummy:true, bio:pick(['사진과 산책을 좋아해요.','천천히 배우는 중','음악과 함께하는 일상 🎧','맛있는 음식과 여행 이야기','작은 일상을 기록합니다.']), birthday:`${int(1996,2007)}-${String(int(1,12)).padStart(2,'0')}-${String(int(1,28)).padStart(2,'0')}`});
            }
            const kinds = shuffle(Array.from({length:pool.length}, (_,i)=>['default','face','landscape','flower'][i%4]));
            pool.forEach((person, index) => {
                if (!person.ambientCatalog) {
                    person.avatarKind = kinds[index]; person.avatar = avatar(person.avatarKind, int(0,10000));
                    person.sampleIndices = shuffle(TEXTS.map((_,i)=>i)).slice(0,int(0,3));
                    person.ambientCatalog = 1;
                }
            });
            if (JSON.stringify(old) !== JSON.stringify(pool)) write('fakebookDummyProfiles',pool);
            seedPosts(); return pool;
        }
        function seedPosts() {
            const posts = read('fakebookPosts', []); if (!Array.isArray(posts)) return;
            const original = JSON.stringify(posts);
            const desired = new Map(); pool.forEach(person=>person.sampleIndices.forEach((text,index)=>desired.set(`demo-post:${person.id}:${index}`,{person,text,index})));
            const engaged = p => (p.likedBy?.length || p.savedBy?.length || p.comments?.length || p.legacyLikes || p.likes || p.media?.length);
            const next = posts.filter(p=> !p.demo || !String(p.id).startsWith('demo-post:') || desired.has(p.id) || engaged(p));
            next.forEach(p=> {
                if (p.demo && !p.ambientSampleVersion && pool.some(person=>person.id===p.authorId)) {
                    const match = desired.get(p.id); const index = match?.text ?? int(0,TEXTS.length-1);
                    p.text = TEXTS[index]; p.ambientSampleVersion = 1;
                }
            });
            const ids = new Set(next.map(p=>p.id));
            for (const [id,{person,text}] of desired) if (!ids.has(id)) next.push({id,authorId:person.id,author:person.name,text:TEXTS[text],demo:true,ambientSampleVersion:1,createdAt:new Date(now()-int(1,14*24)*HOUR).toISOString(),likedBy:[],savedBy:[],comments:[],media:[],legacyLikes:0});
            if (original !== JSON.stringify(next)) write('fakebookPosts',next);
        }
        function friends(id) { return read(`fakebookFriends:${id}`,{friends:[],dismissed:[],requests:[]}); }
        function tickRequests(id) {
            const key = `fakebookFriends:${id}`, time = now(), old = read(key,null);
            const s = old ? {...old} : {friends:[],dismissed:[],requests:shuffle(pool.map(p=>p.id)).slice(0,int(0,4))};
            s.friends = [...new Set(s.friends || [])]; s.dismissed = [...new Set(s.dismissed || [])];
            s.requests = [...new Set(s.requests || [])].filter(x=>!s.friends.includes(x)).slice(0,LIMITS.requests);
            s.requestExpiry = {...s.requestExpiry}; s.requestCooldown = {...s.requestCooldown};
            for (const [key,until] of Object.entries(s.requestCooldown)) if (until <= time) delete s.requestCooldown[key];
            for (const candidate of s.requests) {
                if (!s.requestExpiry[candidate]) s.requestExpiry[candidate] = time + int(25,150)*MINUTE;
                if (s.requestExpiry[candidate] <= time) s.requestCooldown[candidate] = time + 12*HOUR;
            }
            s.requests = s.requests.filter(candidate=>s.requestExpiry[candidate] > time);
            for (const key of Object.keys(s.requestExpiry)) if (!s.requests.includes(key)) delete s.requestExpiry[key];
            if (!Number.isFinite(s.nextRequestAt)) s.nextRequestAt = time + int(8,35)*MINUTE;
            if (s.nextRequestAt <= time) {
                const candidates = shuffle(pool.map(p=>p.id).filter(x=>!s.friends.includes(x)&&!s.requests.includes(x)&&!s.dismissed.includes(x)&&!s.requestCooldown[x]));
                const added = candidates.slice(0,Math.min(int(1,LIMITS.offlineRequests),LIMITS.requests-s.requests.length));
                for (const candidate of added) {s.requests.push(candidate); s.requestExpiry[candidate]=time+int(25,150)*MINUTE;}
                s.nextRequestAt = time + int(8,35)*MINUTE;
            }
            s.ambientVersion = 1;
            return JSON.stringify(old)!==JSON.stringify(s) && write(key,s);
        }
        function tickPosts(id) {
            const time=now(), posts=read('fakebookPosts',[]), members=read('fakebookUsers',[]);
            if (!Array.isArray(posts)) return false;
            const original=JSON.stringify(posts), known = new Set(pool.map(p=>p.id)); let budget=LIMITS.reactionsPerTick;
            const related=friends(id).friends || [];
            for (const post of posts) {
                const owner=post.authorId || (members.filter(u=>u.name===post.author).length===1 ? members.find(u=>u.name===post.author).id : null);
                const created=Date.parse(post.createdAt), age=time-created;
                if (owner!==id || post.demo || !Number.isFinite(age) || age<0 || age>LIMITS.postAge) continue;
                const meta=post.ambient || {nextAt:created+int(1,4)*MINUTE,likes:(post.likedBy||[]).filter(x=>known.has(x)).length,comments:(post.comments||[]).filter(c=>c.simulated).length};
                post.ambient=meta;
                if (meta.nextAt>time) continue;
                // 미접속 기간 전체를 재생하지 않고 한 번의 제한된 배치로 처리합니다.
                const attempts=Math.min(2,budget); let due=Math.max(created+MINUTE,meta.nextAt);
                for(let n=0;n<attempts;n++) {
                    if (meta.likes>=LIMITS.likes && meta.comments>=LIMITS.comments) break;
                    if (random()>.7) continue;
                    const wantComment=random()<.24 && meta.comments<LIMITS.comments;
                    if (!wantComment && meta.likes>=LIMITS.likes) continue;
                    const blocked=wantComment ? (post.comments||[]).filter(c=>c.simulated).map(c=>c.authorId) : (post.likedBy||[]);
                    const available=pool.filter(p=>!blocked.includes(p.id));
                    const close=available.filter(p=>related.includes(p.id)); const person=pick(close.length && random()<.75?close:available);
                    if (!person) continue;
                    if (wantComment) {
                        const text=pick(['잘 읽었어.','공유해줘서 고마워!','소식 잘 보고 가요.',...(post.media?.length ? ['사진·영상 잘 봤어!','기록 남겨줘서 고마워.'] : ['이야기 남겨줘서 고마워.','다음 소식도 기다릴게.'])].filter(text=>!(post.comments||[]).some(c=>c.simulated&&c.text===text)));
                        if (!text) continue;
                        post.comments ||= [];
                        post.comments.push({id:`ambient:${post.id}:${person.id}:${meta.comments}`,authorId:person.id,author:person.name,text,likedBy:[],simulated:true,createdAt:new Date(Math.min(time,due)).toISOString()}); meta.comments++;
                    } else {post.likedBy ||= []; post.likedBy.push(person.id);meta.likes++;}
                    budget--; due+=MINUTE;
                }
                meta.nextAt=time+int(2,12)*MINUTE;
            }
            return original!==JSON.stringify(posts) && write('fakebookPosts',posts);
        }
        function tick(id) { if (!id) return false; const requests=tickRequests(id); const posts=tickPosts(id); return Boolean(requests||posts); }
        return {boot,tick,tickRequests,tickPosts,friends,shuffle,limits:LIMITS,get profiles(){return pool;}};
    }
    const api={create,LIMITS,TEXTS};
    if (typeof module!=='undefined' && module.exports) module.exports=api;
    else scope.FakebookAmbient=api;
})(typeof window!=='undefined'?window:globalThis);
