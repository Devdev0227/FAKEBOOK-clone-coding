const USER_STORAGE_KEY = "fakebookUsers";
const CURRENT_USER_KEY = "fakebookCurrentUser";
const RESET_USER_KEY = "fakebookResetUserId";
const POSTS_STORAGE_KEY = "fakebookPosts";

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

function normalizePhone(phone) {
    return phone.replace(/[^0-9]/g, "");
}

function setMessage(elementId, message) {
    const element = document.querySelector(`#${elementId}`);
    if (element) element.textContent = message;
}

// ------------------------------
// 로그인 페이지
// ------------------------------
const loginForm = document.querySelector("#loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const id = document.querySelector("#name").value.trim();
        const password = document.querySelector("#password").value;
        const users = getUsers();

        const user = users.find((item) => item.id === id && item.password === password);

        if (!user) {
            alert("아이디 또는 비밀번호가 올바르지 않습니다.");
            return;
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
            id: user.id,
            name: user.name,
            phone: user.phone
        }));

        location.href = "main.html";
    });
}

const signupButton = document.querySelector("#signupButton");
if (signupButton) {
    signupButton.addEventListener("click", () => {
        location.href = "signup.html";
    });
}

const findPasswordButton = document.querySelector("#findPasswordButton");
if (findPasswordButton) {
    findPasswordButton.addEventListener("click", () => {
        location.href = "find-password.html";
    });
}

// ------------------------------
// 회원가입 페이지
// ------------------------------
const signupForm = document.querySelector("#signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.querySelector("#signupName").value.trim();
        const phone = normalizePhone(document.querySelector("#signupPhone").value);
        const id = document.querySelector("#signupId").value.trim();
        const password = document.querySelector("#signupPassword").value;
        const passwordConfirm = document.querySelector("#signupPasswordConfirm").value;

        if (name.length < 2) {
            alert("이름을 2글자 이상 입력해주세요.");
            return;
        }

        if (phone.length < 10) {
            alert("전화번호를 올바르게 입력해주세요.");
            return;
        }

        if (id.length < 3) {
            alert("아이디는 3글자 이상 입력해주세요.");
            return;
        }

        if (password.length < 4) {
            alert("비밀번호는 4글자 이상 입력해주세요.");
            return;
        }

        if (password !== passwordConfirm) {
            alert("비밀번호가 서로 다릅니다.");
            return;
        }

        const users = getUsers();

        if (users.some((item) => item.id === id)) {
            alert("이미 사용 중인 아이디입니다.");
            return;
        }

        if (users.some((item) => item.phone === phone)) {
            alert("이미 가입된 전화번호입니다.");
            return;
        }

        users.push({
            id,
            password,
            name,
            phone,
            createdAt: new Date().toISOString()
        });

        saveUsers(users);

        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        location.href = "index.html";
    });
}

// ------------------------------
// 비밀번호 찾기: 이름 + 전화번호 확인
// ------------------------------
const findPasswordForm = document.querySelector("#findPasswordForm");

if (findPasswordForm) {
    findPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.querySelector("#findName").value.trim();
        const phone = normalizePhone(document.querySelector("#findPhone").value);
        const users = getUsers();

        const user = users.find((item) => item.name === name && item.phone === phone);

        if (!user) {
            setMessage("findPasswordMessage", "일치하는 회원정보를 찾을 수 없습니다.");
            return;
        }

        sessionStorage.setItem(RESET_USER_KEY, user.id);
        location.href = "reset-password.html";
    });
}

// ------------------------------
// 새 비밀번호 설정
// ------------------------------
const resetPasswordForm = document.querySelector("#resetPasswordForm");

if (resetPasswordForm) {
    const resetUserId = sessionStorage.getItem(RESET_USER_KEY);

    if (!resetUserId) {
        alert("먼저 본인 확인을 진행해주세요.");
        location.href = "find-password.html";
    }

    resetPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const newPassword = document.querySelector("#newPassword").value;
        const newPasswordConfirm = document.querySelector("#newPasswordConfirm").value;

        if (newPassword.length < 4) {
            setMessage("resetPasswordMessage", "비밀번호는 4글자 이상 입력해주세요.");
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setMessage("resetPasswordMessage", "두 비밀번호가 서로 다릅니다.");
            return;
        }

        const users = getUsers();
        const user = users.find((item) => item.id === resetUserId);

        if (!user) {
            sessionStorage.removeItem(RESET_USER_KEY);
            alert("회원정보를 찾을 수 없습니다.");
            location.href = "index.html";
            return;
        }

        user.password = newPassword;
        saveUsers(users);
        sessionStorage.removeItem(RESET_USER_KEY);

        alert("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
        location.href = "index.html";
    });
}

// ------------------------------
// 메인 페이지
// ------------------------------
const mainWelcomeName = document.querySelector("#welcomeName");

if (mainWelcomeName) {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");

    if (!currentUser) {
        location.href = "index.html";
    } else {
        mainWelcomeName.textContent = `${currentUser.name}님`;
    }
}

const logoutButton = document.querySelector("#logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        location.href = "index.html";
    });
}

// ------------------------------
// 선택 기능: 로컬 게시물 작성
// ------------------------------
const postButton = document.querySelector("#postButton");
const localPosts = document.querySelector("#localPosts");

function getPosts() {
    try {
        return JSON.parse(localStorage.getItem(POSTS_STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function savePosts(posts) {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
}

function renderLocalPosts() {
    if (!localPosts) return;

    const posts = getPosts();
    localPosts.innerHTML = "";

    posts.slice().reverse().forEach((post) => {
        const article = document.createElement("article");
        article.className = "feed-post";
        article.innerHTML = `
            <div class="feed-post-header">
                <strong>${escapeHtml(post.author)}</strong>
                <span>${new Date(post.createdAt).toLocaleString("ko-KR")}</span>
            </div>
            <p>${escapeHtml(post.text)}</p>
            <button type="button" class="feed-like">좋아요 <span>${post.likes || 0}</span></button>
        `;

        const likeButton = article.querySelector(".feed-like");
        likeButton.addEventListener("click", () => {
            const allPosts = getPosts();
            const target = allPosts.find((item) => item.id === post.id);
            if (!target) return;
            target.likes = (target.likes || 0) + 1;
            savePosts(allPosts);
            renderLocalPosts();
        });

        localPosts.appendChild(article);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

if (postButton && localPosts) {
    postButton.addEventListener("click", () => {
        const postText = document.querySelector("#postText").value.trim();
        const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");

        if (!currentUser) {
            location.href = "index.html";
            return;
        }

        if (!postText) {
            alert("게시물 내용을 입력해주세요.");
            return;
        }

        const posts = getPosts();
        posts.push({
            id: Date.now(),
            author: currentUser.name,
            text: postText,
            likes: 0,
            createdAt: new Date().toISOString()
        });

        savePosts(posts);
        document.querySelector("#postText").value = "";
        renderLocalPosts();
    });

    renderLocalPosts();
}
