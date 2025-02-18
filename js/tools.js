// Initialize Firebase references
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchTools');
    const toolCards = document.querySelectorAll('.tool-card');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const toolsSections = document.querySelectorAll('.tools-section');

    // Initialize Firebase Auth listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            setupFavoriteButtons(user);
        } else {
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            });
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        toolCards.forEach(card => {
            const toolName = card.querySelector('h3').textContent.toLowerCase();
            const toolDescription = card.querySelector('p').textContent.toLowerCase();
            const shouldShow = toolName.includes(searchTerm) || 
                             toolDescription.includes(searchTerm);
            
            card.style.display = shouldShow ? 'flex' : 'none';
        });

        // Show/hide sections based on visible cards
        toolsSections.forEach(section => {
            const visibleCards = section.querySelectorAll('.tool-card[style="display: flex;"]');
            section.style.display = visibleCards.length > 0 ? 'block' : 'none';
        });
    });

    // Filter functionality
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // Remove empty state if exists
            const emptyState = document.querySelector('.empty-favorites');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            if (category === 'favorites') {
                handleFavoritesFilter();
            } else {
                toolsSections.forEach(section => {
                    section.style.display = (category === 'all' || section.dataset.category === category) ? 'block' : 'none';
                });
                toolCards.forEach(card => {
                    card.style.display = 'flex';
                });
            }
        });
    });


    // Category cards click handler
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            
            // Find and click the corresponding filter tab
            const filterTab = document.querySelector(`.filter-tab[data-category="${category}"]`);
            if (filterTab) {
                filterTab.click();
                
                // Scroll to tools section
                const toolsSection = document.querySelector(`.tools-section[data-category="${category}"]`);
                if (toolsSection) {
                    toolsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Add carousel functionality
    initCarousel();
});

function initCarousel() {
    const carousel = document.querySelector('.carousel-container');
    const prevBtn = document.querySelector('.carousel-arrow.prev');
    const nextBtn = document.querySelector('.carousel-arrow.next');

    prevBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: -300, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: 300, behavior: 'smooth' });
    });
}

function loadUserFavorites(user) {
    const db = firebase.firestore();
    db.collection('users').doc(user.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const favoriteToolsData = doc.data().favoriteToolsData || {};
                // Mark favorite tools
                Object.keys(favoriteToolsData).forEach(toolId => {
                    const toolCard = document.querySelector(`.tool-card[data-tool-id="${toolId}"]`);
                    if (toolCard) {
                        const favBtn = toolCard.querySelector('.favorite-btn');
                        if (favBtn) {
                            favBtn.classList.add('active');
                            favBtn.innerHTML = '<i class="fas fa-heart"></i>';
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error loading favorites:', error);
            showToast('error', 'Error loading favorites');
        });
}

function setupFavoriteButtons(user) {
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        // Generate and set tool ID if not already set
        if (!card.dataset.toolId) {
            const toolName = card.querySelector('h3').textContent;
            const toolId = toolName.toLowerCase().replace(/\s+/g, '-');
            card.dataset.toolId = toolId;
        }

        // Get tool URL
        const toolUrl = card.querySelector('.use-tool-btn').getAttribute('href') || '#';

        // Add favorite button if not exists
        if (!card.querySelector('.favorite-btn')) {
            const favBtn = document.createElement('button');
            favBtn.className = 'favorite-btn';
            favBtn.innerHTML = '<i class="far fa-heart"></i>';
            card.insertBefore(favBtn, card.firstChild);

            // Add click event
            favBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(card, user, toolUrl);
            });
        }
    });

    // Load existing favorites
    loadUserFavorites(user);
}


// Generate unique tool ID from tool info
function generateToolId(toolCard) {
    const toolName = toolCard.querySelector('h3').textContent;
    return toolName.toLowerCase().replace(/\s+/g, '-');
}

function handleFavoritesFilter() {
    const user = auth.currentUser;
    if (!user) {
        showToast('error', 'Please sign in to view favorites');
        return;
    }

    db.collection('users').doc(user.uid)
        .get()
        .then((doc) => {
            const toolsContainer = document.querySelector('.tools-container');
            
            // Hide any existing empty state first
            const existingEmptyState = document.querySelector('.empty-favorites');
            if (existingEmptyState) {
                existingEmptyState.style.display = 'none';
            }

            if (doc.exists && doc.data().favoriteToolsData && Object.keys(doc.data().favoriteToolsData).length > 0) {
                const favoriteTools = doc.data().favoriteToolsData;
                const favoriteIds = Object.keys(favoriteTools);

                document.querySelectorAll('.tools-section').forEach(section => {
                    section.style.display = 'block';
                    const cards = section.querySelectorAll('.tool-card');
                    let hasVisibleCards = false;

                    cards.forEach(card => {
                        const isFavorite = favoriteIds.includes(card.dataset.toolId);
                        card.style.display = isFavorite ? 'flex' : 'none';
                        if (isFavorite) hasVisibleCards = true;
                    });

                    section.style.display = hasVisibleCards ? 'block' : 'none';
                });

                // Hide empty state if it exists
                if (existingEmptyState) {
                    existingEmptyState.style.display = 'none';
                }
            } else {
                // Hide all sections
                document.querySelectorAll('.tools-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show empty state
                let emptyState = existingEmptyState;
                if (!emptyState) {
                    emptyState = document.createElement('div');
                    emptyState.className = 'empty-favorites';
                    emptyState.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <h3>No Favorite Tools Yet</h3>
                            <p>Click the heart icon on any tool to add it to your favorites</p>
                        </div>
                    `;
                    toolsContainer.appendChild(emptyState);
                }
                emptyState.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading favorites:', error);
            showToast('error', 'Error loading favorites');
        });
}

function toggleFavorite(toolCard, user, toolUrl) {
    if (!user) {
        showToast('error', 'Please sign in to save favorites');
        return;
    }

    const favBtn = toolCard.querySelector('.favorite-btn');
    const toolId = toolCard.dataset.toolId;
    const toolName = toolCard.querySelector('h3').textContent;
    const toolDesc = toolCard.querySelector('p').textContent;
    const toolIcon = toolCard.querySelector('.tool-icon i').className;
    const toolMeta = toolCard.querySelector('.tool-meta')?.innerHTML || '';

    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        let favoriteToolsData = doc.exists ? (doc.data().favoriteToolsData || {}) : {};

        if (favoriteToolsData[toolId]) {
            delete favoriteToolsData[toolId];
            favBtn.classList.remove('active');
            favBtn.innerHTML = '<i class="far fa-heart"></i>';
            showToast('success', 'Removed from favorites');
        } else {
            favoriteToolsData[toolId] = {
                name: toolName,
                description: toolDesc,
                icon: toolIcon,
                meta: toolMeta,
                url: toolUrl,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            favBtn.classList.add('active');
            favBtn.innerHTML = '<i class="fas fa-heart"></i>';
            showToast('success', 'Added to favorites');
        }

        userRef.set({ favoriteToolsData }, { merge: true })
            .then(() => {
                const event = new CustomEvent('favoritesUpdated', {
                    detail: { favoriteToolsData }
                });
                window.dispatchEvent(event);
            })
            .catch(error => {
                console.error('Error updating favorites:', error);
                showToast('error', 'Error updating favorites');
                favBtn.classList.toggle('active');
                favBtn.innerHTML = favBtn.classList.contains('active') ? 
                    '<i class="fas fa-heart"></i>' : 
                    '<i class="far fa-heart"></i>';
            });
    });
}


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
