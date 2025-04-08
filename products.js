async function loadProducts() {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    const text = await res.text();
    const rows = text.trim().split('\n').slice(1);
    const products = rows.map(row => {
      const [id, name, price, image] = row.split(',');
      return {
        id,
        name,
        price: parseFloat(price),
        image
      };
    });

    const container = document.getElementById('products');
    if (!container) return;

    products.forEach(p => {
      const div = document.createElement('div');
      div.className = "border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow";
      div.innerHTML = `
        <img 
          src="${p.image}" 
          alt="${p.name}" 
          class="w-full h-48 object-cover"
        />
        <div class="p-4">
          <h3 class="text-lg font-semibold">${p.name}</h3>
          <p class="text-gray-600">$ ${p.price.toFixed(2)}</p>
          <button 
            onclick='addToCart(${JSON.stringify(p)})' 
            class="mt-2 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add to Cart
          </button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    const container = document.getElementById('products');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center text-red-500">
          <p>Unable to load products. Please try again later.</p>
        </div>
      `;
    }
  }
}

// Only call loadProducts if on the index page
if (document.getElementById('products')) {
  loadProducts();
}