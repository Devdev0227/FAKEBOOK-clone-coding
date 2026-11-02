// 게시물 메타데이터는 localStorage, 첨부 파일은 IndexedDB에 저장합니다.
(() => {
    'use strict';
    const root = document.querySelector('#localPosts');
    if (!root) return;
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const current = () => read('fakebookCurrentUser', null);
    if (!current()?.id) { location.href = 'index.html'; return; }
    const message = text => { document.querySelector('#feedMessage').textContent = text; };
    const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const users = read('fakebookUsers', []);
    const owner = item => {
        if (item.authorId) return item.authorId;
        const matches = users.filter(user => user.name === item.author);
        return matches.length === 1 ? matches[0].id : null;
    };
    const getPosts = () => {
        const raw = read('fakebookPosts', []);
        return (Array.isArray(raw) ? raw : []).map(post => ({
            ...post, authorId: owner(post),
            likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
            legacyLikes: post.legacyLikes ?? (Array.isArray(post.likedBy) ? 0 : Number(post.likes) || 0),
            savedBy: Array.isArray(post.savedBy) ? post.savedBy : [],
            media: Array.isArray(post.media) ? post.media : [],
            comments: Array.isArray(post.comments) ? post.comments : []
        }));
    };
    const save = posts => {
        try { localStorage.setItem('fakebookPosts', JSON.stringify(posts)); return true; }
        catch { message('저장 공간이 부족하거나 저장소를 사용할 수 없습니다. 변경사항을 저장하지 못했습니다.'); return false; }
    };
    const toggle = (list, id) => list.includes(id) ? list.filter(value => value !== id) : [...list, id];
    let dbPromise;
    function database() {
        if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('fakebookMedia', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('files');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        }).catch(error => { dbPromise = null; throw error; });
        return dbPromise;
    }
    async function filesTransaction(mode, action) {
        const db = await database();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('files', mode);
            action(transaction.objectStore('files'));
            transaction.oncomplete = resolve;
            transaction.onerror = transaction.onabort = () => reject(transaction.error);
        });
    }
    async function getFile(id) {
        const db = await database();
        return new Promise((resolve, reject) => {
            const request = db.transaction('files').objectStore('files').get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    const allowed = new Set(['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/ogg']);
    let selected = [], previewUrls = [], feedUrls = [], renderVersion = 0;
    const input = document.querySelector('#postMedia');
    function clearPreview() {
        previewUrls.forEach(URL.revokeObjectURL); previewUrls = [];
        document.querySelector('#mediaPreview').replaceChildren();
    }
    function mediaElement(file, url) {
        const element = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
        element.src = url;
        if (element.tagName === 'VIDEO') { element.controls = true; element.preload = 'metadata'; }
        else { element.alt = file.name || '첨부 사진'; element.loading = 'lazy'; }
        return element;
    }
    function preview() {
        clearPreview();
        selected.forEach((file, index) => {
            const box = document.createElement('div');
            const url = URL.createObjectURL(file); previewUrls.push(url);
            box.append(mediaElement(file, url), button(`${file.name} 첨부 취소`, () => {
                selected.splice(index, 1); input.value = ''; preview();
            }));
            document.querySelector('#mediaPreview').append(box);
        });
    }
    input.addEventListener('change', () => {
        const files = [...input.files];
        if (files.length > 4 || files.some(file => !allowed.has(file.type) || file.size > 20 * 1024 * 1024)) {
            message('지원하는 사진·영상 파일을 최대 4개, 각 20MB 이하로 선택해주세요.'); input.value = ''; return;
        }
        selected = files; message(''); preview();
    });
    function button(text, action, pressed) {
        const element = document.createElement('button'); element.type = 'button'; element.textContent = text;
        if (pressed !== undefined) element.setAttribute('aria-pressed', String(pressed));
        element.addEventListener('click', action); return element;
    }
    function change(postId, action) {
        const user = current();
        if (!user?.id) { location.href = 'index.html'; return; }
        const posts = getPosts(); const post = posts.find(item => item.id === postId);
        if (!post || action(post, user, posts) === false) return;
        if (save(posts)) render();
    }
    function textElement(tag, text) { const element = document.createElement(tag); element.textContent = text; return element; }
    async function render() {
        const version = ++renderVersion;
        feedUrls.forEach(URL.revokeObjectURL); feedUrls = []; root.replaceChildren();
        const user = current(); if (!user?.id) { location.href = 'index.html'; return; }
        const saved = location.hash === '#saved';
        document.querySelector('#feedTitle').textContent = saved ? '저장한 게시물' : '홈';
        for (const [id, active] of [['homeLink', !saved], ['savedLink', saved]]) {
            const link = document.getElementById(id); active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
        }
        document.querySelector('.feed-composer').hidden = saved;
        const posts = getPosts().filter(post => !saved || post.savedBy.includes(user.id)).reverse();
        if (!posts.length) root.append(textElement('p', saved ? '저장한 게시물이 없습니다.' : '첫 게시물을 작성해보세요.'));
        for (const post of posts) {
            const article = document.createElement('article'); article.className = 'feed-post';
            const header = document.createElement('div'); header.className = 'feed-post-header';
            header.append(textElement('strong', post.author), textElement('span', new Date(post.createdAt).toLocaleString('ko-KR')));
            if (post.authorId === user.id) header.append(button('게시물 삭제', () => change(post.id, (target, actor, all) => {
                if (target.authorId !== actor.id || !confirm('이 게시물과 댓글을 삭제할까요?')) return false;
                all.splice(all.indexOf(target), 1);
                // 메타데이터 저장 성공 후에만 파일을 정리합니다.
                if (!save(all)) return false;
                filesTransaction('readwrite', store => target.media.forEach(media => store.delete(media.id))).catch(() => message('게시물은 삭제되었지만 첨부 파일 정리에 실패했습니다.'));
                render(); return false;
            })));
            article.append(header, textElement('p', post.text || ''));
            const gallery = document.createElement('div'); gallery.className = 'media-grid'; article.append(gallery);
            const actions = document.createElement('div'); actions.className = 'post-actions';
            actions.append(button(`좋아요 ${post.legacyLikes + post.likedBy.length}`, () => change(post.id, (target, actor) => { target.likedBy = toggle(target.likedBy, actor.id); }), post.likedBy.includes(user.id)),
                button(post.savedBy.includes(user.id) ? '저장 취소' : '저장', () => change(post.id, (target, actor) => { target.savedBy = toggle(target.savedBy, actor.id); }), post.savedBy.includes(user.id)));
            article.append(actions, textElement('h3', `댓글 ${post.comments.length}`));
            for (const comment of post.comments) {
                const row = document.createElement('div'); row.className = 'comment-item';
                row.append(textElement('strong', comment.author), textElement('p', comment.text));
                const liked = comment.likedBy || [];
                row.append(button(`좋아요 ${liked.length}`, () => change(post.id, (target, actor) => {
                    const found = target.comments.find(item => item.id === comment.id);
                    if (found) found.likedBy = toggle(found.likedBy || [], actor.id);
                }), liked.includes(user.id)));
                if (comment.authorId === user.id) row.append(button('댓글 삭제', () => change(post.id, (target, actor) => {
                    if (!confirm('이 댓글을 삭제할까요?')) return false;
                    target.comments = target.comments.filter(item => item.id !== comment.id || item.authorId !== actor.id);
                })));
                article.append(row);
            }
            const form = document.createElement('form'); form.className = 'feed-comments';
            const field = document.createElement('input'); field.placeholder = '댓글을 입력하세요.'; field.setAttribute('aria-label', '댓글 내용'); field.required = true; field.maxLength = 2000;
            const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = '댓글 게시'; form.append(field, submit);
            form.addEventListener('submit', event => { event.preventDefault(); const text = field.value.trim(); if (!text) return;
                change(post.id, (target, actor) => target.comments.push({ id: uid(), authorId: actor.id, author: actor.name, text, likedBy: [], createdAt: new Date().toISOString() }));
            });
            article.append(form); root.append(article);
            for (const media of post.media) {
                try {
                    const file = await getFile(media.id);
                    if (version !== renderVersion) return;
                    if (!file || !allowed.has(file.type)) { gallery.append(textElement('p', '첨부 파일을 찾을 수 없습니다.')); continue; }
                    const url = URL.createObjectURL(file); feedUrls.push(url); gallery.append(mediaElement(file, url));
                } catch { if (version === renderVersion) gallery.append(textElement('p', '첨부 파일을 불러오지 못했습니다.')); }
            }
        }
    }
    document.querySelector('#postButton').addEventListener('click', async event => {
        const actor = current(); if (!actor?.id) { location.href = 'index.html'; return; }
        const field = document.querySelector('#postText'); const text = field.value.trim();
        if (!text && !selected.length) { message('내용 또는 사진·영상을 추가해주세요.'); return; }
        const submit = event.currentTarget; submit.disabled = true; input.disabled = true;
        const attachments = selected.map(file => ({ id: uid(), file }));
        try {
            if (attachments.length) await filesTransaction('readwrite', store => attachments.forEach(item => store.put(item.file, item.id)));
            if (current()?.id !== actor.id) throw new Error('계정이 변경되었습니다. 다시 로그인해주세요.');
            const posts = getPosts();
            posts.push({ id: uid(), authorId: actor.id, author: actor.name, text, likedBy: [], legacyLikes: 0, savedBy: [], comments: [], media: attachments.map(item => ({id:item.id})), createdAt: new Date().toISOString() });
            if (!save(posts)) throw new Error('게시물을 저장하지 못했습니다. 저장 공간을 확인해주세요.');
            field.value = ''; input.value = ''; selected = []; clearPreview(); message('게시물이 등록되었습니다.'); render();
        } catch (error) {
            if (attachments.length) await filesTransaction('readwrite', store => attachments.forEach(item => store.delete(item.id))).catch(() => {});
            message(error.message || '첨부 파일 저장에 실패했습니다.');
        } finally { submit.disabled = false; input.disabled = false; }
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('storage', event => { if (['fakebookPosts', 'fakebookCurrentUser'].includes(event.key) || event.key === null) render(); });
    window.addEventListener('pagehide', () => { previewUrls.forEach(URL.revokeObjectURL); feedUrls.forEach(URL.revokeObjectURL); });
    render();
})();
