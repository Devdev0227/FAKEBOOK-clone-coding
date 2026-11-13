// DOM 모형을 사용하는 로컬 회귀 검사: node tests/feed.cjs
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict'), path = require('node:path');
class Element {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.attrs = {}; this.events = {}; this.value = ''; }
    append(...nodes) { for (const node of nodes) { node.remove(); node.parentNode = this; this.children.push(node); } }
    replaceChildren() { for (const node of this.children) node.parentNode = null; this.children = []; }
    remove() { if (this.parentNode) { const list = this.parentNode.children; list.splice(list.indexOf(this), 1); this.parentNode = null; } }
    insertBefore(node, before) { node.remove(); const index = before ? this.children.indexOf(before) : this.children.length; if(index < 0) throw Error('invalid reference'); this.children.splice(index, 0, node); node.parentNode = this; }
    setAttribute(k, v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k, f) { this.events[k] = f; }
    querySelector(tag) { return this.children.find(child => child.tagName === tag); }
    focus() {}
    click() { return this.events.click?.({currentTarget: this}); }
}
const nodes = Object.fromEntries(['localPosts', 'postText', 'postButton', 'postMedia', 'mediaPreview', 'feedMessage', 'feedTitle', 'homeLink', 'savedLink'].map(id => [id, new Element()]));
const store = new Map(), handlers = {}, composer = new Element();
const login = id => store.set('fakebookCurrentUser', JSON.stringify({id, name: id})); login('alice');
const context = {document: {querySelector: s => s === '.feed-composer' ? composer : nodes[s.slice(1)], getElementById: id => nodes[id], createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag)}, localStorage: {getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v)}, window: {addEventListener: (k,f) => handlers[k] = f}, location: {hash: ''}, URL: {revokeObjectURL() {}}, confirm: () => true, console};
const source = fs.readFileSync(path.join(__dirname, '../js/feed.js'), 'utf8');
const load = () => vm.runInNewContext(source, context);
const walk = node => [node, ...node.children.flatMap(walk)];
const find = predicate => { const node = walk(nodes.localPosts).find(predicate); assert(node, 'element exists'); return node; };
const click = text => find(n => n.tagName === 'button' && n.textContent === text).click();
const icon = (kind, index = 0) => walk(nodes.localPosts).filter(n => n.className === `icon-button ${kind}-button`)[index];
const posts = () => JSON.parse(store.get('fakebookPosts'));
const submit = (form, text) => { form.children[0].value = text; form.events.submit({preventDefault() {}}); };
(async () => {
    load(); nodes.postText.value = 'post'; await nodes.postButton.click();
    icon('heart').click(); assert.equal(posts()[0].likedBy.length, 1); assert.equal(icon('heart').attrs['aria-pressed'], 'true');
    icon('heart').click(); assert.equal(posts()[0].likedBy.length, 0);
    icon('bookmark').click(); assert.deepEqual(posts()[0].savedBy, ['alice']);
    submit(find(n => n.tagName === 'form' && n.className === 'feed-comments'), 'old comment');
    load(); // 기존 댓글 데이터로 다시 시작
    click('답글 달기 (0)');
    const row = find(n => n.className === 'comment-item');
    submit(row.children.find(n => n.className === 'feed-comments'), '<script>reply</script>');
    assert.equal(posts()[0].comments[0].replies.length, 1);
    icon('heart', 2).click(); assert.equal(posts()[0].comments[0].replies[0].likedBy.length, 1);
    icon('heart', 2).click(); assert.equal(posts()[0].comments[0].replies[0].likedBy.length, 0);
    load(); assert.equal(find(n => n.className === 'comment-item reply-item').children[1].textContent, '<script>reply</script>');
    // 댓글·답글 수정은 상호작용을 보존하고 최신 계정 권한을 검사합니다.
    click('댓글 수정');
    let commentEditor = find(n => n.className === 'comment-item').children.find(n => n.className === 'feed-comments comment-editor');
    assert.equal(commentEditor.children[0].value, 'old comment');
    const commentRow = find(n => n.className === 'comment-item');
    assert.equal(commentRow.children[0].className, 'comment-header');
    assert.equal(commentRow.children[0].children[1].className, 'comment-actions');
    assert.equal(commentEditor.children[1].className, 'comment-edit-actions');
    assert.equal(commentEditor.children[1].children.length, 2);
    assert.equal(commentEditor.hidden, false);
    assert(commentRow.children.some(n => n.className === 'comment-reply-actions'));

    submit(commentEditor, '   '); assert.equal(posts()[0].comments[0].text, 'old comment');
    submit(commentEditor, 'x'.repeat(2001)); assert.equal(posts()[0].comments[0].text, 'old comment');
    walk(commentEditor).find(n => n.textContent === '수정 취소').click();
    assert.equal(posts()[0].comments[0].text, 'old comment');
    const repliesBefore = posts()[0].comments[0].replies;
    click('댓글 수정'); submit(commentEditor, 'edited comment');
    assert.equal(posts()[0].comments[0].text, 'edited comment'); assert(posts()[0].comments[0].updatedAt);
    assert.deepEqual(posts()[0].comments[0].replies, repliesBefore);
    icon('heart', 2).click();
    click('답글 수정');
    let replyEditor = find(n => n.className === 'comment-item reply-item').children.find(n => n.className === 'feed-comments comment-editor');
    assert.equal(replyEditor.children[0].value, '<script>reply</script>');
    submit(replyEditor, '<b>edited reply</b>');
    assert.deepEqual(posts()[0].comments[0].replies[0].likedBy, ['alice']);
    load(); assert(walk(nodes.localPosts).some(n => n.textContent === '<b>edited reply</b>'));
    login('bob'); submit(replyEditor, 'unauthorized'); assert.equal(posts()[0].comments[0].replies[0].text, '<b>edited reply</b>');
    handlers.storage({key: 'fakebookCurrentUser'});
    assert(!walk(nodes.localPosts).some(n => ['댓글 수정', '답글 수정'].includes(n.textContent)));
    login('alice'); handlers.storage({key: 'fakebookCurrentUser'});
    const original = posts()[0];
    click('게시물 수정');
    let editor = find(n => n.className === 'post-edit-form');
    assert.equal(editor.children[0].value, 'post');
    submit(editor, ''); assert.equal(posts()[0].text, 'post');
    submit(editor, 'discard'); // save first edit
    click('게시물 수정'); editor = find(n => n.className === 'post-edit-form'); editor.children[0].value = 'cancelled';
    walk(editor).find(n => n.textContent === '수정 취소').click(); assert.equal(posts()[0].text, 'discard');
    click('게시물 수정'); editor = find(n => n.className === 'post-edit-form');
    const staleEditor = editor;
    submit(editor, '<b>updated</b>');
    assert.equal(posts()[0].text, '<b>updated</b>'); assert(posts()[0].updatedAt);
    assert.deepEqual(posts()[0].comments, original.comments); assert.deepEqual(posts()[0].savedBy, original.savedBy);
    assert.deepEqual(posts()[0].likedBy, original.likedBy); assert.deepEqual(posts()[0].media, original.media);
    load(); assert(walk(nodes.localPosts).some(n => n.textContent === '<b>updated</b>'));
    login('bob'); submit(staleEditor, 'unauthorized'); assert.equal(posts()[0].text, '<b>updated</b>');
    handlers.storage({key: 'fakebookCurrentUser'});
    assert(!walk(nodes.localPosts).some(n => ['답글 삭제', '게시물 수정'].includes(n.textContent)));
    context.location.hash = '#saved'; handlers.hashchange(); assert.equal(nodes.localPosts.children[0].textContent, '저장한 게시물이 없습니다.');
    login('alice'); context.location.hash = ''; handlers.hashchange();
    click('답글 삭제'); assert.equal(posts()[0].comments[0].replies.length, 0);
    click('답글 달기 (0)'); submit(find(n => n.className === 'comment-item').children.find(n => n.className === 'feed-comments'), 'second reply');
    context.confirm = () => false; click('댓글 삭제'); assert.equal(posts()[0].comments.length, 1);
    context.confirm = () => true; click('댓글 삭제'); assert.equal(posts()[0].comments.length, 0);
    console.log('PASS: comment/reply edit validation, cancel, persistence, ownership and interaction preservation; post edit/save/cancel/empty validation/persistence/ownership, preservation of interactions, icon toggles, replies on existing comments, reply likes/delete, reload, ownership, bookmark isolation, parent deletion/cancel');
})().catch(error => { console.error(error); process.exitCode = 1; });

