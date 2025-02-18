// Toast notification function and make it globally available

function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.querySelector('.toast-container');
    if (container) {
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Make showToast available globally
window.showToast = showToast;

// Google Authentication Handler
async function handleGoogleAuth(e) {
    e.preventDefault();
    const button = e.currentTarget;
    
    if (!window.auth || !window.db || !window.googleProvider) {
        showToast('error', 'Authentication system not available');
        return;
    }
    
    try {
        button.disabled = true;
        const result = await window.auth.signInWithPopup(window.googleProvider);
        const user = result.user;
        
        await window.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Google Auth Error:', error);
        let errorMessage = 'Failed to sign in with Google';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Please allow popups for this site';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in cancelled';
        }
        
        showToast('error', errorMessage);
    } finally {
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is properly initialized
    if (!window.auth || !window.db) {
        showToast('error', 'Authentication system not available');
        return;
    }

    // Set persistence to LOCAL to keep user signed in

    window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(error => {
            console.error('Persistence error:', error);
            showToast('error', 'Failed to set authentication persistence');
        });

    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleButtons = document.querySelectorAll('.google-auth-button');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Tab Switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${tab}-form`).classList.add('active');
        });
    });

    // Email/Password Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('.auth-button');
        
        if (!email || !password) {
            showToast('error', 'Please fill in all fields');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.querySelector('.button-loader').style.display = 'block';
            submitBtn.querySelector('span').style.opacity = '0';
            
            await window.auth.signInWithEmailAndPassword(email, password);
            
            const user = window.auth.currentUser;
            if (user) {
                await window.db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            showToast('success', 'Login successful');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (error) {
            console.error('Login error:', error);
            showToast('error', getAuthErrorMessage(error.code));

        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.button-loader').style.display = 'none';
            submitBtn.querySelector('span').style.opacity = '1';
        }
    });

    // Email/Password Sign Up
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const fullName = document.getElementById('signup-name').value.trim();
        const submitBtn = signupForm.querySelector('.auth-button');
        
        if (!email || !password || !confirmPassword || !fullName) {
            showToast('error', 'Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showToast('error', 'Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.querySelector('.button-loader').style.display = 'block';
            submitBtn.querySelector('span').style.opacity = '0';
            
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Send verification email
            await user.sendEmailVerification();
            
            await user.updateProfile({ displayName: fullName });
            await window.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: fullName,
                email: email,
                emailVerified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('success', 'Account created! Please check your email for verification link');
            // Sign out user until they verify their email
            await window.auth.signOut();
            
            // Switch to login tab after 2 seconds
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
            }, 2000);
        } catch (error) {
            console.error('Signup error:', error);
            showToast('error', getAuthErrorMessage(error.code));

        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.button-loader').style.display = 'none';
            submitBtn.querySelector('span').style.opacity = '1';
        }
    });

    // Add Google auth button listeners
    googleButtons.forEach(button => {
        button.addEventListener('click', handleGoogleAuth);
    });

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const input = e.currentTarget.parentElement.querySelector('input');
            const icon = e.currentTarget.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Auth error messages helper
    function getAuthErrorMessage(code) {
        switch (code) {
            case 'auth/user-not-found': return 'No account found with this email';
            case 'auth/wrong-password': return 'Incorrect password';
            case 'auth/invalid-email': return 'Invalid email address';
            case 'auth/email-already-in-use': return 'This email is already registered';
            case 'auth/weak-password': return 'Password is too weak';
            case 'auth/popup-closed-by-user': return 'Sign in cancelled';
            case 'auth/popup-blocked': return 'Please allow popups for this site';
            case 'auth/network-request-failed': return 'Network error. Please check your connection';
            case 'auth/too-many-requests': return 'Too many attempts. Please try again later';
            default: return 'Authentication failed. Please try again';
        }
    }

    // Check authentication state
    window.auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.includes('auth.html')) {
            window.location.href = 'index.html';
        }
    });
});

