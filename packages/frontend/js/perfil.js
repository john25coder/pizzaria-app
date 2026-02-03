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

        document.getElementById('name').value = user.nome || '';
        document.getElementById('phone').value = user.telefone || '';
        document.getElementById('cpf').value = formatCPF(user.cpf || '');
        document.
