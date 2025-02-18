// Get auth instance
const auth = firebase.auth();

// Form elements
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetEmailInput = document.getElementById('reset-email');

// Handle form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = resetEmailInput.value;
    const submitButton = forgotPasswordForm.querySelector('.auth-button');
    const buttonText = submitButton.querySelector('span');
    const buttonLoader = submitButton.querySelector('.button-loader');
    
    try {
        // Show loading state
        submitButton.classList.add('loading');
        buttonText.style.opacity = '0';
        buttonLoader.style.display = 'block';
        
        // Send password reset email
        await auth.sendPasswordResetEmail(email);
        
        // Show success message
        showToast('Password reset link sent to your email!', 'success');
        
        // Reset form
        forgotPasswordForm.reset();
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 3000);
    } catch (error) {
        // Show error message
        showToast(error.message, 'error');
    } finally {
        // Reset button state
        submitButton.classList.remove('loading');
        buttonText.style.opacity = '1';
        buttonLoader.style.display = 'none';
    }
});

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.querySelector('.toast-container').appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 