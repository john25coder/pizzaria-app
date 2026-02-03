let cart = [];

function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio</div>';
        subtotal.textContent = 'R$ 0,00';
        total.textContent = 'R$ 8,00';
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.tamanho}</div>
        <div class="cart-item-size">Sabores: ${item.sabores ? item.sabores.map(s => s.name).join(', ') : 'N/A'}</div>
        <div class="cart-item-size" style="font-size: 11px; color: #666; margin-top: 4px;">
          Borda: ${item.borda}
        </div>
        <div class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
      </div>
      <div class="cart-controls">
        <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
        <div class="qty-display">${item.quantity}</div>
        <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
        <button class="btn-remove" onclick="removeFromCart(${index})">✕</button>
      </div>
    </div>
  `).join('');

    const subtotalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 8.00;
    const totalValue = subtotalValue + delivery;

    subtotal.textContent = `R$ ${subtotalValue.toFixed(2)}`;
    total.textContent = `R$ ${totalValue.toFixed(2)}`;
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        updateCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) {
        alert('Adicione itens ao carrinho');
        return;
    }
    alert('Pedido finalizado! Total: ' + document.getElementById('total').textContent);
    cart = [];
    updateCart();
    toggleCart();
}
