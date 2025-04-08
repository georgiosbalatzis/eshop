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
            el.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50';
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
                <div class="col-span-full text-center text-red-500">
                    <h2 class="text-2xl font-bold mb-4">Failed to Load Products</h2>
                    <p class="mb-4">${error.message}</p>
                    <button onclick="fetchProducts()" class="bg-brand-gold text-white px-4 py-2 rounded">
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
                <label class="flex items-center text-brand-white">
                    <input 
                        type="checkbox" 
                        name="category" 
                        value="${category}" 
                        class="mr-2 category-filter"
                    >
                    ${category}
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
function renderProducts(productsToRender = state.products) {
    try {
        const productGrid = document.getElementById('productGrid');

        if (!productGrid) {
            throw new Error('Product grid not found');
        }

        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center text-brand-dark-gray">
                    <p class="text-2xl">No F1 Gear Found</p>
                    <p class="text-lg mt-2">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = `
                product-card
                bg-brand-dark-gray 
                rounded-lg 
                overflow-hidden 
                shadow-lg 
                border 
                border-brand-light-gold
                relative
            `;

            productCard.innerHTML = `
                <img 
                    src="${product.imageUrl}" 
                    alt="${product.name}" 
                    class="w-full h-48 object-cover"
                >
                <div class="p-4">
                    <h3 class="text-brand-light-gold font-bold mb-2">${product.name}</h3>
                    <p class="text-brand-white mb-2">${product.category}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-brand-gold font-bold">$${product.price.toFixed(2)}</span>
                        <button 
                            onclick="addToCart('${product.id}')" 
                            class="
                                bg-brand-gold 
                                text-brand-white 
                                px-4 
                                py-2 
                                rounded 
                                hover:bg-brand-bronze 
                                transition
                            "
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

// Cart Management
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

    // Optional: Show notification
    console.log(`Added ${product.name} to cart`);
}

// Initialize Application
function initApp() {
    try {
        console.log('Initializing F1 Gear App');

        // Initialize dark mode
        initDarkMode();

        // Fetch and render products
        fetchProducts().then(() => {
            // Setup search after products are loaded
            setupSearch();
        }).catch(error => {
            console.error('Product fetch failed during initialization', error);
        });

        console.log('F1 Gear App initialized');
    } catch (error) {
        logError('Failed to initialize F1 Gear App', error);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);