// Authentication and Password Management
let loginAttempts = 0;
let isMuted = false;

// Check if password is set, redirect if not
function checkFirstTimeUser() {
    if (!localStorage.getItem('adminPassword')) {
        window.location.href = "index.html";
    }
}

// Set new password (first-time setup)
function setPassword() {
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('error-message');

    // Validation
    if (newPass.length < 6) {
        errorElement.textContent = "Password must be at least 6 characters!";
        errorElement.style.display = 'block';
        return;
    }

    if (newPass !== confirmPass) {
        errorElement.textContent = "Passwords don't match!";
        errorElement.style.display = 'block';
        return;
    }

    // Store password and redirect
    localStorage.setItem('adminPassword', newPass);
    window.location.href = "admin.html";
}

// Verify login credentials
function checkPassword() {
    if (isMuted) {
        document.getElementById('login-error').textContent = "System locked for 1 hour due to multiple failed attempts";
        document.getElementById('login-error').style.display = 'block';
        return;
    }
    
    const enteredPassword = document.getElementById('password').value;
    const storedPassword = localStorage.getItem('adminPassword');
    
    if (enteredPassword === storedPassword) {
        loginAttempts = 0;
        showAdminPortal();
    } else {
        loginAttempts++;
        handleFailedLogin();
    }
}

// Handle failed login attempts
function handleFailedLogin() {
    const errorElement = document.getElementById('login-error');
    
    if (loginAttempts >= 3) {
        isMuted = true;
        errorElement.textContent = "Too many failed attempts. System locked for 1 hour.";
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            isMuted = false;
            loginAttempts = 0;
            errorElement.style.display = 'none';
        }, 3600000); // 1 hour
    } else {
        errorElement.textContent = `Incorrect password. ${3 - loginAttempts} attempts remaining.`;
        errorElement.style.display = 'block';
    }
}

// Change password function
function changePassword() {
    const current = prompt("Enter current password:");
    const stored = localStorage.getItem('adminPassword');
    
    if (current === stored) {
        const newPass = prompt("Enter new password:");
        const confirmPass = prompt("Confirm new password:");
        
        if (newPass === confirmPass) {
            if (newPass.length < 6) {
                alert("Password must be at least 6 characters!");
                return;
            }
            
            localStorage.setItem('adminPassword', newPass);
            alert("Password changed successfully!");
        } else {
            alert("Passwords don't match!");
        }
    } else {
        alert("Incorrect current password!");
    }
}

// Show admin portal after successful login
function showAdminPortal() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-portal').style.display = 'block';
    loadExpenses(); // Load existing expenses
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = "admin.html";
}

// Check authentication on admin page load
if (window.location.pathname.includes('admin.html')) {
    checkFirstTimeUser();
}

// Allow form submission with Enter key
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    const confirmPassInput = document.getElementById('confirm-password');
    if (confirmPassInput) {
        confirmPassInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                setPassword();
            }
        });
    }
});