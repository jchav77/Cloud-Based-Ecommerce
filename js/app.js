// Main application logic
document.addEventListener('DOMContentLoaded', async () => {
    // Update cart count in navigation
    updateCartCount();

    // Add event listener for checkout button if on cart page
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Load featured products if on home page
    const featuredGrid = document.querySelector('.featured-grid');
    if (featuredGrid) {
        await loadFeaturedProducts();
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});

async function loadFeaturedProducts() {
    try {
        const response = await fetch('./data/products.json');
        const data = await response.json();
        const featuredProducts = data.products.filter(product => product.featured);
        
        const featuredGrid = document.querySelector('.featured-grid');
        featuredGrid.innerHTML = featuredProducts.map(product => `
            <div class="featured-product-card" onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <button class="quick-view-btn">
                            <i class="fas fa-eye"></i> Quick View
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="description">${product.description}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
    }
}

function handleCheckout() {
    // Simple checkout handler - you would typically integrate with a payment processor here
    alert('Thank you for your purchase! This is where you would normally proceed to payment.');
    // Clear the cart after successful checkout
    localStorage.removeItem('cart');
    updateCartDisplay();
    updateCartCount();
}

function showProductDetails(product) {
    const modal = document.createElement('div');
    modal.className = 'product-modal';
    
    // Add stock and rating data to product
    product.inStock = true; // You can set this dynamically
    product.stockCount = 15; // You can set this dynamically
    product.rating = 4.5; // You can set this dynamically
    product.reviewCount = 121; // You can set this dynamically

    modal.innerHTML = `
        <div class="product-modal-content">
            <button class="close-modal">&times;</button>
            <div class="product-modal-layout">
                <div class="product-modal-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-modal-info">
                    <h2>${product.name}</h2>
                    <div class="product-rating">
                        ${generateStarRating(product.rating)}
                        <span class="rating-count">(${product.reviewCount} Reviews)</span>
                    </div>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <div class="product-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="fas ${product.inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${product.inStock ? 'In Stock' : 'Out of Stock'} 
                        ${product.inStock ? `(${product.stockCount} items left)` : ''}
                    </div>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="product-options">
                        <div class="size-selection">
                            <h3>Select Size</h3>
                            <div class="size-options">
                                ${generateSizeOptions(product.category)}
                            </div>
                        </div>
                        
                        <div class="quantity-selector">
                            <h3>Quantity</h3>
                            <div class="quantity-controls">
                                <button class="quantity-btn minus">-</button>
                                <input type="number" value="1" min="1" max="${product.stockCount}">
                                <button class="quantity-btn plus">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="add-to-cart-btn" onclick="addToCartFromModal(${JSON.stringify(product).replace(/"/g, '&quot;')}, this)">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="wishlist-btn">
                            <i class="far fa-heart"></i>
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Setup event handlers
    setupModalHandlers(modal, product);
}

function setupModalHandlers(modal, product) {
    // Close modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    };

    // Size selection
    const sizeButtons = modal.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.onclick = () => {
            sizeButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Quantity controls
    const quantityInput = modal.querySelector('input[type="number"]');
    const minusBtn = modal.querySelector('.minus');
    const plusBtn = modal.querySelector('.plus');

    minusBtn.onclick = () => {
        quantityInput.value = Math.max(1, parseInt(quantityInput.value) - 1);
    };
    plusBtn.onclick = () => {
        quantityInput.value = Math.min(product.stockCount, parseInt(quantityInput.value) + 1);
    };
}

function addToCartFromModal(product, button) {
    const modal = button.closest('.product-modal');
    const quantityInput = modal.querySelector('input[type="number"]');
    const sizeBtn = modal.querySelector('.size-btn.selected');
    
    if (!sizeBtn) {
        alert('Please select a size');
        return;
    }

    const quantity = parseInt(quantityInput.value);
    const size = sizeBtn.dataset.size;
    
    // Add the selected size and quantity to the product
    product.selectedSize = size;
    product.quantity = quantity;
    
    // Add to cart
    cart.addToCart(product);
    
    // Close the modal
    modal.querySelector('.close-modal').click();
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return `<div class="stars">${stars}</div><span class="rating-number">${rating}</span>`;
}

function generateSizeOptions(category) {
    const sizes = {
        shirts: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        shoes: ['7', '8', '9', '10', '11', '12'],
        dresses: ['XS', 'S', 'M', 'L', 'XL'],
        accessories: ['ONE SIZE']
    };

    return (sizes[category] || []).map(size => `
        <button class="size-btn" data-size="${size}">${size}</button>
    `).join('');
}

// Export functions for use in other modules
window.app = {
    updateCartCount,
    handleCheckout
};

// Test product data
const testProducts = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 29.99,
    category: "shirts",
    image: "https://via.placeholder.com/300"
  },
  {
    id: 2,
    name: "Running Shoes",
    price: 89.99,
    category: "shoes",
    image: "https://via.placeholder.com/300"
  }
];

// Function to render products
function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const template = document.getElementById('product-template');
  
  // Clear existing products
  grid.innerHTML = '';
  
  products.forEach(product => {
    const clone = template.content.cloneNode(true);
    
    // Update product details
    clone.querySelector('.product-image').src = product.image;
    clone.querySelector('.product-category').textContent = product.category;
    clone.querySelector('.product-title').textContent = product.name;
    clone.querySelector('.product-price').textContent = `$${product.price}`;
    
    grid.appendChild(clone);
  });
}

// Initialize products when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(testProducts);
}); 