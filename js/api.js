// Product data fetching and management
class ProductAPI {
    async getProducts() {
        try {
            const response = await fetch('./data/products.json');
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    filterProducts(products, filters) {
        return products.filter(product => {
            // Category filter
            if (filters.category && filters.category !== 'all' && product.category !== filters.category) {
                return false;
            }
            
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                return product.name.toLowerCase().includes(searchTerm) ||
                       product.description.toLowerCase().includes(searchTerm);
            }
            
            return true;
        });
    }

    sortProducts(products, sortBy) {
        const sortedProducts = [...products];
        
        switch (sortBy) {
            case 'price-low':
                return sortedProducts.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sortedProducts.sort((a, b) => b.price - a.price);
            case 'name':
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return sortedProducts;
        }
    }
}

// Initialize products if on products page
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('products-grid')) {
        const api = new ProductAPI();
        const products = await api.getProducts();
        
        // Get URL parameters for initial filtering
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('category') || 'all';
        
        // Set initial category button as active
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            if (btn.dataset.category === initialCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Add event listeners for category buttons
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateProductDisplay(products, {
                    category: btn.dataset.category,
                    search: document.getElementById('search-input')?.value || '',
                    sort: document.getElementById('sort-select').value
                });
            });
        });

        // Initial display with filters
        updateProductDisplay(products, {
            category: initialCategory,
            search: '',
            sort: 'default'
        });

        // Add event listener for sort select
        document.getElementById('sort-select').addEventListener('change', (e) => {
            updateProductDisplay(products, {
                category: document.querySelector('.category-btn.active').dataset.category,
                search: document.getElementById('search-input')?.value || '',
                sort: e.target.value
            });
        });
    }
});

function updateProductDisplay(products, filters) {
    const api = new ProductAPI();
    let filteredProducts = api.filterProducts(products, filters);
    filteredProducts = api.sortProducts(filteredProducts, filters.sort);
    
    const productsGrid = document.getElementById('products-grid');
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-overlay">
                    <button class="quick-view-btn">
                        <i class="fas fa-eye"></i> Quick View
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    ${generateStarRating(product.rating || 4.5)}
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-description">${product.description}</p>
            </div>
        </div>
    `).join('');
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
    
    return `<div class="stars">${stars}</div>`;
}

// Export API for use in other modules
window.api = new ProductAPI(); 