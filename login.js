/**
 * 登录页面 JavaScript
 */

// DOM 元素
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const loginLoading = document.getElementById('login-loading');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toastContainer = document.getElementById('toast-container');

// 切换按钮
const btnLinkRegister = document.getElementById('btn-link-register');
const btnLinkLogin = document.getElementById('btn-link-login');

// 密码显示切换
const loginPasswordToggle = document.getElementById('login-password-toggle');
const regPasswordToggle = document.getElementById('reg-password-toggle');

// 输入框
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const regUsername = document.getElementById('reg-username');
const regNickname = document.getElementById('reg-nickname');
const regEmail = document.getElementById('reg-email');
const regPassword = document.getElementById('reg-password');
const regConfirm = document.getElementById('reg-confirm');

// 页面加载时检查是否已登录
document.addEventListener('DOMContentLoaded', () => {
    if (api.isAuthenticated()) {
        // 已登录，跳转到主页
        window.location.href = 'index.html';
    }
});

// 切换到注册页面
btnLinkRegister.addEventListener('click', () => {
    loginFormContainer.style.display = 'none';
    registerFormContainer.style.display = 'block';
});

// 切换回登录页面
btnLinkLogin.addEventListener('click', () => {
    registerFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'block';
});

// 密码显示切换
loginPasswordToggle.addEventListener('click', () => {
    togglePasswordVisibility(loginPassword, loginPasswordToggle);
});

regPasswordToggle.addEventListener('click', () => {
    togglePasswordVisibility(regPassword, regPasswordToggle);
});

function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    // 切换图标
    if (type === 'text') {
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
}

// 登录表单提交
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
        showToast('请输入用户名和密码', 'error');
        return;
    }

    // 显示加载状态
    showLoading('登录中...');

    try {
        const result = await api.login(username, password);

        if (result.success) {
            showToast('登录成功，即将跳转...', 'success');

            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        hideLoading();
        showToast(error.message || '登录失败，请检查用户名和密码', 'error');
    }
});

// 注册表单提交
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = regUsername.value.trim();
    const nickname = regNickname.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const confirm = regConfirm.value;

    // 验证
    if (!username || !nickname || !password) {
        showToast('请填写所有必填项', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('密码至少需要 6 位字符', 'error');
        return;
    }

    if (password !== confirm) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    // 显示加载状态
    showLoading('注册中...');

    try {
        const result = await api.register(username, password, nickname, email);

        if (result.success) {
            showToast('注册成功，即将自动登录...', 'success');

            // 自动登录
            setTimeout(async () => {
                try {
                    await api.login(username, password);
                    window.location.href = 'index.html';
                } catch (error) {
                    // 自动登录失败，跳转到登录页面
                    window.location.href = 'login.html';
                }
            }, 1000);
        }
    } catch (error) {
        hideLoading();
        showToast(error.message || '注册失败，请重试', 'error');
    }
});

// 显示加载状态
function showLoading(text) {
    loginFormContainer.style.display = 'none';
    registerFormContainer.style.display = 'none';
    loginLoading.style.display = 'block';
    document.querySelector('.loading-text').textContent = text;
}

// 隐藏加载状态
function hideLoading() {
    loginLoading.style.display = 'none';
    loginFormContainer.style.display = 'block';
}

// 显示 Toast 提示
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polyline points="20 6 9 17 4 12"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="12" y1="8" x2="12" y2="12"/>
             <line x1="12" y1="16" x2="12.01" y2="16"/>
           </svg>`;

    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // 3 秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 回车键提交表单
loginUsername.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginPassword.focus();
    }
});

loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

registerForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        // 在最后一个输入框按回车才提交
        if (e.target === regConfirm) {
            registerForm.dispatchEvent(new Event('submit'));
        } else {
            // 否则聚焦到下一个输入框
            const inputs = Array.from(registerForm.querySelectorAll('input'));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    }
});
