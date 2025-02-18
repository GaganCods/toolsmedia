// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Initialize mobile menu elements
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backdrop = document.querySelector('.mobile-backdrop');
    const profileSection = document.querySelector('.profile-section');
    const body = document.body;

    // Mobile menu toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            
            // Reset all animations by removing and re-adding active class
            if (navLinks.classList.contains('active')) {
                const links = navLinks.querySelectorAll('a');
                links.forEach(link => {
                    link.style.animation = 'none';
                    link.offsetHeight; // Trigger reflow
                    link.style.animation = null;
                });
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && 
                !menuToggle.contains(e.target) && 
                navLinks.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Profile dropdown functionality
    if (profileSection) {
        profileSection.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = this.querySelector('.profile-dropdown');
            
            // Toggle current dropdown
            this.classList.toggle('active-dropdown');
            dropdown.classList.toggle('show');
            
            // Log for debugging
            console.log('Profile clicked', {
                isDropdownShown: dropdown.classList.contains('show'),
                dropdownDisplay: window.getComputedStyle(dropdown).display
            });
        });

        // Prevent closing when clicking inside dropdown
        document.querySelectorAll('.profile-dropdown').forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    // Mobile profile functionality
    function toggleMobileProfile(show) {
        if (window.innerWidth <= 768 && profileSection) {
            profileSection.classList.toggle('show-dropdown', show);
            if (backdrop) {
                backdrop.classList.toggle('active', show);
            }
            body.style.overflow = show ? 'hidden' : '';
        }
    }

    if (profileSection) {
        profileSection.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
                toggleMobileProfile(true);
            }
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', () => {
            toggleMobileProfile(false);
        });
    }

    // Auth state handler
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            const authLink = document.querySelector('.auth-link');
            const profileSection = document.querySelector('.profile-section');
            
            if (user) {
                // User is signed in
                if (authLink) {
                    authLink.style.display = 'none';
                    authLink.classList.remove('show');
                }
                if (profileSection) {
                    profileSection.style.display = 'flex';
                    profileSection.classList.add('active');
                    
                    // Set user's name
                    const displayName = user.displayName || user.email.split('@')[0] || 'User';
                    const profileName = profileSection.querySelector('.profile-name');
                    if (profileName) profileName.textContent = displayName;
                    
                    // Set profile icon
                    const profileIcon = profileSection.querySelector('.profile-icon');
                    if (profileIcon) {
                        const initials = displayName.charAt(0).toUpperCase();
                        profileIcon.textContent = initials;
                    }
                }
                
                // Handle logout
                const logoutBtn = document.querySelector('.logout');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        toggleMobileProfile(false);
                        firebase.auth().signOut().then(() => {
                            // Only redirect if not on generator page
                            const currentPath = window.location.pathname;
                            if (!currentPath.includes('generator.html')) {
                                window.location.href = 'auth.html';
                            }
                        }).catch(error => {
                            console.error('Logout error:', error);
                        });
                    });
                }
            } else {
                // User is signed out
                if (authLink) {
                    authLink.style.display = 'block';
                    authLink.classList.add('show');
                    authLink.textContent = 'Sign In';
                    authLink.href = 'auth.html';
                }
                if (profileSection) {
                    profileSection.style.display = 'none';
                    profileSection.classList.remove('active');
                    profileSection.classList.remove('show-dropdown');
                }
                if (backdrop) {
                    backdrop.classList.remove('active');
                }
                
                // Redirect to auth page if on protected pages
                const protectedPages = ['profile.html', 'settings.html'];
                const currentPage = window.location.pathname.split('/').pop();
                if (protectedPages.includes(currentPage) && !currentPage.includes('generator.html')) {
                    window.location.href = 'auth.html';
                }
            }
        });
    }

    // Close dropdowns on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            toggleMobileProfile(false);
            if (menuToggle && navLinks) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                body.style.overflow = '';
            }
        }
    });
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        // Optional: Prevent body scrolling when menu is open
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileBackdrop = document.querySelector('.mobile-backdrop');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (mobileBackdrop) {
                mobileBackdrop.classList.toggle('active');
            }
            // Prevent body scroll when menu is open
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close menu when clicking outside
    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            mobileBackdrop.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});