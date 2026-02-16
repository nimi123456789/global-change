// Simple hash function for password storage (for demo purposes)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Initialize demo account
function initializeDemoAccount() {
    const users = JSON.parse(localStorage.getItem('gc_users') || '{}');
    if (!users['demo']) {
        users['demo'] = {
            username: 'demo',
            passwordHash: simpleHash('demo123'),
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('gc_users', JSON.stringify(users));
    }
}

// Tab switching
document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('signup-tab').classList.remove('active');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
});

document.getElementById('signup-tab').addEventListener('click', () => {
    document.getElementById('signup-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
});

// Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const users = JSON.parse(localStorage.getItem('gc_users') || '{}');
    const user = users[username];

    if (!user) {
        errorEl.textContent = '❌ Username not found';
        return;
    }

    if (user.passwordHash !== simpleHash(password)) {
        errorEl.textContent = '❌ Incorrect password';
        return;
    }

    // Set session
    sessionStorage.setItem('gc_session', JSON.stringify({
        username: username,
        loginTime: new Date().toISOString()
    }));

    // Redirect to wallet
    window.location.href = 'index.html';
});

// Signup
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorEl = document.getElementById('signup-error');

    if (password !== confirm) {
        errorEl.textContent = '❌ Passwords do not match';
        return;
    }

    if (username.length < 3) {
        errorEl.textContent = '❌ Username must be at least 3 characters';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = '❌ Password must be at least 6 characters';
        return;
    }

    const users = JSON.parse(localStorage.getItem('gc_users') || '{}');

    if (users[username]) {
        errorEl.textContent = '❌ Username already exists';
        return;
    }

    // Create new user
    users[username] = {
        username: username,
        passwordHash: simpleHash(password),
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('gc_users', JSON.stringify(users));

    // Set session
    sessionStorage.setItem('gc_session', JSON.stringify({
        username: username,
        loginTime: new Date().toISOString()
    }));

    // Redirect to wallet
    window.location.href = 'index.html';
});

// Initialize on load
initializeDemoAccount();
