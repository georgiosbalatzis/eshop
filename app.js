// Application State Management
const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
    categories: new Set(),
    darkMode: localStorage.getItem('darkMode') === 'true'
};

// Comprehensive Error Logging
function logError(message, error = null) {
    console.error(`[F1 Gear App Error] ${message}`);
    if (error) {
        console.error(error);
    }

    // Display error to user
    const errorContainer = document.getElementById('error-container') ||
        (() => {
            const el = document.createElement('div');
            el.id = 'error-container';
            el.className = 'fixed top-0 left-0 right-0 bg-racing-red text-racing-white p-4 text-center z-50';
            document.body.prepend(el);
            return el;
        })();

    errorContainer.innerHTML = `
        <strong>Error:</strong> ${message}<br>
        ${error ? `<small>${error.toString()}</small>` : ''}
    `;
    errorContainer.classList.remove('hidden');
}

// Dark Mode Management
function initDarkMode() {
    try {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;

        if (!darkModeToggle) {
            console.warn('Dark mode toggle button not found');
            return;
        }

        // Initial dark mode state
        if (state.darkMode) {
            body.classList.add('dark');
        }

        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark');
            state.darkMode = body.classList.contains('dark');
            localStorage.setItem('darkMode', state.darkMode);
        });
    } catch (error) {
        logError('Failed to initialize dark mode', error);
    }
}

// Advanced CSV Row Parsing
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result.map(field =>
        field.startsWith('"') && field.endsWith('"')
            ? field.slice(1, -1)
            : field
    );
}

// Fetch and Parse CSV Products
async function fetchProducts() {
    try {
        console.log('Attempting to fetch products from:', GOOGLE_SHEET_CSV_URL);

        const response = await fetch(GOOGLE_SHEET_CSV_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        console.log('Raw CSV content (first 500 chars):', csvText.slice(0, 500));

        const rows = csvText.trim().split('\n');
        console.log('Total rows:', rows.length);
        console.log('Header row:', rows[0]);

        // Validate header row
        const headers = parseCSVRow(rows[0]);
        console.log('Parsed headers:', headers);

        // Check if we have enough columns
        if (headers.length < 6) {
            throw new Error('Invalid CSV format: Not enough columns');
        }

        // Parse data rows
        state.products = rows.slice(1).map((row, index) => {
            try {
                const fields = parseCSVRow(row);

                console.log(`Parsing row ${index + 2}:`, fields);

                // Ensure we have enough fields
                if (fields.length < 6) {
                    console.warn(`Skipping row ${index + 2} - insufficient fields`);
                    return null;
                }

                return {
                    id: fields[0] || `product-${index}`,
                    name: fields[1] || 'Unnamed F1 Gear',
                    price: parseFloat(fields[2] || 0),
                    imageUrl: fields[3] || 'https://via.placeholder.com/300',
                    category: fields[4] || 'Uncategorized',
                    description: fields[5] || 'No description available',
                    details: {
                        material: fields[6] || 'N/A',
                        size: fields[7] || 'N/A',
                        color: fields[8] || 'N/A'
                    }
                };
            } catch (parseError) {
                console.error(`Error parsing row ${index + 2}:`, parseError);
                return null;
            }
        }).filter(p => p !== null);

        console.log('Parsed Products:', state.products);

        // Validate parsed products
        if (state.products.length === 0) {
            throw new Error('No valid products found in the CSV');
        }

        // Populate categories
        state.categories.clear();
        state.products.forEach(product =>
            state.categories.add(product.category)
        );

        // Render categories and products
        renderCategories();
        renderProducts();

        return state.products;
    } catch (error) {
        logError('Failed to load F1 gear', error);

        // Render error message in product grid
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center text-racing-red">
                    <h2 class="text-2xl font-bold mb-4">Failed to Load Products</h2>
                    <p class="mb-4">${error.message}</p>
                    <button onclick="fetchProducts()" class="bg-racing-green text-racing-white px-4 py-2 rounded hover:bg-gold-accent transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }

        throw error; // Re-throw to allow further handling
    }
}

// Render Categories
function renderCategories() {
    try {
        const filterContainer = document.getElementById('filterContainer');

        if (!filterContainer) {
            throw new Error('Filter container not found');
        }

        filterContainer.innerHTML = '';

        state.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.innerHTML = `
                <label class="flex items-center text-racing-white cursor-pointer group">
                    <input 
                        type="checkbox" 
                        name="category" 
                        value="${category}" 
                        class="mr-2 category-filter accent-gold-accent"
                    >
                    <span class="group-hover:text-gold-accent transition-colors">${category}</span>
                </label>
            `;
            filterContainer.appendChild(categoryDiv);
        });

        // Add event listeners to category filters
        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', filterProducts);
        });
    } catch (error) {
        logError('Failed to render categories', error);
    }
}

// Search Functionality
function setupSearch() {
    try {
        const searchInput = document.getElementById('product-search');

        if (!searchInput) {
            throw new Error('Search input not found');
        }

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const filteredProducts = state.products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );

            renderProducts(filteredProducts);
        });
    } catch (error) {
        logError('Failed to setup search', error);
    }
}

// Filter Products
function filterProducts() {
    try {
        const selectedCategories = Array.from(
            document.querySelectorAll('.category-filter:checked')
        ).map(el => el.value);

        const filteredProducts = selectedCategories.length
            ? state.products.filter(product =>
                selectedCategories.includes(product.category)
            )
            : state.products;

        renderProducts(filteredProducts);
    } catch (error) {
        logError('Failed to filter products', error);
    }
}

// Render Products
// Update the renderProducts function in app.js to be more mobile-friendly

function renderProducts(productsToRender = state.products) {
    try {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            throw new Error('Product grid not found');
        }

        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-pit-lane-gray mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p class="text-2xl text-racing-green font-bold">No F1 Gear Found</p>
                    <p class="text-lg mt-2 text-asphalt-gray">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = `
                product-card
                bg-racing-white 
                rounded-lg 
                overflow-hidden 
                shadow-lg 
                border
                hover:border-gold-accent
                relative
                transition-all
                duration-300
                flex
                flex-col
            `;

            // Check if product is in wishlist
            const isInWishlist = state.wishlist.some(item => item.id === product.id);

            // Mobile-optimized product card
            productCard.innerHTML = `
                <div class="relative group">
                    <a href="product-details.html?id=${product.id}" class="block">
                        <img 
                            src="${product.imageUrl}" 
                            alt="${product.name}" 
                            class="w-full h-48 md:h-40 object-cover group-hover:brightness-105 transition-all duration-300"
                            loading="lazy"
                        >
                    </a>
                    <div class="absolute top-0 left-0 w-full h-1 bg-racing-green"></div>
                    <button 
                        class="wishlist-toggle absolute top-2 right-2 ${isInWishlist ? 'text-racing-red' : 'text-pit-lane-gray'} hover:text-racing-red transition-colors p-2"
                        data-product-id="${product.id}"
                        onclick="toggleWishlist('${product.id}')"
                        aria-label="${isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${isInWishlist ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <div class="absolute bottom-0 left-0 w-full px-3 py-2 bg-gradient-to-t from-carbon-gray to-transparent">
                        <span class="text-white text-xs md:text-sm font-medium rounded-full bg-racing-green px-2 py-1">${product.category}</span>
                    </div>
                </div>
                <div class="p-3 md:p-4 flex-grow flex flex-col">
                    <a href="product-details.html?id=${product.id}" class="block">
                        <h3 class="text-racing-green font-bold text-base md:text-lg mb-1 line-clamp-1">${product.name}</h3>
                    </a>
                    <p class="text-asphalt-gray text-xs md:text-sm mb-2 line-clamp-2 flex-grow">${product.description.substring(0, 75)}${product.description.length > 75 ? '...' : ''}</p>
                    
                    <div class="flex justify-between items-center mt-auto pt-2 border-t border-pit-lane-gray border-opacity-20">
                        <span class="text-gold-accent font-bold text-base md:text-lg">$${product.price.toFixed(2)}</span>
                        <button 
                            onclick="addToCart('${product.id}')" 
                            class="
                                bg-racing-green 
                                text-racing-white 
                                px-3
                                py-1.5
                                rounded 
                                hover:bg-gold-accent 
                                transition-colors
                                text-xs
                                md:text-sm
                                font-medium
                            "
                            aria-label="Add ${product.name} to cart"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    } catch (error) {
        logError('Failed to render products', error);
    }
}

// Add to cart with enhanced notification and global counter update
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);

    if (!product) {
        logError(`Product with ID ${productId} not found`);
        return;
    }

    // Check if product already in cart
    const existingProductIndex = state.cart.findIndex(item => item.id === productId);

    if (existingProductIndex > -1) {
        // Increment quantity
        state.cart[existingProductIndex].quantity += 1;
    } else {
        // Add new product
        state.cart.push({ ...product, quantity: 1 });
    }

    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(state.cart));

    // Update cart count - both specific element and global counters
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
        cartCountEl.classList.toggle('hidden', totalItems === 0);
    }

    // Call global counter update if available
    if (typeof updateGlobalCartCounter === 'function') {
        updateGlobalCartCounter();
    }

    // Show notification if function is available
    if (typeof showNotification === 'function') {
        showNotification(`Added ${product.name} to cart`, 'success');
    } else {
        // Fallback: Console log
        console.log(`Added ${product.name} to cart`);
    }
}

// Add to cart with custom quantity
function addToCartWithQuantity(productId, quantity = 1) {
    const product = state.products.find(p => p.id === productId);

    if (!product) {
        if (typeof showNotification === 'function') {
            showNotification(`Product not found`, 'error');
        }
        return;
    }

    // Check if product already in cart
    const existingProductIndex = state.cart.findIndex(item => item.id === productId);

    if (existingProductIndex > -1) {
        // Update quantity
        state.cart[existingProductIndex].quantity += quantity;
    } else {
        // Add new product
        state.cart.push({ ...product, quantity: quantity });
    }

    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(state.cart));

    // Call global counter update if available
    if (typeof updateGlobalCartCounter === 'function') {
        updateGlobalCartCounter();
    }

    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`Added ${quantity} ${product.name} to cart`, 'success');
    }
}

// Remove from cart function
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Save product info before removing for notification
    const removedProduct = cart[index];

    // Remove item
    cart.splice(index, 1);

    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update UI
    if (typeof renderCart === 'function') {
        renderCart();
    }

    // Call global counter update if available
    if (typeof updateGlobalCartCounter === 'function') {
        updateGlobalCartCounter();
    }

    // Show notification if function is available
    if (typeof showNotification === 'function' && removedProduct) {
        showNotification(`Removed ${removedProduct.name} from cart`, 'info');
    }
}

// Toggle wishlist function
function toggleWishlist(productId) {
    const product = state.products.find(p => p.id === productId);

    if (!product) {
        logError(`Product with ID ${productId} not found`);
        return;
    }

    // Check if product already in wishlist
    const isInWishlist = state.wishlist.some(item => item.id === productId);

    if (isInWishlist) {
        // Remove from wishlist
        state.wishlist = state.wishlist.filter(item => item.id !== productId);
    } else {
        // Add to wishlist
        state.wishlist.push(product);
    }

    // Update localStorage
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));

    // Update wishlist icon on product cards
    document.querySelectorAll(`.wishlist-toggle[data-product-id="${productId}"]`).forEach(btn => {
        const svg = btn.querySelector('svg');

        if (!isInWishlist) {
            btn.classList.add('text-racing-red');
            btn.classList.remove('text-pit-lane-gray');
            svg.setAttribute('fill', 'currentColor');
        } else {
            btn.classList.remove('text-racing-red');
            btn.classList.add('text-pit-lane-gray');
            svg.setAttribute('fill', 'none');
        }
    });

    // Update wishlist count
    const wishlistCountEl = document.getElementById('wishlist-count');
    if (wishlistCountEl) {
        wishlistCountEl.textContent = state.wishlist.length;
        wishlistCountEl.classList.toggle('hidden', state.wishlist.length === 0);
    }

    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(
            isInWishlist
                ? `Removed ${product.name} from wishlist`
                : `Added ${product.name} to wishlist`,
            isInWishlist ? 'info' : 'success'
        );
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');

    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `
        p-4 mb-3 rounded-lg shadow-lg flex items-center justify-between
        ${type === 'success' ? 'bg-racing-green text-racing-white' : ''}
        ${type === 'error' ? 'bg-racing-red text-racing-white' : ''}
        ${type === 'info' ? 'bg-carbon-gray text-racing-white' : ''}
        transform transition-all duration-300 translate-x-full opacity-0
    `;

    notification.innerHTML = `
        <div class="flex items-center">
            ${type === 'success' ? `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
            ` : ''}
            ${type === 'error' ? `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            ` : ''}
            ${type === 'info' ? `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clip-rule="evenodd" />
                </svg>
            ` : ''}
            <span>${message}</span>
        </div>
        <button class="ml-4 text-sm hover:text-gold-accent focus:outline-none" onclick="this.parentNode.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Global Cart Counter
function updateGlobalCartCounter() {
    // Get all cart count elements across pages
    const cartCountEls = document.querySelectorAll('.cart-count');

    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Calculate total items in cart
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update all cart count elements
    cartCountEls.forEach(el => {
        el.textContent = totalItems;

        // Show/hide based on count
        if (totalItems > 0) {
            el.classList.remove('hidden');

            // Optionally add a quick animation to draw attention
            el.classList.add('cart-pulse');
            setTimeout(() => {
                el.classList.remove('cart-pulse');
            }, 300);
        } else {
            el.classList.add('hidden');
        }
    });
}

// Initialize Back-to-Top Button
function initBackToTop() {
    // Create the button if it doesn't exist
    if (!document.getElementById('back-to-top')) {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.id = 'back-to-top';
        backToTopBtn.className = 'fixed bottom-6 right-6 bg-racing-green text-racing-white p-3 rounded-full shadow-lg opacity-0 transition-all duration-300 hover:bg-gold-accent z-50 transform translate-y-10';
        backToTopBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        `;

        document.body.appendChild(backToTopBtn);

        // Add click event
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.remove('opacity-0', 'translate-y-10');
            } else {
                backToTopBtn.classList.add('opacity-0', 'translate-y-10');
            }
        });
    }
}

// Create recently viewed section
function renderRecentlyViewed() {
    const container = document.getElementById('recently-viewed-container');
    if (!container) return;

    // Get recently viewed from localStorage
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    if (recentlyViewed.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-racing-green mb-4">Recently Viewed</h2>
        <div class="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
            ${recentlyViewed.map(product => `
                <a href="product-details.html?id=${product.id}" class="block">
                    <div class="bg-racing-white rounded-lg overflow-hidden shadow border border-pit-lane-gray hover:border-gold-accent transition-all">
                        <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-32 object-cover">
                        <div class="p-2">
                            <h3 class="text-racing-green font-medium text-sm">${product.name}</h3>
                            <p class="text-gold-accent font-bold">$${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                </a>
            `).join('')}
        </div>
    `;
}

// Add to recently viewed
function addToRecentlyViewed(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    // Get current recently viewed
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    // Remove product if already in list
    recentlyViewed = recentlyViewed.filter(p => p.id !== productId);

    // Add to front of array
    recentlyViewed.unshift(product);

    // Keep only the 5 most recent
    recentlyViewed = recentlyViewed.slice(0, 5);

    // Save back to localStorage
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));

    // Render if on a page with recently viewed section
    renderRecentlyViewed();
}

// Add this code to app.js to enhance mobile interactions

// Mobile Interaction Enhancements
function initMobileOptimizations() {
    // Only run these optimizations on mobile devices
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // Add touch-friendly class to the body
    document.body.classList.add('touch-device');

    // Prevent zooming on input focus (iOS)
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    }

    // Add sticky cart total on cart page
    if (window.location.pathname.includes('cart.html')) {
        createStickyCartTotal();
    }

    // Improve tap targets
    enlargeTapTargets();

    // Optimize scrolling
    improveScrollPerformance();

    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
}

// Create sticky cart total for mobile devices
function createStickyCartTotal() {
    const cartTotal = document.getElementById('cartTotal');
    if (!cartTotal) return;

    // Create sticky total
    const stickyTotal = document.createElement('div');
    stickyTotal.className = 'sticky-cart-total';
    stickyTotal.innerHTML = `
    <div class="total-text">Total:</div>
    <div class="total-amount">${cartTotal.textContent}</div>
  `;

    // Check if mobile navigation is present
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        stickyTotal.classList.add('with-mobile-nav');
    }

    document.body.appendChild(stickyTotal);

    // Update sticky total when main total changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                stickyTotal.querySelector('.total-amount').textContent = cartTotal.textContent;
            }
        });
    });

    observer.observe(cartTotal, {
        characterData: true,
        childList: true,
        subtree: true
    });

    // Hide when scrolling up, show when scrolling down
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 300) {
            // Scrolling down
            stickyTotal.classList.remove('hidden');
        } else if (scrollTop < lastScrollTop && scrollTop < document.body.scrollHeight - window.innerHeight - 100) {
            // Scrolling up (but not at bottom)
            stickyTotal.classList.add('hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
}

// Enlarge tap targets for better mobile usability
function enlargeTapTargets() {
    // Make all buttons at least 44x44px (Apple's recommended minimum)
    const smallButtons = document.querySelectorAll('button, .btn, [role="button"]');
    smallButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
            button.style.minWidth = '44px';
            button.style.minHeight = '44px';

            // Add padding to maintain layout
            const computedStyle = window.getComputedStyle(button);
            const currentPaddingX = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
            const currentPaddingY = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);

            if (rect.width < 44 && currentPaddingX < 20) {
                button.style.paddingLeft = '10px';
                button.style.paddingRight = '10px';
            }

            if (rect.height < 44 && currentPaddingY < 20) {
                button.style.paddingTop = '10px';
                button.style.paddingBottom = '10px';
            }
        }
    });

    // Add space between clickable elements
    const clickableElements = document.querySelectorAll('a, button, input[type="checkbox"], input[type="radio"], select');
    clickableElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (parseFloat(style.marginBottom) < 8) {
            element.style.marginBottom = '8px';
        }
    });
}

// Improve scroll performance on mobile
function improveScrollPerformance() {
    // Add will-change property to elements that animate on scroll
    const animatedElements = document.querySelectorAll('.product-card, .hero-section, img');
    animatedElements.forEach(element => {
        element.style.willChange = 'transform';
    });

    // Use passive event listeners for scroll events
    // Use passive event listeners for scroll events
    const scrollableElements = document.querySelectorAll('.overflow-auto, .overflow-y-auto');
    scrollableElements.forEach(element => {
        element.addEventListener('scroll', () => {}, { passive: true });
    });

    // Optimize images for mobile
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
        // Add lazy loading to images
        img.setAttribute('loading', 'lazy');

        // Add intrinsic size to reduce layout shifts
        if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
            const width = img.clientWidth;
            const height = img.clientHeight;
            if (width && height) {
                img.style.aspectRatio = `${width} / ${height}`;
            }
        }
    });
}

// Handle orientation changes on mobile devices
function handleOrientationChange() {
    // Force a repaint to fix iOS rendering issues
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger a reflow
    document.body.style.display = '';

    // Readjust the product grid
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        const orientation = (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';

        if (orientation === 'landscape') {
            // In landscape, show more items in a row
            productGrid.classList.remove('grid-cols-1');
            productGrid.classList.add('grid-cols-2');

            if (window.innerWidth > 640) {
                productGrid.classList.remove('grid-cols-2');
                productGrid.classList.add('grid-cols-3');
            }
        } else {
            // In portrait on small screens, show single column
            if (window.innerWidth < 480) {
                productGrid.classList.remove('grid-cols-2', 'grid-cols-3');
                productGrid.classList.add('grid-cols-1');
            }
        }
    }

    // Adjust the height of the recently viewed section
    adjustRecentlyViewedSection();
}

// Adjust the recently viewed section for mobile
function adjustRecentlyViewedSection() {
    const container = document.getElementById('recently-viewed-container');
    if (!container) return;

    const items = container.querySelectorAll('.grid > a');
    if (!items.length) return;

    // On very small screens, show fewer items with horizontal scroll
    if (window.innerWidth < 480) {
        const grid = container.querySelector('.grid');
        if (grid) {
            grid.classList.remove('grid');
            grid.classList.add('flex', 'overflow-x-auto', 'pb-4', 'space-x-3', 'snap-x');

            items.forEach(item => {
                item.classList.add('flex-shrink-0', 'w-40', 'snap-start');
            });
        }
    } else {
        // Revert to grid on larger screens
        const flex = container.querySelector('.flex');
        if (flex) {
            flex.classList.remove('flex', 'overflow-x-auto', 'pb-4', 'space-x-3', 'snap-x');
            flex.classList.add('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-4');

            items.forEach(item => {
                item.classList.remove('flex-shrink-0', 'w-40', 'snap-start');
            });
        }
    }
}

// Implement pull-to-refresh functionality for mobile
function setupPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        touchEndY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const pullDistance = touchEndY - touchStartY;
        const atTop = window.scrollY === 0;

        // If pulled down significantly while at the top of the page
        if (atTop && pullDistance > 100) {
            // Show refreshing indicator
            const refreshIndicator = document.createElement('div');
            refreshIndicator.className = 'refresh-indicator';
            refreshIndicator.innerHTML = `
        <div class="flex items-center justify-center py-4">
          <svg class="animate-spin h-6 w-6 text-racing-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="ml-2 text-racing-green">Refreshing...</span>
        </div>
      `;

            document.body.prepend(refreshIndicator);

            // Refresh content after a brief delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }, { passive: true });
}

// Add mobile-specific swipe gestures
function setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;

    // Setup swipe detection
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;

        // Minimum distance for a swipe
        if (Math.abs(swipeDistance) < 100) return;

        // Handle swipe on product cards
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const touchY = e.changedTouches[0].clientY;

            // Check if swipe happened over this card
            if (touchY >= rect.top && touchY <= rect.bottom) {
                if (swipeDistance > 0) {
                    // Swipe right: Add to wishlist
                    const productId = card.querySelector('[data-product-id]').dataset.productId;
                    toggleWishlist(productId);
                } else {
                    // Swipe left: Add to cart
                    const productId = card.querySelector('[data-product-id]').dataset.productId;
                    addToCart(productId);
                }
            }
        });

        // Handle swipe in cart page
        if (window.location.pathname.includes('cart.html')) {
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                const touchY = e.changedTouches[0].clientY;

                // Check if swipe happened over this item
                if (touchY >= rect.top && touchY <= rect.bottom) {
                    if (swipeDistance < 0) {
                        // Swipe left: Remove from cart
                        removeFromCart(index);
                    }
                }
            });
        }
    }
}

// Initialize all mobile optimizations
document.addEventListener('DOMContentLoaded', function() {
    // Only run mobile optimizations on actual mobile devices or small screens
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    if (isMobile) {
        initMobileOptimizations();
        setupPullToRefresh();
        setupSwipeGestures();

        // Add to the existing app initialization
        console.log('Mobile optimizations initialized');
    }
});

// Initialize Application
function initApp() {
    try {
        console.log('Initializing F1 Gear App');

        // Initialize dark mode
        initDarkMode();

        // Initialize back-to-top button
        initBackToTop();

        // Update global cart counter
        updateGlobalCartCounter();

        // Fetch and render products
        fetchProducts().then(() => {
            // Setup search after products are loaded
            setupSearch();

            // Add cart-pulse animation to style.css if not already there
            if (!document.querySelector('#cart-pulse-style')) {
                const style = document.createElement('style');
                style.id = 'cart-pulse-style';
                style.textContent = `
                  @keyframes cartPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                  }
                  .cart-pulse {
                    animation: cartPulse 0.3s ease-in-out;
                  }
                `;
                document.head.appendChild(style);
            }
        }).catch(error => {
            console.error('Product fetch failed during initialization', error);
        });

// Update cart counter when storage changes (for multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                updateGlobalCartCounter();
            }
        });

        console.log('F1 Gear App initialized');
    } catch (error) {
        logError('Failed to initialize F1 Gear App', error);
    }
}

// Mobile Filter Button Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile filter button
    createMobileFilterButton();

    // Create mobile filter panel
    createMobileFilterPanel();

    // Wrap main content for fixed footer
    setupFixedFooter();

    // Setup mobile filter functionality
    setupMobileFilter();
});

// Create mobile filter button
function createMobileFilterButton() {
    // Only create if it doesn't exist and we're on a page with product filters
    if (!document.getElementById('mobile-filter-button') && document.getElementById('categoryFilters')) {
        const filterButton = document.createElement('button');
        filterButton.id = 'mobile-filter-button';
        filterButton.setAttribute('aria-label', 'Open filters');
        filterButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    `;
        document.body.appendChild(filterButton);

        // Add click event
        filterButton.addEventListener('click', function() {
            const filterPanel = document.getElementById('mobile-filter-panel');
            if (filterPanel) {
                filterPanel.classList.add('active');
            }
        });
    }
}

// Create mobile filter panel
function createMobileFilterPanel() {
    // Only create if it doesn't exist and we're on a page with product filters
    if (!document.getElementById('mobile-filter-panel') && document.getElementById('categoryFilters')) {
        const filterPanel = document.createElement('div');
        filterPanel.id = 'mobile-filter-panel';

        // Get the original filter content
        const originalFilters = document.getElementById('categoryFilters');

        if (originalFilters) {
            // Create panel header
            const header = document.createElement('h3');
            header.innerHTML = `
        Filter Products
        <button class="close-button" aria-label="Close filters">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;

            // Create content container
            const content = document.createElement('div');
            content.className = 'mobile-filter-content';

            // Clone the filter content
            content.innerHTML = originalFilters.innerHTML;

            // Add header and content to panel
            filterPanel.appendChild(header);
            filterPanel.appendChild(content);

            // Add panel to body
            document.body.appendChild(filterPanel);

            // Add close functionality
            const closeButton = filterPanel.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    filterPanel.classList.remove('active');
                });
            }

            // Close panel when clicking outside
            document.addEventListener('click', function(event) {
                if (!filterPanel.contains(event.target) && event.target.id !== 'mobile-filter-button') {
                    filterPanel.classList.remove('active');
                }
            });
        }
    }
}

// Setup fixed footer and scrollable content
function setupFixedFooter() {
    // Check if it's already set up
    if (!document.getElementById('main-content')) {
        // Find all content between header and footer
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');

        if (header && footer) {
            // Create main content wrapper
            const mainContent = document.createElement('div');
            mainContent.id = 'main-content';

            // Get all elements between header and footer
            let currentNode = header.nextElementSibling;
            const nodesToMove = [];

            while (currentNode && currentNode !== footer) {
                nodesToMove.push(currentNode);
                currentNode = currentNode.nextElementSibling;
            }

            // Move them into the main content wrapper
            nodesToMove.forEach(node => {
                mainContent.appendChild(node);
            });

            // Insert main content wrapper between header and footer
            header.after(mainContent);
        }
    }
}

// Setup filter synchronization between desktop and mobile
function setupMobileFilter() {
    // Make sure filter changes in mobile panel affect the original filters and vice versa
    const mobileFilterPanel = document.getElementById('mobile-filter-panel');
    const originalFilters = document.getElementById('categoryFilters');

    if (mobileFilterPanel && originalFilters) {
        // Sync mobile filter checkboxes to desktop
        const mobileCheckboxes = mobileFilterPanel.querySelectorAll('input[type="checkbox"]');
        mobileCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Find corresponding desktop checkbox
                const desktopCheckbox = originalFilters.querySelector(`input[value="${this.value}"]`);
                if (desktopCheckbox) {
                    desktopCheckbox.checked = this.checked;

                    // Trigger change event to update products
                    const event = new Event('change');
                    desktopCheckbox.dispatchEvent(event);
                }
            });
        });

        // Sync search box if it exists
        const mobileSearch = mobileFilterPanel.querySelector('#product-search');
        const desktopSearch = originalFilters.querySelector('#product-search');

        if (mobileSearch && desktopSearch) {
            mobileSearch.addEventListener('input', function() {
                desktopSearch.value = this.value;

                // Trigger input event to update products
                const event = new Event('input');
                desktopSearch.dispatchEvent(event);
            });
        }
    }
}

// Update the existing filterProducts function to work with mobile filters
function enhanceFilterProducts() {
    // Only modify if the original function exists
    if (typeof window.filterProducts === 'function') {
        const originalFilterProducts = window.filterProducts;

        window.filterProducts = function() {
            // Call the original function
            originalFilterProducts.apply(this, arguments);

            // After filtering, update mobile filter counts if they exist
            updateMobileFilterCounts();
        }
    }
}

// Update filter counts in mobile panel
function updateMobileFilterCounts() {
    const mobileFilterPanel = document.getElementById('mobile-filter-panel');
    if (!mobileFilterPanel) return;

    const categoryLabels = mobileFilterPanel.querySelectorAll('label');
    categoryLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
            const category = checkbox.value;
            const count = countProductsByCategory(category);

            // Find or create the count span
            let countSpan = label.querySelector('.category-count');
            if (!countSpan) {
                countSpan = document.createElement('span');
                countSpan.className = 'category-count text-pit-lane-gray text-xs ml-2';
                label.appendChild(countSpan);
            }

            // Update the count
            countSpan.textContent = `(${count})`;
        }
    });
}

// Count products in each category
function countProductsByCategory(category) {
    // Access the products from the global state if available
    if (window.state && window.state.products) {
        return window.state.products.filter(product => product.category === category).length;
    }
    return 0;
}

// Call this function after filters and products are initialized
function initMobileFilters() {
    enhanceFilterProducts();
    updateMobileFilterCounts();
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);