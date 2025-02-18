// Function to update profile icon
function updateProfileIcon(displayName) {
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const profileIcons = document.querySelectorAll('.profile-icon');
    profileIcons.forEach(icon => {
        icon.textContent = firstLetter;
        icon.style.backgroundImage = 'none';
    });
}

// Wait for DOM content and Firebase to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show loading overlay
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    // Check if Firebase is initialized
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                loadUserProfile(user);
            } else {
                window.location.href = 'auth.html';
            }
            // Hide loading overlay
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        });
    } else {
        console.error('Firebase is not initialized');
        showToast('error', 'Failed to initialize Firebase');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
});

// Add listener for favorites updates
window.addEventListener('favoritesUpdated', (event) => {
    const user = firebase.auth().currentUser;
    if (user) {
        loadSavedTools(user.uid);
    }
});

// Function to load user profile data
function loadUserProfile(user) {
    // Update profile icons
    const displayName = user.displayName || user.email.split('@')[0] || 'User';
    updateProfileIcon(displayName);
    
    // Update profile header details
    const profileNameElements = document.querySelectorAll('.profile-name');
    profileNameElements.forEach(element => {
        element.textContent = user.displayName || displayName;
    });

    const profileEmailElement = document.querySelector('.profile-details .profile-email');
    if (profileEmailElement) {
        profileEmailElement.textContent = user.email;
    }

    // Update info card details
    document.getElementById('email').textContent = user.email;
    document.getElementById('fullName').textContent = user.displayName || displayName;
    
    // Get additional user data from Firestore
    if (firebase.firestore) {
        const db = firebase.firestore();
        db.collection('users').doc(user.uid)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // Update profile fields
                    document.getElementById('location').textContent = userData.location || 'Not specified';
                    document.getElementById('bio').textContent = userData.bio || 'No bio added yet';
                    document.getElementById('phone').textContent = userData.phone || 'Not specified';
                    
                    // Format and display join date
                    const joinDate = userData.createdAt 
                        ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                        : 'Not available';
                    
                    const profileJoinedElement = document.querySelector('.profile-details .profile-joined');
                    if (profileJoinedElement) {
                        profileJoinedElement.textContent = `Joined: ${joinDate}`;
                    }
                    
                    // Update profile picture if exists
                    if (userData.profilePicture) {
                        const profilePicImg = document.querySelector('#profilePicImg');
                        if (profilePicImg) {
                            profilePicImg.style.backgroundImage = `url(${userData.profilePicture})`;
                        }
                    }

                    // Load saved tools
                    loadSavedTools(user.uid);
                }
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
                showToast('error', 'Error loading profile data');
            });
    }
}



// Function to load and display saved tools
function loadSavedTools(userId) {
    const db = firebase.firestore();
    const savedToolsGrid = document.querySelector('.saved-tools-grid');
    
    if (!savedToolsGrid) {
        console.error("Saved tools grid element not found");
        return;
    }
    
    db.collection('users').doc(userId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const favoriteToolsData = doc.data().favoriteToolsData || {};
                savedToolsGrid.innerHTML = ''; // Clear existing content
                
                if (Object.keys(favoriteToolsData).length > 0) {
                    Object.entries(favoriteToolsData).forEach(([toolId, tool]) => {
                        const toolCard = document.createElement('div');
                        toolCard.className = 'tool-card';
                        toolCard.dataset.toolId = toolId;
                        
                        toolCard.innerHTML = `
                            <div class="tool-icon">
                                <i class="${tool.icon || 'fas fa-tools'}"></i>
                            </div>
                            <div class="tool-info">
                                <h3>${tool.name || 'Unknown Tool'}</h3>
                                <p>${tool.description || 'No description available'}</p>
                                <div class="tool-meta">
                                    ${tool.meta || ''}
                                </div>
                            </div>
                            <a href="${tool.url || '#'}" class="use-tool-btn">Use Tool</a>
                        `;
                        
                        savedToolsGrid.appendChild(toolCard);
                    });

                    // Update saved tools count
                    const savedTab = document.querySelector('.profile-nav-item[data-tab="saved"]');
                    if (savedTab) {
                        savedTab.dataset.count = Object.keys(favoriteToolsData).length;
                    }
                } else {
                    savedToolsGrid.innerHTML = '<p class="no-tools">No saved tools yet</p>';
                }
            } else {
                savedToolsGrid.innerHTML = '<p class="no-tools">No saved tools yet</p>';
            }
        })
        .catch((error) => {
            console.error("Error loading saved tools:", error);
            showToast('error', 'Error loading saved tools');
            savedToolsGrid.innerHTML = '<p class="no-tools">Error loading saved tools</p>';
        });
}

// Toast notification function
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.querySelector('.toast-container');
    if (container) {
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Handle logout
document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut()
        .then(() => {
            window.location.href = 'auth.html';
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            showToast('error', 'Failed to sign out');
        });
});

// Profile navigation
document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        
        document.querySelectorAll('.profile-nav-item').forEach(navItem => 
            navItem.classList.remove('active'));
        document.querySelectorAll('.profile-section-content').forEach(section => 
            section.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(`${tab}-section`)?.classList.add('active');
    });
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileBackdrop = document.querySelector('.mobile-backdrop');
    const profileSection = document.querySelector('.profile-section');

    menuToggle?.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks?.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Mobile profile dropdown
    profileSection?.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            profileSection.classList.toggle('show-dropdown');
            mobileBackdrop?.classList.toggle('active');
        }
    });

    // Close mobile dropdown when clicking backdrop
    mobileBackdrop?.addEventListener('click', () => {
        profileSection?.classList.remove('show-dropdown');
        mobileBackdrop.classList.remove('active');
    });
});


