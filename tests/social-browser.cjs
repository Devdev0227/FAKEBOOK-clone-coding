const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.goto('http://localhost:8765/main.html');
 await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('fakebookUsers', JSON.stringify([{id:'alice',name:'김학생',phone:'01012345678',password:'Pass!1234'}, {id:'bob',name:'이학생'}]));
  localStorage.setItem('fakebookFriends:alice', JSON.stringify({friends:[],dismissed:[],requests:['demo-1','demo-2'],nextRequestAt:Date.now()+86400000}));
  localStorage.setItem('fakebookCurrentUser', JSON.stringify({id:'alice',name:'김학생'}));
  localStorage.setItem('fakebookPosts', JSON.stringify([{id:'legacy',author:'김학생',text:'기존 게시물',createdAt:new Date().toISOString(),comments:[{id:'c1',authorId:'alice',author:'김학생',text:'기존 댓글',replies:[{id:'r1',authorId:'alice',author:'김학생',text:'기존 답글'}]}]}]));
 });
 await page.goto('http://localhost:8765/main.html#friends');
 await page.getByRole('heading',{name:'알 수도 있는 사람'}).waitFor();
 assert.equal(await page.locator('.friend-row').count(),10);
 const seeded = await page.evaluate(()=>localStorage.getItem('fakebookDummyProfiles'));
 await page.reload(); assert.equal(await page.evaluate(()=>localStorage.getItem('fakebookDummyProfiles')),seeded);
 await page.locator('.friend-row').first().getByRole('button',{name:'친구 추가',exact:true}).click();
 await page.getByRole('button',{name:'모든 친구 (1)',exact:true}).click(); assert.equal(await page.locator('.friend-row').count(),1);
 await page.locator('.friend-row .friend-name').click(); await page.locator('.profile-detail').waitFor();
 assert.equal(await page.getByRole('button',{name:'친구 삭제',exact:true}).count(),1);
 await page.getByRole('link',{name:'← 친구 목록'}).click();
 await page.getByRole('button',{name:'요청 (2)',exact:true}).click();
 await page.locator('.friend-row').first().getByRole('button',{name:'확인',exact:true}).click();
 await page.getByRole('button',{name:'모든 친구 (2)',exact:true}).click(); assert.equal(await page.locator('.friend-row').count(),2);
 await page.getByRole('textbox',{name:'친구 이름 검색'}).count(); // type=search uses searchbox
 await page.getByRole('searchbox',{name:'친구 이름 검색'}).fill('없는이름'); assert.equal(await page.locator('.friend-row').count(),0);
 await page.getByRole('searchbox',{name:'친구 이름 검색'}).fill('');
 page.on('dialog', dialog=>dialog.accept());
 await page.locator('.friend-row').first().getByRole('button',{name:'친구 삭제',exact:true}).click(); assert.equal(await page.locator('.friend-row').count(),1);
 await page.getByRole('button',{name:'추천',exact:true}).click(); const before = await page.locator('.friend-row').count();
 await page.locator('.friend-row').first().getByRole('button',{name:'삭제',exact:true}).click(); assert.equal(await page.locator('.friend-row').count(),before);
 await page.getByRole('button',{name:'삭제한 추천 다시 보기'}).click(); assert.equal(await page.locator('.friend-row').count(),before);
 await page.getByRole('link',{name:'프로필 설정',exact:true}).click();
 await page.getByLabel('표시 이름 (2~30자)').fill('정연 테스트');
 await page.getByLabel('소개 (최대 200자)').fill('내 소개입니다.'); await page.getByLabel('생년월일 (선택)').fill('2006-04-12');
 // PNG 업로드가 실제로 디코딩/축소/저장되는지 확인.
 await page.locator('#profilePhoto').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await page.waitForFunction(()=>document.querySelector('.profile-form img').src.startsWith('data:image/jpeg'));
 await page.getByRole('button',{name:'저장',exact:true}).click(); await page.locator('.profile-detail').waitFor();
 assert.equal(await page.locator('#welcomeName').textContent(),'정연 테스트님');
 assert((await page.locator('.profile-detail img').getAttribute('src')).startsWith('data:image/jpeg'));
 await page.getByRole('link',{name:'홈',exact:true}).click();
 assert.equal(await page.locator('.author-profile strong').count(),3);
 assert.deepEqual(await page.locator('.author-profile strong').allTextContents(),['정연 테스트','정연 테스트','정연 테스트']);
 await page.reload(); assert.equal(await page.locator('#welcomeName').textContent(),'정연 테스트님');
 await page.getByRole('button',{name:'게시물 수정',exact:true}).click(); await page.getByLabel('게시물 내용 수정').fill('수정 확인');
 await page.getByRole('button',{name:'수정 저장',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fakebookPosts'))[0].authorId),'alice');
 await page.getByRole('link',{name:'프로필 설정',exact:true}).click(); await page.getByLabel('표시 이름 (2~30자)').fill('취소될이름'); await page.getByRole('link',{name:'취소',exact:true}).click(); assert.equal(await page.locator('#welcomeName').textContent(),'정연 테스트님');
 // 별도 계정의 친구와 프로필이 분리되는지 확인.
 await page.evaluate(()=>localStorage.setItem('fakebookCurrentUser',JSON.stringify({id:'bob',name:'이학생'})));
 await page.goto('http://localhost:8765/main.html#friends'); await page.getByRole('button',{name:'모든 친구 (0)',exact:true}).waitFor(); assert.equal(await page.locator('#welcomeName').textContent(),'이학생님');
 for (const width of [1440,768,390,320]) {
  await page.setViewportSize({width,height:1000});
  for (const hash of ['#home','#friends','#settings','#saved','#profile']) {
   await page.goto('http://localhost:8765/main.html'+hash); await page.waitForTimeout(70);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow: ${width} ${hash}`);
   if(hash==='#friends') {
    const collisions = await page.locator('.friend-row').evaluateAll(rows=>rows.some(row=>{const a=row.children[0].getBoundingClientRect(), b=row.children[1].getBoundingClientRect();return a.right>b.left;})); assert.equal(collisions,false);
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000}); await page.goto('http://localhost:8765/main.html#friends'); await page.screenshot({path:'/tmp/friends-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844}); await page.screenshot({path:'/tmp/friends-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]); await browser.close();
 console.log('PASS: friend add/remove/dismiss/restore, requests, search, profile links, upload/save/cancel/reload, author migration and profile propagation, account isolation, 320/390/768/1440px overflow checks; no browser errors');
})().catch(e=>{console.error(e);process.exit(1)});

