// Shopping cart management
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.shipping = 5.99; // Fixed shipping cost
        this.taxRate = 0.08; // 8% tax rate
    }

    addToCart(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }

        this.saveCart();
        this.showAddedToCartMessage(product.name);
        app.updateCartCount();
    }

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        app.updateCartCount();
        this.updateCartDisplay();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            this.saveCart();
            app.updateCartCount();
            this.updateCartDisplay();
        }
    }

    calculateSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    calculateTax(subtotal) {
        return subtotal * this.taxRate;
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const tax = this.calculateTax(subtotal);
        return subtotal + tax + (this.items.length > 0 ? this.shipping : 0);
    }

    showAddedToCartMessage(productName) {
        const message = document.createElement('div');
        message.className = 'cart-notification';
        message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div class="notification-content">
                <p>${productName} added to cart!</p>
                <a href="cart.html">View Cart</a>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 300);
        }, 2000);
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const subtotalElement = document.getElementById('subtotal');
        const shippingElement = document.getElementById('shipping');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('cart-total-amount');
        
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="products.html" class="continue-shopping">Continue Shopping</a>
                </div>
            `;
            subtotalElement.textContent = '$0.00';
            shippingElement.textContent = '$0.00';
            taxElement.textContent = '$0.00';
            totalElement.textContent = '$0.00';
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p class="item-price">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="quantity-controls">
                        <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <p class="item-total">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="remove-item" onclick="cart.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');

        const subtotal = this.calculateSubtotal();
        const tax = this.calculateTax(subtotal);
        const total = this.calculateTotal();

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = this.items.length > 0 ? `$${this.shipping.toFixed(2)}` : '$0.00';
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }
}

// Initialize cart and display if on cart page
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new Cart();
    if (document.getElementById('cart-items')) {
        window.cart.updateCartDisplay();
    }
}); 