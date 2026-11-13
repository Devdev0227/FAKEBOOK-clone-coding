// 외부 API 없이 동작하는 더미 친구 및 계정별 프로필.
(() => {
    'use strict';
    const panel = document.getElementById('socialPanel');
    if (!panel) return;
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const actor = () => read('fakebookCurrentUser', null);
    if (!actor()?.id) return;
    const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
    const button = (text, action, primary = false) => { const node = el('button', text, primary ? 'social-button primary' : 'social-button'); node.type = 'button'; node.addEventListener('click', action); return node; };
    const notice = el('p', '', 'social-notice'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { notice.textContent = '저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인해주세요.'; return false; } };
    const pick = list => list[Math.floor(Math.random() * list.length)];
    function avatar(seed) {
        const backgrounds = ['#dae9ff', '#ffe2d5', '#d9f1e4', '#ece0ff', '#ffe9ad', '#d8edf1'];
        const skin = ['#f2c5a4', '#c58b64', '#8d5c42', '#f6d9bf'][seed % 4];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${backgrounds[seed % 6]}"/><path d="M17 120a43 43 0 0 1 86 0" fill="hsl(${seed * 47 % 360} 48% 48%)"/><circle cx="60" cy="53" r="29" fill="${skin}"/><path d="M30 51c-4-39 64-47 61 0-13-3-24-14-29-20-7 13-18 18-32 20" fill="${seed % 2 ? '#49372e' : '#252d38'}"/><circle cx="49" cy="54" r="2"/><circle cx="71" cy="54" r="2"/><path d="M51 68q9 8 18 0" fill="none" stroke="#754b3b" stroke-width="3" stroke-linecap="round"/></svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    let dummies = read('fakebookDummyProfiles', null);
    if (!Array.isArray(dummies) || !dummies.length) {
        const used = new Set();
        dummies = Array.from({length: 12}, (_, index) => {
            let name;
            do { name = pick(['김','이','박','최','정','강','윤','한']) + pick(['서연','도윤','지우','민준','하린','시우','수빈','지호','예린','건우','유진','서준']); } while (used.has(name));
            used.add(name);
            return {id: `demo-${index + 1}`, name, bio: pick(['산책과 사진을 좋아해요.','새로운 취미를 찾고 있어요.','음악과 함께하는 일상 🎧','맛있는 음식과 여행 이야기','코딩하며 배우는 중 💻']), birthday: `${1998 + index % 8}-${String(index % 12 + 1).padStart(2, '0')}-${String(index + 3).padStart(2, '0')}`, avatar: avatar(Math.floor(Math.random() * 10000)), dummy: true};
        });
        write('fakebookDummyProfiles', dummies);
    }
    function profile(id, fallback = '사용자') {
        const dummy = dummies.find(item => item.id === id);
        if (dummy) return dummy;
        const saved = read('fakebookProfiles', {})[id] || {};
        const member = read('fakebookUsers', []).find(item => item.id === id);
        return {id, name: saved.name || member?.name || (actor()?.id === id ? actor().name : fallback), bio: saved.bio || '', birthday: saved.birthday || '', avatar: safeImage(saved.avatar) || 'img/FakebookLogo2.png'};
    }
    function safeImage(src) { return typeof src === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(src) ? src : ''; }
    function image(person, className = 'social-avatar') { const node = el('img', undefined, className); node.src = person.avatar; node.alt = `${person.name} 프로필 사진`; return node; }
    function author(id, fallback) {
        const person = profile(id, fallback);
        const link = el('a', undefined, 'author-profile'); link.href = id ? `#profile/${encodeURIComponent(id)}` : '#home';
        link.append(image(person, 'author-avatar'), el('strong', person.name)); return link;
    }
    const stateKey = () => `fakebookFriends:${actor()?.id || ""}`;
    function state() {
        const value = read(stateKey(), null);
        return value || {friends: [], dismissed: [], requests: dummies.slice(0, 2).map(item => item.id)};
    }
    function change(action) {
        if (!actor()?.id) { location.href = 'index.html'; return; }
        const next = state(); action(next);
        if (write(stateKey(), next)) { notice.textContent = ''; render(); }
    }
    function relationship(person, mode) {
        const controls = el('div', undefined, 'friend-controls');
        if (mode === 'requests') {
            controls.append(button('확인', () => change(s => { s.requests = s.requests.filter(id => id !== person.id); if (!s.friends.includes(person.id)) s.friends.push(person.id); }), true), button('삭제', () => change(s => { s.requests = s.requests.filter(id => id !== person.id); s.dismissed.push(person.id); })));
        } else if (mode === 'all') {
            controls.append(button('친구 삭제', () => { if (confirm(`${person.name}님을 친구에서 삭제할까요?`)) change(s => { s.friends = s.friends.filter(id => id !== person.id); }); }));
        } else {
            controls.append(button('친구 추가', () => change(s => { if (!s.friends.includes(person.id)) s.friends.push(person.id); }), true), button('삭제', () => change(s => { s.dismissed.push(person.id); })));
        }
        return controls;
    }
    let mode = 'suggestions', search = '';
    function friends() {
        const heading = el('div', undefined, 'social-heading'); heading.append(el('h1', '친구'));
        const searchField = el('input'); searchField.type = 'search'; searchField.placeholder = '친구 검색'; searchField.value = search; searchField.setAttribute('aria-label', '친구 이름 검색');
        heading.append(searchField); panel.append(heading);
        const tabs = el('div', undefined, 'friend-tabs'); const s = state();
        for (const [key, label] of [['suggestions', '추천'], ['requests', `요청 (${s.requests.length})`], ['all', `모든 친구 (${s.friends.length})`]]) {
            const tab = button(label, () => { mode = key; notice.textContent = ''; render(); }); tab.setAttribute('aria-pressed', String(mode === key)); tabs.append(tab);
        }
        panel.append(tabs, el('p', '과제 시연용 가상 프로필입니다. 친구 추가는 즉시 완료됩니다.', 'social-hint'));
        const title = el('h2'); const list = el('div', undefined, 'friend-list');
        const populate = () => {
            title.textContent = mode === 'suggestions' ? '알 수도 있는 사람' : mode === 'requests' ? '친구 요청' : '모든 친구';
            const people = dummies.filter(p => (mode === 'all' ? s.friends.includes(p.id) : mode === 'requests' ? s.requests.includes(p.id) : !s.friends.includes(p.id) && !s.requests.includes(p.id) && !s.dismissed.includes(p.id)) && p.name.includes(search.trim()));
            list.replaceChildren();
            for (const person of people) {
                const row = el('article', undefined, 'friend-row');
                const photo = el('a'); photo.href = `#profile/${person.id}`; photo.setAttribute('aria-label', `${person.name} 프로필 보기`); photo.append(image(person));
                const detail = el('div', undefined, 'friend-detail'); const name = el('a', person.name, 'friend-name'); name.href = photo.href;
                detail.append(name, relationship(person, mode)); row.append(photo, detail); list.append(row);
            }
            if (!people.length) list.append(el('p', search ? '검색 결과가 없습니다.' : mode === 'all' ? '아직 친구가 없습니다. 추천에서 친구를 추가해보세요.' : mode === 'requests' ? '새로운 친구 요청이 없습니다.' : '새로운 추천이 없습니다.'));
        };
        searchField.addEventListener('input', () => { search = searchField.value; populate(); });
        panel.append(title, list);
        if (mode === 'suggestions' && s.dismissed.length) panel.append(button('삭제한 추천 다시 보기', () => change(next => { next.dismissed = []; })));
        populate();
    }
    function showProfile(id) {
        const person = profile(id); const own = id === actor().id;
        if (!own && !dummies.some(p => p.id === id) && !read('fakebookUsers', []).some(p => p.id === id)) { panel.append(el('p', '프로필을 찾을 수 없습니다.')); return; }
        const back = el('a', '← 친구 목록', 'profile-back'); back.href = '#friends'; panel.append(back);
        const card = el('div', undefined, 'profile-detail');
        card.append(image(person, 'profile-large-avatar'), el('h1', person.name), el('p', person.bio || '아직 소개가 없습니다.', 'profile-bio'), el('p', person.birthday ? `생년월일: ${person.birthday}` : '생년월일 미설정'));
        if (own) { const link = el('a', '프로필 설정', 'social-button primary'); link.href = '#settings'; card.append(link); }
        else if (person.dummy) { const s = state(); card.append(relationship(person, s.friends.includes(id) ? 'all' : s.requests.includes(id) ? 'requests' : 'suggestions')); }
        panel.append(card);
    }
    function settings() {
        const accountId = actor().id, person = profile(accountId); let photo = person.avatar; let busy = false, version = 0;
        panel.append(el('h1', '프로필 설정'));
        const form = el('form', undefined, 'profile-form'); const preview = image(person, 'profile-large-avatar');
        const file = el('input'); file.type = 'file'; file.accept = 'image/jpeg,image/png,image/webp'; file.id = 'profilePhoto';
        const photoLabel = el('label', '프로필 사진'); photoLabel.htmlFor = file.id;
        const photoHint = el('p', 'JPG·PNG·WebP, 최대 5MB. 사진은 작은 크기로 저장됩니다.', 'social-hint');
        const remove = button('기본 사진으로 변경', () => { version++; busy = false; photo = 'img/FakebookLogo2.png'; preview.src = photo; file.value = ''; notice.textContent = ''; });
        const name = el('input'); name.id = 'profileName'; name.value = person.name; name.required = true; name.minLength = 2; name.maxLength = 30;
        const bio = el('textarea'); bio.id = 'profileBio'; bio.value = person.bio; bio.maxLength = 200; bio.rows = 3;
        const birthday = el('input'); birthday.id = 'profileBirthday'; birthday.type = 'date'; birthday.value = person.birthday;
        const today = new Date(); const maxDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`; birthday.max = maxDate; birthday.min = '1900-01-01';
        const labelled = (text, field) => { const label = el('label', text); label.htmlFor = field.id; form.append(label, field); };
        form.append(preview, photoLabel, file, photoHint, remove); labelled('표시 이름 (2~30자)', name); labelled('소개 (최대 200자)', bio); labelled('생년월일 (선택)', birthday);
        form.append(el('p', '표시 이름은 게시물·댓글에 반영됩니다. 로그인 및 비밀번호 찾기용 가입 이름은 유지됩니다.', 'social-hint'));
        const controls = el('div', undefined, 'profile-form-actions'); const submit = el('button', '저장', 'social-button primary'); submit.type = 'submit'; const cancel = el('a', '취소', 'social-button'); cancel.href = '#profile'; controls.append(submit, cancel); form.append(controls);
        file.addEventListener('change', async () => {
            const token = ++version; busy = false; const selected = file.files[0];
            if (!selected) return;
            if (!['image/jpeg','image/png','image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { notice.textContent = 'JPG·PNG·WebP 사진을 5MB 이하로 선택해주세요.'; file.value = ''; return; }
            busy = true; notice.textContent = '사진을 준비하고 있습니다.';
            try {
                const data = await resizePhoto(selected);
                if (token !== version) return;
                photo = data; preview.src = data; notice.textContent = '';
            } catch { if (token === version) notice.textContent = '사진을 읽지 못했습니다. 다른 파일을 선택해주세요.'; }
            finally { if (token === version) busy = false; }
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (actor()?.id !== accountId) { location.href = 'index.html'; return; }
            if (busy) { notice.textContent = '사진 처리가 끝난 뒤 저장해주세요.'; return; }
            const displayName = name.value.trim(), intro = bio.value.trim(), birth = birthday.value;
            if (displayName.length < 2 || displayName.length > 30 || intro.length > 200 || (birth && (birth < '1900-01-01' || birth > maxDate || !/^\d{4}-\d{2}-\d{2}$/.test(birth)))) { notice.textContent = '이름·소개 길이와 생년월일을 확인해주세요.'; return; }
            const profiles = read('fakebookProfiles', {}); profiles[accountId] = {name: displayName, bio: intro, birthday: birth, avatar: safeImage(photo)};
            if (write('fakebookProfiles', profiles)) { notice.textContent = '프로필이 저장되었습니다.'; window.dispatchEvent(new Event('fakebook:profile')); location.hash = '#profile'; }
        });
        panel.append(form);
    }
    function resizePhoto(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file), img = new Image();
            img.onload = () => {
                try {
                    const scale = Math.min(1, 512 / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
                    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', .85));
                } catch (error) { reject(error); } finally { URL.revokeObjectURL(url); }
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')); }; img.src = url;
        });
    }
    const isFeed = () => !/^#(friends|profile(?:\/|$)|settings$)/.test(location.hash);
    function render() {
        if (!actor()?.id) { location.href = 'index.html'; return; }
        const mine = profile(actor().id); const avatarNode = document.getElementById('sidebarAvatar'); avatarNode.src = mine.avatar;
        document.getElementById('welcomeName').textContent = `${mine.name}님`;
        document.getElementById('sidebarBio').textContent = mine.bio || 'FAKEBOOK에 오신 것을 환영합니다.';
        const feed = isFeed(); document.querySelector('.app-feed').hidden = !feed; panel.hidden = feed;
        for (const [id, active] of [['homeLink', feed && location.hash !== '#saved'], ['savedLink', location.hash === '#saved'], ['friendsLink', !feed && location.hash.startsWith('#friends')]]) {
            const link = document.getElementById(id); active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
        }
        if (feed) return;
        panel.replaceChildren();
        if (location.hash === '#settings') settings();
        else if (location.hash.startsWith('#profile')) {
            let id; try { id = location.hash.startsWith('#profile/') ? decodeURIComponent(location.hash.slice(9)) : actor().id; } catch { id = ''; }
            showProfile(id);
        } else friends();
        panel.append(notice);
    }
    window.FakebookSocial = {profile, author, isFeed};
    window.addEventListener('hashchange', render);
    window.addEventListener('fakebook:profile', render);
    window.addEventListener('storage', event => { if (!event.key || ['fakebookProfiles', 'fakebookCurrentUser', stateKey()].includes(event.key)) render(); });
    render();
})();
