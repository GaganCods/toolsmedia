document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadUserSettings(user);
            setupEventListeners(user);
        } else {
            window.location.href = 'auth.html';
        }
    });
});

function loadUserSettings(user) {
    // Update profile icon and name in nav
    document.querySelector('.profile-name').textContent = user.displayName || 'User';
    const profileIcon = document.querySelector('.profile-icon');
    profileIcon.textContent = (user.displayName || 'U').charAt(0).toUpperCase();

    // Populate form fields
    document.getElementById('full-name').value = user.displayName || '';
    document.getElementById('email').value = user.email || '';
}

function setupEventListeners(user) {
    // Profile Settings Form
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('.save-btn');
        const buttonText = saveBtn.querySelector('span');
        const buttonLoader = saveBtn.querySelector('.button-loader');

        // Show loading state
        buttonText.style.opacity = '0';
        buttonLoader.style.display = 'block';

        const fullName = document.getElementById('full-name').value;

        // Update display name in Firebase Auth
        user.updateProfile({
            displayName: fullName
        }).then(() => {
            // Update user data in Firestore
            return firebase.firestore().collection('users').doc(user.uid).update({
                displayName: fullName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }).then(() => {
            showToast('Profile updated successfully', 'success');
            // Update UI
            document.querySelector('.profile-name').textContent = fullName;
            document.querySelector('.profile-icon').textContent = fullName.charAt(0).toUpperCase();
        }).catch((error) => {
            console.error("Error updating profile:", error);
            showToast('Error updating profile', 'error');
        }).finally(() => {
            // Reset button state
            buttonText.style.opacity = '1';
            buttonLoader.style.display = 'none';
        });
    });

    // Security Settings Form
    document.getElementById('security-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        const saveBtn = e.target.querySelector('.save-btn');
        const buttonText = saveBtn.querySelector('span');
        const buttonLoader = saveBtn.querySelector('.button-loader');

        // Show loading state
        buttonText.style.opacity = '0';
        buttonLoader.style.display = 'block';

        // Reauthenticate user before changing password
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );

        user.reauthenticateWithCredential(credential)
            .then(() => {
                return user.updatePassword(newPassword);
            })
            .then(() => {
                showToast('Password updated successfully', 'success');
                document.getElementById('security-form').reset();
            })
            .catch((error) => {
                console.error("Error updating password:", error);
                showToast(error.message, 'error');
            })
            .finally(() => {
                // Reset button state
                buttonText.style.opacity = '1';
                buttonLoader.style.display = 'none';
            });
    });

    // Settings Navigation
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    const settingsTabs = document.querySelectorAll('.settings-tab');

    settingsNavItems.forEach(item => {
        item.addEventListener('click', () => {
            settingsNavItems.forEach(nav => nav.classList.remove('active'));
            settingsTabs.forEach(tab => tab.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(`${item.dataset.tab}-settings`).classList.add('active');
        });
    });

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggle.querySelector('i').classList.toggle('fa-eye');
            toggle.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('form').reset();
            loadUserSettings(user);
        });
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.querySelector('.toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
