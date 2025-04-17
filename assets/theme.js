class Theme {
  constructor() {
    this.init();
  }

  init() {
    this.initCart();
    this.initSearch();
    this.initProduct();
    this.initCollection();
    this.initHeader();
  }

  initCart() {
    const cart = document.querySelector('.cart');
    if (!cart) return;

    // Update cart item quantity
    cart.querySelectorAll('.cart__item-quantity-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        const input = button.parentElement.querySelector('input');
        const item = button.closest('.cart__item');
        const line = item.dataset.line;
        const quantity = parseInt(input.value) + (button.classList.contains('plus') ? 1 : -1);

        if (quantity < 1) return;

        try {
          const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              line,
              quantity
            })
          });

          const cart = await response.json();
          this.updateCart(cart);
        } catch (error) {
          console.error('Error updating cart:', error);
        }
      });
    });

    // Remove cart item
    cart.querySelectorAll('.cart__item-remove').forEach(button => {
      button.addEventListener('click', async (e) => {
        const item = button.closest('.cart__item');
        const line = item.dataset.line;

        try {
          const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              line,
              quantity: 0
            })
          });

          const cart = await response.json();
          this.updateCart(cart);
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });
    });
  }

  initSearch() {
    const search = document.querySelector('.search');
    if (!search) return;

    const input = search.querySelector('.search__input');
    const results = search.querySelector('.search__results');

    if (!input || !results) return;

    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const query = e.target.value.trim();
        if (query.length < 3) {
          results.innerHTML = '';
          return;
        }

        try {
          const response = await fetch(`/search/suggest.json?q=${query}&resources[type]=product&resources[limit]=4`);
          const data = await response.json();
          this.updateSearchResults(data);
        } catch (error) {
          console.error('Error fetching search results:', error);
        }
      }, 300);
    });
  }

  initProduct() {
    const product = document.querySelector('.product');
    if (!product) return;

    // Variant selection
    product.querySelectorAll('.product__variant-option input').forEach(input => {
      input.addEventListener('change', (e) => {
        const variantId = e.target.value;
        this.updateVariant(variantId);
      });
    });

    // Add to cart
    const addToCart = product.querySelector('.product__add-to-cart');
    if (addToCart) {
      addToCart.addEventListener('click', async (e) => {
        const variantId = product.querySelector('.product__variant-option input:checked')?.value;
        const quantity = parseInt(product.querySelector('.product__quantity-input')?.value || 1);

        if (!variantId) return;

        try {
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{
                id: variantId,
                quantity
              }]
            })
          });

          const cart = await response.json();
          this.updateCart(cart);
        } catch (error) {
          console.error('Error adding to cart:', error);
        }
      });
    }
  }

  initCollection() {
    const collection = document.querySelector('.collection');
    if (!collection) return;

    // Filter selection
    collection.querySelectorAll('.collection__filter').forEach(filter => {
      filter.addEventListener('click', (e) => {
        const value = filter.dataset.value;
        this.updateFilters(value);
      });
    });

    // Sort selection
    const sort = collection.querySelector('.collection__sort');
    if (sort) {
      sort.addEventListener('change', (e) => {
        const value = e.target.value;
        this.updateSort(value);
      });
    }
  }

  initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    // Mobile menu toggle
    const menuToggle = header.querySelector('.header__menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        header.classList.toggle('header--menu-open');
      });
    }

    // Cart toggle
    const cartToggle = header.querySelector('.header__cart-toggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', () => {
        document.body.classList.toggle('cart-open');
      });
    }
  }

  updateCart(cart) {
    // Update cart count
    const count = document.querySelector('.header__cart-count');
    if (count) {
      count.textContent = cart.item_count;
    }

    // Update cart drawer
    const drawer = document.querySelector('.cart-drawer');
    if (drawer) {
      drawer.innerHTML = this.renderCart(cart);
    }

    // Update cart page
    const cartPage = document.querySelector('.cart');
    if (cartPage) {
      cartPage.innerHTML = this.renderCart(cart);
    }
  }

  updateSearchResults(data) {
    const results = document.querySelector('.search__results');
    if (!results) return;

    results.innerHTML = this.renderSearchResults(data);
  }

  updateVariant(variantId) {
    const product = document.querySelector('.product');
    if (!product) return;

    // Update price
    const price = product.querySelector('.product__price');
    if (price) {
      price.textContent = this.formatMoney(variant.price);
    }

    // Update availability
    const addToCart = product.querySelector('.product__add-to-cart');
    if (addToCart) {
      addToCart.disabled = !variant.available;
      addToCart.textContent = variant.available ? 'Add to cart' : 'Sold out';
    }
  }

  updateFilters(value) {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', value);
    window.location.href = url.toString();
  }

  updateSort(value) {
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', value);
    window.location.href = url.toString();
  }

  renderCart(cart) {
    if (cart.item_count === 0) {
      return `
        <div class="cart__empty">
          <p>Your cart is empty</p>
          <a href="/" class="button button--primary">Continue shopping</a>
        </div>
      `;
    }

    return `
      <div class="cart__items">
        ${cart.items.map(item => `
          <div class="cart__item" data-line="${item.line}">
            <img class="cart__item-image" src="${item.image}" alt="${item.title}">
            <div class="cart__item-details">
              <h3 class="cart__item-title">${item.title}</h3>
              <p class="cart__item-variant">${item.variant_title}</p>
              <p class="cart__item-price">${this.formatMoney(item.price)}</p>
              <div class="cart__item-quantity">
                <button class="cart__item-quantity-button minus">-</button>
                <input type="number" value="${item.quantity}" min="1">
                <button class="cart__item-quantity-button plus">+</button>
              </div>
            </div>
            <button class="cart__item-remove">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="cart__footer">
        <p class="cart__subtotal">Subtotal: ${this.formatMoney(cart.total_price)}</p>
        <a href="/checkout" class="button button--primary">Checkout</a>
      </div>
    `;
  }

  renderSearchResults(data) {
    if (!data.resources.results.products.length) {
      return '<p>No results found</p>';
    }

    return `
      <div class="grid">
        ${data.resources.results.products.map(product => `
          <div class="card">
            <img class="card__image" src="${product.image}" alt="${product.title}">
            <div class="card__content">
              <h3 class="card__title">${product.title}</h3>
              <p class="card__price">${this.formatMoney(product.price)}</p>
              <a href="${product.url}" class="button button--primary">View product</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
  window.theme = new Theme();
}); 