function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Check if product is already in cart
  const existingProductIndex = cart.findIndex(p => p.id === product.id);

  if (existingProductIndex > -1) {
    // If product exists, you could increment quantity or prevent duplicate
    alert(product.name + " is already in your cart!");
    return;
  }

  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(product.name + " added to cart!");
}

function renderCart() {
  const cartContainer = document.getElementById('cart');

  if (!cartContainer) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <p class="text-xl">Your cart is empty</p>
        <a href="index.html" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Continue Shopping
        </a>
      </div>
    `;
    return;
  }

  const cartHTML = cart.map((p, index) => `
    <div class="flex justify-between items-center border-b p-4">
      <div>
        <strong>${p.name}</strong>
        <p>$${p.price.toFixed(2)}</p>
      </div>
      <button 
        onclick="removeFromCart(${index})" 
        class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
      >
        Remove
      </button>
    </div>
  `).join('');

  cartContainer.innerHTML = cartHTML;
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();  // Re-render cart after removing item

  // If on checkout page, update total
  if (window.location.pathname.includes('checkout.html')) {
    // This will be handled by checkout script
  }
}

// Call renderCart only on pages that have a cart container
if (document.getElementById('cart')) {
  renderCart();
}