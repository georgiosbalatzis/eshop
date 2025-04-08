let allProducts = []; // Global variable to store all products
let categories = new Set(); // To store unique categories

async function loadProducts() {
  try {
    console.log('Attempting to fetch products from:', GOOGLE_SHEET_CSV_URL);

    const res = await fetch(GOOGLE_SHEET_CSV_URL);

    // Check if the fetch was successful
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();
    console.log('Raw CSV content:', text.slice(0, 500)); // Log first 500 characters

    const rows = text.trim().split('\n');
    console.log('Number of rows:', rows.length);

    // Log header row
    console.log('Header row:', rows[0]);

    // Parse products with additional details
    allProducts = rows.slice(1).map((row, index) => {
      try {
        // Use careful parsing to handle potential commas in fields
        const fields = parseCSVRow(row);

        console.log(`Parsing row ${index + 2}:`, fields);

        return {
          id: fields[0] || `product-${index}`,
          name: fields[1] || 'Unnamed Product',
          price: parseFloat(fields[2] || 0),
          image: fields[3] || '',
          category: fields[4] || 'Uncategorized',
          description: fields[5] || 'No description available'
        };
      } catch (parseError) {
        console.error(`Error parsing row ${index + 2}:`, parseError);
        return null;
      }
    }).filter(p => p !== null);

    console.log('Parsed Products:', allProducts);

    // Populate categories dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categories.clear(); // Clear previous categories

      allProducts.forEach(p => categories.add(p.category));

      // Clear existing options except the first
      while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
      }

      // Add new categories
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
      });
    }

    renderProducts(allProducts);
    setupSearchAndFilter();
  } catch (error) {
    console.error('Complete error details:', error);
    handleProductLoadError();
  }
}

// Helper function to parse CSV rows, handling quoted fields and commas within quotes
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

function renderProducts(products) {
  const container = document.getElementById('products');
  const noResultsMessage = document.getElementById('no-results');

  if (!container) return;

  // Clear previous products
  container.innerHTML = '';

  if (products.length === 0) {
    noResultsMessage.classList.remove('hidden');
    return;
  }

  noResultsMessage.classList.add('hidden');

  products.forEach(p => {
    const div = document.createElement('div');
    div.className = "product-card border rounded-lg shadow-lg overflow-hidden";
    div.innerHTML = `
      <a href="product-details.html?id=${p.id}" class="block">
        <div class="relative overflow-hidden">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            class="w-full h-64 object-cover transition-transform duration-300 transform hover:scale-110"
          />
          <div class="absolute top-0 right-0 m-2 bg-gold text-white px-2 py-1 rounded-full text-xs">
            ${p.category}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-xl font-semibold text-black truncate">${p.name}</h3>
          <div class="flex justify-between items-center mt-2">
            <span class="text-lg font-bold text-gold">$ ${p.price.toFixed(2)}</span>
          </div>
        </div>
      </a>
      <div class="p-4 border-t">
        <button 
          onclick='addToCart(${JSON.stringify(p)})' 
          class="add-to-cart w-full py-2 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105"
        >
          Add to Cart
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

function setupSearchAndFilter() {
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('category-filter');

  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredProducts = allProducts.filter(product => {
      const matchesSearch = searchTerm === '' ||
          product.name.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm);

      const matchesCategory = selectedCategory === '' ||
          product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    renderProducts(filteredProducts);
  }

  // Add event listeners if elements exist
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
}

function handleProductLoadError() {
  const container = document.getElementById('products');
  const noResultsMessage = document.getElementById('no-results');

  if (container) {
    container.innerHTML = `
      <div class="col-span-full text-center text-red-500">
        <p class="text-2xl font-semibold">Pit Stop Interruption</p>
        <p class="text-lg mt-2">Failed to load racing merchandise</p>
        <button onclick="loadProducts()" class="mt-4 bg-gold text-white px-6 py-3 rounded-full hover:bg-light-gold">
          Retry Loading
        </button>
      </div>
    `;
  }

  if (noResultsMessage) {
    noResultsMessage.textContent = 'No racing items found';
    noResultsMessage.classList.remove('hidden');
  }
}

function getProductDetails(productId) {
  return allProducts.find(p => p.id === productId);
}

function renderProductDetails() {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const productDetailsContainer = document.getElementById('product-details');

  if (!productDetailsContainer) return;

  // Ensure products are loaded first
  if (allProducts.length === 0) {
    loadProducts().then(() => {
      renderProductDetailsContent(productId, productDetailsContainer);
    });
  } else {
    renderProductDetailsContent(productId, productDetailsContainer);
  }
}

// Previous renderProductDetailsContent function remains the same as in the last implementation

// Only call loadProducts if on the index page
if (document.getElementById('products')) {
  loadProducts();
}

// Product details page initialization
if (document.getElementById('product-details')) {
  renderProductDetails();
}