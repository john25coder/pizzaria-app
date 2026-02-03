// Gerenciamento de perfil e endereços
let addresses = [];

// Verificar autenticação
if (!checkAuthentication()) {
    window.location.href = 'login.html';
}

// Carregar dados do perfil ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
    loadAddresses();
});

async function loadProfile() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3333/api/usuarios/${currentUser.id}`);
        const data = await response.json();
        const user = data.data || data;

        document.getElementById('name').value = user.nome || user.name || '';
        document.getElementById('phone').value = user.telefone || user.phone || '';
        document.getElementById('cpf').value = formatCPF(user.cpf || '');
        document.getElementById('email').value = user.email || '';

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Se a API não funcionar, usar dados do localStorage
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('phone').value = currentUser.phone || '';
        document.getElementById('email').value = currentUser.email || '';
    }
}

async function loadAddresses() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    try {
        const response = await fetch(`http://localhost:3333/api/usuarios/${currentUser.id}/enderecos`);
        const data = await response.json();
        addresses = data.data || data || [];
        renderAddresses();
    } catch (error) {
        console.error('Erro ao carregar endereços:', error);
        // Carregar do localStorage como fallback
        addresses = JSON.parse(localStorage.getItem('bambinos_addresses_' + currentUser.phone)) || [];
        renderAddresses();
    }
}

function renderAddresses() {
    const container = document.getElementById('addressList');

    if (!container) return;

    if (addresses.length === 0) {
        container.innerHTML = '<p class="no-addresses">Nenhum endereço cadastrado</p>';
        return;
    }

    container.innerHTML = addresses.map((addr, index) => `
        <div class="address-card ${addr.principal ? 'principal' : ''}">
            <div class="address-info">
                ${addr.principal ? '<span class="badge-principal">Principal</span>' : ''}
                <h4>${addr.apelido || 'Endereço ' + (index + 1)}</h4>
                <p>${addr.rua || addr.logradouro}, ${addr.numero}</p>
                ${addr.complemento ? `<p>${addr.complemento}</p>` : ''}
                <p>${addr.bairro} - ${addr.cidade || 'Navegantes'}</p>
                <p>CEP: ${formatCEP(addr.cep)}</p>
            </div>
            <div class="address-actions">
                <button onclick="editAddress(${index})" class="btn-edit">✏️ Editar</button>
                ${!addr.principal ? `<button onclick="deleteAddress(${index})" class="btn-delete">🗑️ Excluir</button>` : ''}
                ${!addr.principal ? `<button onclick="setMainAddress(${index})" class="btn-main">⭐ Tornar principal</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Salvar perfil
async function saveProfile(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const email = document.getElementById('email').value.trim();

    // Validações
    if (name.length < 3) {
        alert('Nome deve ter pelo menos 3 caracteres');
        return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
        alert('Telefone inválido');
        return;
    }

    if (cpf && !validarCPF(cpf)) {
        alert('CPF inválido');
        return;
    }

    try {
        const currentUser = getCurrentUser();
        const response = await fetch(`http://localhost:3333/api/usuarios/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: name, telefone: phone, cpf, email })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar perfil');
        }

        const updatedUser = await response.json();

        // Atualizar localStorage
        localStorage.setItem('bambinos_current_user', JSON.stringify({
            ...currentUser,
            name,
            phone,
            cpf,
            email
        }));

        alert('✅ Perfil atualizado com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
    }
}

// Adicionar novo endereço
function showAddAddressModal() {
    document.getElementById('addressModal').classList.add('show');
    document.getElementById('addressForm').reset();
    document.getElementById('addressIndex').value = '';
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('show');
}

async function saveAddress(e) {
    e.preventDefault();

    const addressData = {
        apelido: document.getElementById('addressName').value.trim(),
        cep: document.getElementById('cep').value.replace(/\D/g, ''),
        rua: document.getElementById('street').value.trim(),
        numero: document.getElementById('number').value.trim(),
        complemento: document.getElementById('complement').value.trim(),
        bairro: document.getElementById('neighborhood').value.trim(),
        cidade: document.getElementById('city').value.trim() || 'Navegantes',
        estado: 'RS',
        principal: addresses.length === 0 // Primeiro endereço é principal
    };

    const index = document.getElementById('addressIndex').value;
    const currentUser = getCurrentUser();

    try {
        if (index !== '') {
            // Editar endereço existente
            addresses[index] = { ...addresses[index], ...addressData };
        } else {
            // Adicionar novo endereço
            addresses.push(addressData);
        }

        // Salvar no localStorage
        localStorage.setItem('bambinos_addresses_' + currentUser.phone, JSON.stringify(addresses));

        // Tentar salvar no backend
        await fetch(`http://localhost:3333/api/usuarios/${currentUser.id}/enderecos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData)
        });

        renderAddresses();
        closeAddressModal();
        alert('✅ Endereço salvo com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        alert('Endereço salvo localmente. Sincronização com servidor pendente.');
        renderAddresses();
        closeAddressModal();
    }
}

function editAddress(index) {
    const addr = addresses[index];

    document.getElementById('addressName').value = addr.apelido || '';
    document.getElementById('cep').value = formatCEP(addr.cep);
    document.getElementById('street').value = addr.rua || addr.logradouro || '';
    document.getElementById('number').value = addr.numero || '';
    document.getElementById('complement').value = addr.complemento || '';
    document.getElementById('neighborhood').value = addr.bairro || '';
    document.getElementById('city').value = addr.cidade || 'Navegantes';
    document.getElementById('addressIndex').value = index;

    document.getElementById('addressModal').classList.add('show');
}

function deleteAddress(index) {
    if (!confirm('Deseja realmente excluir este endereço?')) return;

    addresses.splice(index, 1);

    const currentUser = getCurrentUser();
    localStorage.setItem('bambinos_addresses_' + currentUser.phone, JSON.stringify(addresses));

    renderAddresses();
    alert('Endereço excluído');
}

function setMainAddress(index) {
    addresses.forEach((addr, i) => {
        addr.principal = (i === index);
    });

    const currentUser = getCurrentUser();
    localStorage.setItem('bambinos_addresses_' + currentUser.phone, JSON.stringify(addresses));

    renderAddresses();
    alert('✅ Endereço principal atualizado');
}

// Buscar CEP na API ViaCEP
async function searchCEP() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');

    if (cep.length !== 8) {
        alert('CEP inválido');
        return;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert('CEP não encontrado');
            return;
        }

        document.getElementById('street').value = data.logradouro || '';
        document.getElementById('neighborhood').value = data.bairro || '';
        document.getElementById('city').value = data.localidade || 'Navegantes';
        document.getElementById('number').focus();

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP. Preencha manualmente.');
    }
}

// Funções auxiliares de formatação
function formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

function formatCEP(cep) {
    cep = (cep || '').replace(/\D/g, '');
    if (cep.length === 8) {
        return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;

    return (parseInt(cpf.charAt(9)) === digito1 && parseInt(cpf.charAt(10)) === digito2);
}

// Voltar para o app
function voltarParaApp() {
    window.location.href = '../index.html';
}

// Event listeners
document.getElementById('profileForm')?.addEventListener('submit', saveProfile);
document.getElementById('addressForm')?.addEventListener('submit', saveAddress);
document.getElementById('btnAddAddress')?.addEventListener('click', showAddAddressModal);
document.getElementById('btnSearchCEP')?.addEventListener('click', searchCEP);

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('addressModal');
    if (event.target === modal) {
        closeAddressModal();
    }
}
