// DOM 모형을 사용하는 로컬 회귀 검사: node tests/feed.cjs
const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict'), path = require('node:path');
class Element {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.attrs = {}; this.events = {}; this.value = ''; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren() { this.children = []; }
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
    submit(find(n => n.tagName === 'form'), 'old comment');
    load(); // 기존 댓글 데이터로 다시 시작
    click('답글 달기 (0)');
    const row = find(n => n.className === 'comment-item');
    submit(row.children.find(n => n.tagName === 'form'), '<script>reply</script>');
    assert.equal(posts()[0].comments[0].replies.length, 1);
    icon('heart', 2).click(); assert.equal(posts()[0].comments[0].replies[0].likedBy.length, 1);
    icon('heart', 2).click(); assert.equal(posts()[0].comments[0].replies[0].likedBy.length, 0);
    load(); assert.equal(find(n => n.className === 'comment-item reply-item').children[1].textContent, '<script>reply</script>');
    login('bob'); handlers.storage({key: 'fakebookCurrentUser'});
    assert(!walk(nodes.localPosts).some(n => n.textContent === '답글 삭제'));
    context.location.hash = '#saved'; handlers.hashchange(); assert.equal(nodes.localPosts.children[0].textContent, '저장한 게시물이 없습니다.');
    login('alice'); context.location.hash = ''; handlers.hashchange();
    click('답글 삭제'); assert.equal(posts()[0].comments[0].replies.length, 0);
    click('답글 달기 (0)'); submit(find(n => n.className === 'comment-item').children.find(n => n.tagName === 'form'), 'second reply');
    context.confirm = () => false; click('댓글 삭제'); assert.equal(posts()[0].comments.length, 1);
    context.confirm = () => true; click('댓글 삭제'); assert.equal(posts()[0].comments.length, 0);
    console.log('PASS: icon toggles, replies on existing comments, reply likes/delete, reload, ownership, bookmark isolation, parent deletion/cancel');
})().catch(error => { console.error(error); process.exitCode = 1; });
