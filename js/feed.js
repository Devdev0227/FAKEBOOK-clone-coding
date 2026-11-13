// 게시물 메타데이터는 localStorage, 첨부 파일은 IndexedDB에 저장합니다.
(() => {
    'use strict';
    const homeRoot = document.querySelector('#localPosts');
    if (!homeRoot) return;
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const current = () => { const actor = read('fakebookCurrentUser', null); return actor && window.FakebookSocial ? {...actor, name: window.FakebookSocial.profile(actor.id, actor.name).name} : actor; };
    if (!current()?.id) { location.href = 'index.html'; return; }
    const message = text => { document.querySelector('#feedMessage').textContent = text; window.FakebookSocial?.notify?.(text); };
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
    function iconButton(kind, count, pressed, action) {
        const label = kind === 'heart' ? `좋아요 ${count}개${pressed ? ', 취소' : ''}` : (pressed ? '저장 취소' : '게시물 저장');
        const element = button('', action, pressed);
        element.className = `icon-button ${kind}-button`;
        element.setAttribute('aria-label', label); element.title = label;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', kind === 'heart'
            ? 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'
            : 'M6 3h12v18l-6-4-6 4V3Z');
        svg.append(path); element.append(svg);
        if (kind === 'heart') element.append(textElement('span', String(count)));
        return element;
    }
    function commentForm(label, onSubmit) {
        const form = document.createElement('form'); form.className = 'feed-comments';
        const field = document.createElement('input'); field.placeholder = `${label}을 입력하세요.`;
        field.setAttribute('aria-label', `${label} 내용`); field.required = true; field.maxLength = 2000;
        const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = `${label} 게시`;
        form.append(field, submit);
        form.addEventListener('submit', event => {
            event.preventDefault(); const text = field.value.trim();
            if (text && text.length <= 2000) onSubmit(text);
        });
        return form;
    }
    const newComment = (actor, text) => ({id: uid(), authorId: actor.id, author: actor.name, text, likedBy: [], createdAt: new Date().toISOString()});
    function commentRow(postId, comment, user, parentId = null) {
        const row = document.createElement('div'); row.className = parentId === null ? 'comment-item' : 'comment-item reply-item';
        const body = textElement('p', comment.text);
        const header = document.createElement('div'); header.className = 'comment-header';
        const author = document.createElement('div'); author.className = 'comment-author';
        const actions = document.createElement('div'); actions.className = 'comment-actions';
        author.append(window.FakebookSocial ? window.FakebookSocial.author(comment.authorId, comment.author) : textElement('strong', comment.author));
        if (comment.updatedAt) author.append(textElement('small', '수정됨'));
        header.append(author, actions);
        row.append(header, body);
        const find = post => parentId === null ? post.comments : (post.comments.find(item => item.id === parentId)?.replies || []);
        const liked = comment.likedBy || [];
        actions.append(iconButton('heart', liked.length, liked.includes(user.id), () => change(postId, (post, actor) => {
            const target = find(post).find(item => item.id === comment.id);
            if (target) target.likedBy = toggle(target.likedBy || [], actor.id);
        })));
        if (comment.authorId === user.id) actions.append(button(parentId === null ? '댓글 삭제' : '답글 삭제', () => change(postId, (post, actor) => {
            const list = find(post); const index = list.findIndex(item => item.id === comment.id && item.authorId === actor.id);
            if (index < 0 || !confirm(parentId === null ? '이 댓글과 달린 답글을 모두 삭제할까요?' : '이 답글을 삭제할까요?')) return false;
            list.splice(index, 1);
        })));
        if (comment.authorId === user.id) {
            const label = parentId === null ? '댓글' : '답글';
            const editor = document.createElement('form');
            editor.className = 'feed-comments comment-editor';
            editor.hidden = true;
            const field = document.createElement('input');
            field.setAttribute('aria-label', `${label} 수정 내용`);
            field.required = true;
            field.maxLength = 2000;
            const submit = document.createElement('button');
            submit.type = 'submit';
            submit.textContent = '수정 저장';
            const editButton = button(`${label} 수정`, () => {
                field.value = comment.text;
                editor.hidden = false;
                body.hidden = true;
                editButton.hidden = true;
                field.focus();
            });
            const cancel = button('수정 취소', () => {
                editor.hidden = true;
                body.hidden = false;
                editButton.hidden = false;
                editButton.focus();
            });
            const controls = document.createElement('div'); controls.className = 'comment-edit-actions';
            controls.append(submit, cancel);
            editor.append(field, controls);
            editor.addEventListener('submit', event => {
                event.preventDefault();
                const text = field.value.trim();
                if (!text || text.length > 2000) {
                    message('수정 내용은 공백을 제외하고 1~2,000자로 입력해주세요.');
                    return;
                }
                change(postId, (post, actor) => {
                    const target = find(post).find(item => item.id === comment.id);
                    if (!target || target.authorId !== actor.id) {
                        message('본인이 작성한 댓글과 답글만 수정할 수 있습니다.');
                        return false;
                    }
                    if (target.text !== text) {
                        target.text = text;
                        target.updatedAt = new Date().toISOString();
                    }
                });
            });
            actions.append(editButton);
            row.append(editor);
        }
        if (parentId === null) {
            const replies = document.createElement('div'); replies.className = 'reply-list';
            const form = commentForm('답글', text => change(postId, (post, actor) => {
                const target = post.comments.find(item => item.id === comment.id);
                if (!target) return false;
                if (!Array.isArray(target.replies)) target.replies = [];
                target.replies.push(newComment(actor, text));
            }));
            form.hidden = true;
            const replyButton = button(`답글 달기 (${(comment.replies || []).length})`, () => {
                form.hidden = !form.hidden; replyButton.setAttribute('aria-expanded', String(!form.hidden));
                if (!form.hidden) form.querySelector('input').focus();
            });
            replyButton.setAttribute('aria-expanded', 'false');
            const replyActions = document.createElement('div'); replyActions.className = 'comment-reply-actions';
            replyActions.append(replyButton); row.append(replyActions);
            for (const reply of comment.replies || []) replies.append(commentRow(postId, reply, user, comment.id));
            row.append(replies, form);
        }
        return row;
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
        feedUrls.forEach(URL.revokeObjectURL); feedUrls = [];
        const user = current(); if (!user?.id) { location.href = 'index.html'; return; }
        const profileId = window.FakebookSocial?.profileId?.() || null;
        const root = profileId ? document.getElementById('profilePosts') : homeRoot;
        if (!root || (window.FakebookSocial && !window.FakebookSocial.isFeed() && !profileId)) return;
        root.replaceChildren();
        const saved = location.hash === '#saved';
        if (!profileId) {
            document.querySelector('#feedTitle').textContent = saved ? '저장한 게시물' : '홈';
            for (const [id, active] of [['homeLink', !saved], ['savedLink', saved]]) {
                const link = document.getElementById(id); active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
            }
            document.querySelector('.feed-composer').hidden = saved;
        }
        const posts = getPosts().filter(post => profileId ? post.authorId === profileId : saved ? post.savedBy.includes(user.id) : !post.demo)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (!posts.length) root.append(textElement('p', profileId ? '아직 작성한 게시물이 없습니다.' : saved ? '저장한 게시물이 없습니다.' : '첫 게시물을 작성해보세요.'));
        for (const post of posts) {
            const article = document.createElement('article'); article.className = 'feed-post';
            const header = document.createElement('div'); header.className = 'feed-post-header';
            header.append(window.FakebookSocial ? window.FakebookSocial.author(post.authorId, post.author) : textElement('strong', post.author), textElement('span', new Date(post.createdAt).toLocaleString('ko-KR') + (post.updatedAt ? ' · 수정됨' : '')));
            const manageButtons = document.createElement('div'); manageButtons.className = 'post-manage-buttons';
            if (post.authorId === user.id) header.append(manageButtons);
            if (post.authorId === user.id) manageButtons.append(button('게시물 삭제', () => change(post.id, (target, actor, all) => {
                if (target.authorId !== actor.id || !confirm('이 게시물과 댓글을 삭제할까요?')) return false;
                all.splice(all.indexOf(target), 1);
                // 메타데이터 저장 성공 후에만 파일을 정리합니다.
                if (!save(all)) return false;
                filesTransaction('readwrite', store => target.media.forEach(media => store.delete(media.id))).catch(() => message('게시물은 삭제되었지만 첨부 파일 정리에 실패했습니다.'));
                render(); return false;
            })));
            const body = textElement('p', post.text || '');
            article.append(header, body);
            if (post.authorId === user.id) {
                const editForm = document.createElement('form'); editForm.className = 'post-edit-form'; editForm.hidden = true;
                const field = document.createElement('textarea'); field.value = post.text || '';
                field.setAttribute('aria-label', '게시물 내용 수정');
                const error = textElement('p', ''); error.setAttribute('role', 'status');
                const saveButton = document.createElement('button'); saveButton.type = 'submit'; saveButton.textContent = '수정 저장';
                const editButton = button('게시물 수정', () => {
                    field.value = post.text || ''; error.textContent = '';
                    editForm.hidden = false; body.hidden = true; editButton.hidden = true; field.focus();
                });
                const cancel = button('수정 취소', () => {
                    editForm.hidden = true; body.hidden = false; editButton.hidden = false; editButton.focus();
                });
                const controls = document.createElement('div'); controls.className = 'post-edit-actions'; controls.append(saveButton, cancel);
                editForm.append(field, error, controls); manageButtons.append(editButton); article.append(editForm);
                editForm.addEventListener('submit', event => {
                    event.preventDefault();
                    const actor = current();
                    const posts = getPosts(); const target = posts.find(item => item.id === post.id);
                    if (!target || actor?.id !== target.authorId) { error.textContent = '작성자만 수정할 수 있습니다.'; return; }
                    const text = field.value.trim();
                    if (!text && !target.media.length) { error.textContent = '내용 또는 첨부 파일이 있어야 합니다.'; field.focus(); return; }
                    if (text === (target.text || '')) { editForm.hidden = true; body.hidden = false; editButton.hidden = false; return; }
                    target.text = text; target.updatedAt = new Date().toISOString();
                    if (save(posts)) { message('게시물이 수정되었습니다.'); render(); }
                    else error.textContent = '저장하지 못했습니다. 내용을 유지했으니 다시 시도해주세요.';
                });
            }
            const gallery = document.createElement('div'); gallery.className = 'media-grid'; article.append(gallery);
            const actions = document.createElement('div'); actions.className = 'post-actions';
            actions.append(iconButton('heart', post.legacyLikes + post.likedBy.length, post.likedBy.includes(user.id), () => change(post.id, (target, actor) => { target.likedBy = toggle(target.likedBy, actor.id); })),
                iconButton('bookmark', 0, post.savedBy.includes(user.id), () => change(post.id, (target, actor) => { target.savedBy = toggle(target.savedBy, actor.id); })));
            const commentCount = post.comments.reduce((sum, comment) => sum + 1 + (comment.replies || []).length, 0);
            article.append(actions, textElement('h3', `댓글 ${commentCount}`));
            for (const comment of post.comments) article.append(commentRow(post.id, comment, user));
            const form = commentForm('댓글', text => change(post.id, (target, actor) => target.comments.push(newComment(actor, text))));
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
    window.addEventListener('fakebook:profile', render);
    window.addEventListener('fakebook:activity', render);
    window.addEventListener('fakebook:social-render', render);
    window.addEventListener('storage', event => { if (['fakebookPosts', 'fakebookCurrentUser', 'fakebookProfiles'].includes(event.key) || event.key === null) render(); });
    window.addEventListener('pagehide', () => { previewUrls.forEach(URL.revokeObjectURL); feedUrls.forEach(URL.revokeObjectURL); });
    render();
})();



