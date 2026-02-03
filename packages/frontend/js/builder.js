let customPizzaBuilder = null;

// ETAPA 1: Selecionar Tamanho
function renderTamanhosSelection() {
    const container = document.getElementById('pizzaBuilderView');
    container.innerHTML = `
    <div class="builder-section">
      <h3 style="color: var(--primary-dark); text-align: center; margin-bottom: 30px;">
        1️⃣ Escolha o Tamanho da Pizza
      </h3>
      <div class="tamanhos-grid">
        ${tamanhos.map(tamanho => `
          <button class="tamanho-btn" onclick="selectTamanho('${tamanho.id}', ${tamanho.maxSabores})">
            <div class="tamanho-name">${tamanho.name}</div>
            <div class="tamanho-info">até ${tamanho.maxSabores} sabor${tamanho.maxSabores > 1 ? 'es' : ''}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// ETAPA 2: Selecionar Sabores
function selectTamanho(tamanhoId, maxSabores) {
    customPizzaBuilder = {
        tamanho: tamanhoId,
        maxSabores: maxSabores,
        sabores: [],
        borda: 'nenhuma',
        activeTab: 'classicas'
    };
    renderSaboresSelection();
}

function renderSaboresSelection() {
    const container = document.getElementById('pizzaBuilderView');
    container.innerHTML = `
    <div class="builder-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="color: var(--primary-dark);">
          2️⃣ Escolha os Sabores (${customPizzaBuilder.sabores.length}/${customPizzaBuilder.maxSabores})
        </h3>
        <button class="btn-back" onclick="renderTamanhosSelection()">← Voltar</button>
      </div>
      <div class="sabores-tabs">
        <button class="sabor-tab ${customPizzaBuilder.activeTab === 'classicas' ? 'active' : ''}" 
                onclick="changeTab('classicas')">🍕 Clássicas</button>
        <button class="sabor-tab ${customPizzaBuilder.activeTab === 'casa' ? 'active' : ''}" 
                onclick="changeTab('casa')">🏠 Da Casa</button>
        <button class="sabor-tab ${customPizzaBuilder.activeTab === 'premium' ? 'active' : ''}" 
                onclick="changeTab('premium')">👑 Premium</button>
        <button class="sabor-tab ${customPizzaBuilder.activeTab === 'doces' ? 'active' : ''}" 
                onclick="changeTab('doces')">🍰 Doces</button>
      </div>
      <div class="sabores-grid" id="saboresGrid"></div>
      <div style="margin-top: 30px; text-align: center;">
        <button class="btn-continue" onclick="renderBordasSelection()" 
                ${customPizzaBuilder.sabores.length === 0 ? 'disabled' : ''}>
          Continuar para Bordas →
        </button>
      </div>
    </div>
  `;
    displaySaboresByTab();
}

function changeTab(tab) {
    customPizzaBuilder.activeTab = tab;
    renderSaboresSelection();
}

function displaySaboresByTab() {
    const saboresGrid = document.getElementById('saboresGrid');
    const tamanhoId = customPizzaBuilder.tamanho;
    const activeTab = customPizzaBuilder.activeTab;

    const tabMap = {
        classicas: { key: 'classicas', data: saboresData.classicas },
        casa: { key: 'casa', data: saboresData.casa },
        premium: { key: 'premium', data: saboresData.premium },
        doces: { key: 'doces', data: saboresData.doces }
    };

    const tabInfo = tabMap[activeTab];
    const precoCategoria = tabelaPrecos[tamanhoId][tabInfo.key];

    let html = `
    <div style="grid-column: 1 / -1; margin-bottom: 15px;">
      <div style="color: var(--primary-dark); font-size: 15px; font-weight: bold; text-align: center; padding: 10px; background-color: var(--bg-light); border-radius: 4px;">
        Preço: R$ ${precoCategoria.toFixed(2)}
      </div>
    </div>
  `;

    tabInfo.data.forEach(sabor => {
        const isSelected = customPizzaBuilder.sabores.some(s => s.id === sabor.id);
        html += `
      <div class="sabor-card ${isSelected ? 'selected' : ''}" 
           onclick="toggleSabor(${sabor.id}, '${sabor.name}', '${sabor.categoria}')">
        <div class="sabor-name">${sabor.name}</div>
        ${isSelected ? '<div class="sabor-check">✓</div>' : ''}
      </div>
    `;
    });

    saboresGrid.innerHTML = html;
}

function toggleSabor(id, name, categoria) {
    const index = customPizzaBuilder.sabores.findIndex(s => s.id === id);

    if (index > -1) {
        customPizzaBuilder.sabores.splice(index, 1);
    } else {
        if (customPizzaBuilder.sabores.length < customPizzaBuilder.maxSabores) {
            customPizzaBuilder.sabores.push({ id, name, categoria });
        } else {
            showNotification('Máximo de sabores atingido!');
            return;
        }
    }

    renderSaboresSelection();
}

// ETAPA 3: Selecionar Borda
function renderBordasSelection() {
    const container = document.getElementById('pizzaBuilderView');
    container.innerHTML = `
    <div class="builder-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h3 style="color: var(--primary-dark);">
          3️⃣ Escolha a Borda
        </h3>
        <button class="btn-back" onclick="renderSaboresSelection()">← Voltar</button>
      </div>
      <div class="bordas-grid">
        ${bordas.map(borda => {
        const isSelected = customPizzaBuilder.borda === borda.id;
        return `
            <div class="borda-card ${isSelected ? 'selected' : ''}" 
                 onclick="selectBorda('${borda.id}')">
              <div class="borda-name">${borda.name}</div>
              <div class="borda-price">R$ ${borda.price.toFixed(2)}</div>
              ${isSelected ? '<div class="borda-check">✓</div>' : ''}
            </div>
          `;
    }).join('')}
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <button class="btn-finalize" onclick="finalizePizza()">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `;
}

function selectBorda(bordaId) {
    customPizzaBuilder.borda = bordaId;
    renderBordasSelection();
}

function finalizePizza() {
    const tamanho = tamanhos.find(t => t.id === customPizzaBuilder.tamanho);
    const borda = bordas.find(b => b.id === customPizzaBuilder.borda);

    let categoriaFinal = 'classicas';

    for (const sabor of customPizzaBuilder.sabores) {
        if (sabor.categoria === 'Premium') {
            categoriaFinal = 'premium';
            break;
        } else if (sabor.categoria === 'Da Casa') {
            categoriaFinal = 'casa';
        } else if (sabor.categoria === 'Doces' && categoriaFinal === 'classicas') {
            categoriaFinal = 'doces';
        }
    }

    const precoFinal = tabelaPrecos[tamanho.id][categoriaFinal] + borda.price;

    const pizzaCustomizada = {
        id: Date.now(),
        name: `Pizza Personalizada - ${customPizzaBuilder.sabores.map(s => s.name).join(', ')}`,
        tamanho: tamanho.name,
        sabores: customPizzaBuilder.sabores,
        borda: borda.name,
        price: precoFinal,
        quantity: 1
    };

    cart.push(pizzaCustomizada);
    updateCart();
    showNotification('Pizza adicionada ao carrinho!');
    renderTamanhosSelection();
    customPizzaBuilder = null;
}
