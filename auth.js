// auth.js - Secure Authentication System
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let isLocked = false;
let lockoutTimer = null;

// ======================
// CORE AUTHENTICATION
// ======================

/**
 * Initializes security checks when page loads
 */
function initializeAuth() {
    redirectToProperPage();
    setupEnterKeyLogin();
    preventPasswordBypass();
}

/**
 * Checks password and handles login
 */
function checkPassword() {
    if (isLocked) {
        showError("System locked. Try again later.");
        return false;
    }

    const passwordInput = document.getElementById('password');
    if (!passwordInput) return false;

    const enteredPassword = passwordInput.value;
    const storedPassword = localStorage.getItem('adminPassword');
    const errorElement = document.getElementById('error-msg');

    // Validation checks
    if (!storedPassword) {
        window.location.href = "index.html";
        return false;
    }

    if (!enteredPassword) {
        showError("Please enter your password");
        return false;
    }

    if (enteredPassword !== storedPassword) {
        handleFailedAttempt();
        return false;
    }

    // Successful login
    resetSecurityState();
    window.location.href = "admin.html";
    return true;
}

// ======================
// PASSWORD MANAGEMENT
// ======================

/**
 * Sets a new password with validation
 */
function setPassword() {
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('error-msg');

    // Validation
    if (!validatePasswordStrength(newPass, errorElement)) return false;
    if (newPass !== confirmPass) {
        showError("Passwords don't match!");
        return false;
    }

    // Store password
    localStorage.setItem('adminPassword', newPass);
    localStorage.setItem('passwordSet', 'true');
    
    // Redirect to admin panel
    window.location.href = "admin.html";
    return true;
}

/**
 * Changes password after verifying current one
 */
function changePassword() {
    const currentPassword = prompt("Enter current password:");
    if (!currentPassword) return false;

    const storedPassword = localStorage.getItem('adminPassword');
    if (currentPassword !== storedPassword) {
        alert("Incorrect current password!");
        return false;
    }

    const newPassword = prompt("Enter new password (min 8 chars, 1 uppercase, 1 number):");
    if (!validatePasswordStrength(newPassword)) {
        alert("Invalid password! Requirements not met.");
        return false;
    }

    const confirmPassword = prompt("Confirm new password:");
    if (newPassword !== confirmPassword) {
        alert("Passwords don't match!");
        return false;
    }

    localStorage.setItem('adminPassword', newPassword);
    alert("Password changed successfully!");
    return true;
}

// ======================
// SECURITY UTILITIES
// ======================

function validatePasswordStrength(password, errorElement = null) {
    const requirements = [
        { test: () => password.length >= 8, message: "Password must be at least 8 characters" },
        { test: () => /[A-Z]/.test(password), message: "Password must contain at least one uppercase letter" },
        { test: () => /[0-9]/.test(password), message: "Password must contain at least one number" },
        { test: () => !/\s/.test(password), message: "Password cannot contain spaces" }
    ];

    for (const req of requirements) {
        if (!req.test()) {
            if (errorElement) showError(req.message, errorElement);
            return false;
        }
    }
    return true;
}

function handleFailedAttempt() {
    loginAttempts++;
    const remainingAttempts = MAX_ATTEMPTS - loginAttempts;
    
    if (loginAttempts >= MAX_ATTEMPTS) {
        lockSystem();
        showError(`Too many attempts. System locked for ${LOCKOUT_DURATION/60000} minutes.`);
    } else {
        showError(`Incorrect password. ${remainingAttempts} attempts remaining.`);
    }
}

function lockSystem() {
    isLocked = true;
    lockoutTimer = setTimeout(() => {
        isLocked = false;
        loginAttempts = 0;
        clearError();
    }, LOCKOUT_DURATION);
}

function resetSecurityState() {
    loginAttempts = 0;
    isLocked = false;
    if (lockoutTimer) {
        clearTimeout(lockoutTimer);
        lockoutTimer = null;
    }
    clearError();
}

// ======================
// UI HELPERS
// ======================

function showError(message, element = document.getElementById('error-msg')) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
}

function clearError(element = document.getElementById('error-msg')) {
    if (!element) return;
    element.style.display = 'none';
}

function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        iconElement.classList.toggle('fa-eye-slash');
    }
}

// ======================
// PAGE ROUTING
// ======================

function redirectToProperPage() {
    const hasPassword = localStorage.getItem('adminPassword');
    const isSetupPage = window.location.pathname.includes('index.html');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!hasPassword && !isSetupPage) {
        window.location.href = "index.html";
    } else if (hasPassword && isSetupPage) {
        window.location.href = "login.html";
    }
}

function preventPasswordBypass() {
    if (!localStorage.getItem('adminPassword') && 
        window.location.pathname.includes('admin.html')) {
        window.location.href = "index.html";
    }
}

function setupEnterKeyLogin() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAuth);

// ======================
// EXPORT FUNCTIONS FOR HTML
// ======================
window.checkPassword = checkPassword;
window.setPassword = setPassword;
window.changePassword = changePassword;
window.togglePasswordVisibility = togglePasswordVisibility;

