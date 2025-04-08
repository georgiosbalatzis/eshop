// Cart functionality with quantity management
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Find existing product in cart
  const existingProductIndex = cart.findIndex(p => p.id === product.id);

  if (existingProductIndex > -1) {
    // If product exists, increment quantity
    cart[existingProductIndex].quantity =
        (cart[existingProductIndex].quantity || 1) + 1;
  } else {
    // Add new product with quantity
    cart.push({
      ...product,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartNotification();
  alert(`${product.name} added to cart. Quantity: ${cart[existingProductIndex > -1 ? existingProductIndex : cart.length - 1].quantity}`);
}

function updateCartNotification() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartNotification = document.getElementById('cart-notification');
  if (cartNotification) {
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    cartNotification.textContent = totalItems;
    cartNotification.classList.toggle('hidden', totalItems === 0);
  }
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
    updateTotalPrice();
    return;
  }

  const cartHTML = cart.map((p, index) => `
    <div class="flex justify-between items-center border-b p-4">
      <div class="flex items-center space-x-4">
        <img src="${p.image}" alt="${p.name}" class="w-16 h-16 object-cover rounded">
        <div>
          <strong>${p.name}</strong>
          <p>$${p.price.toFixed(2)}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button 
          onclick="updateQuantity(${index}, -1)" 
          class="bg-gray-200 px-2 py-1 rounded"
        >
          -
        </button>
        <span>${p.quantity || 1}</span>
        <button 
          onclick="updateQuantity(${index}, 1)" 
          class="bg-gray-200 px-2 py-1 rounded"
        >
          +
        </button>
        <button 
          onclick="removeFromCart(${index})" 
          class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  `).join('');

  cartContainer.innerHTML = cartHTML;
  updateTotalPrice();
  updateCartNotification();
}

function updateQuantity(index, change) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Update quantity
  cart[index].quantity = Math.max(1, (cart[index].quantity || 1) + change);

  // Remove if quantity is 0
  if (cart[index].quantity < 1) {
    cart.splice(index, 1);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function updateTotalPrice() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Update total price on cart and checkout pages
  const totalPriceElements = document.querySelectorAll('#total-price, #total-amount');
  totalPriceElements.forEach(el => {
    if (el) el.textContent = `Total: $${totalPrice.toFixed(2)}`;
  });
}

// Initialize cart notification and total price on load
document.addEventListener('DOMContentLoaded', () => {
  updateCartNotification();
  if (document.getElementById('cart')) {
    renderCart();
  }
});