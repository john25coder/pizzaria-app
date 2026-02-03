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

async function checkout() {
    if (cart.length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar o pedido.');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('bambinos_current_user') || 'null');

    if (!currentUser) {
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    // Calcular valores
    const subtotalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 8.0;
    const totalValue = subtotalValue + delivery;

    // Montar payload para API
    const payload = {
        customerId: currentUser.id || null,
        customer: {
            name: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address
        },
        items: cart.map(item => ({
            name: item.name,
            size: item.tamanho,
            flavors: item.sabores ? item.sabores.map(s => s.name) : [],
            border: item.borda,
            unitPrice: item.price,
            quantity: item.quantity
        })),
        deliveryFee: delivery,
        subtotal: subtotalValue,
        total: totalValue
    };

    try {
        console.log('📤 Enviando pedido para API:', payload);

        const response = await fetch('http://localhost:3333/api/pedidos/web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Erro ao enviar pedido. Tente novamente.');
            return;
        }

        const order = await response.json();

        console.log('✅ Pedido criado com sucesso:', order);

        alert(`✅ Pedido enviado com sucesso!

📦 Número do pedido: ${order.id}
💰 Total: R$ ${order.valorTotal.toFixed(2)}
📍 Endereço: ${currentUser.address}

Entraremos em contato em breve pelo telefone ${currentUser.phone}!`);

        // Limpar carrinho
        cart = [];
        updateCart();
        toggleCart();
    } catch (err) {
        console.error('❌ Erro ao conectar com servidor:', err);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3333');
    }
}

