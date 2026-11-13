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

function isValidPhone(phone) {
    return /^[0-9]{10,11}$/.test(phone);
}

function isValidId(id) {
    return /^[A-Za-z]{3,20}$/.test(id);
}

function isValidPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]{8,}$/.test(password);
}

function birthdayToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isValidBirthday(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > birthdayToday()) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
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
    document.querySelector("#signupBirthday").max = birthdayToday();
    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.querySelector("#signupName").value.trim();
        const birthday = document.querySelector("#signupBirthday").value;
        const phone = document.querySelector("#signupPhone").value.trim();
        const id = document.querySelector("#signupId").value.trim();
        const password = document.querySelector("#signupPassword").value;
        const passwordConfirm = document.querySelector("#signupPasswordConfirm").value;

        if (name.length < 2) {
            alert("이름을 2글자 이상 입력해주세요.");
            return;
        }

        if (!isValidBirthday(birthday)) {
            alert("생년월일을 1900년부터 오늘 사이의 올바른 날짜로 입력해주세요.");
            return;
        }

        if (!isValidPhone(phone)) {
            alert("전화번호는 '-' 없이 숫자 10~11자리로 입력해주세요.");
            return;
        }

        if (!isValidId(id)) {
            alert("아이디는 영문 대소문자만 사용하여 3~20자로 입력해주세요.");
            return;
        }

        if (!isValidPassword(password)) {
            alert("비밀번호는 영문, 숫자, 특수기호를 포함해 8자 이상 입력해주세요.");
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
            birthday,
            birthdayPublic: false,
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
        const phone = document.querySelector("#findPhone").value.trim();
        if (!isValidPhone(phone)) {
            setMessage("findPasswordMessage", "전화번호는 '-' 없이 숫자 10~11자리로 입력해주세요.");
            return;
        }

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

        if (!isValidPassword(newPassword)) {
            setMessage("resetPasswordMessage", "비밀번호는 영문, 숫자, 특수기호를 포함해 8자 이상 입력해주세요.");
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


