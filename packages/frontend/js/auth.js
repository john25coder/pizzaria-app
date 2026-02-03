// ===== SISTEMA DE AUTENTICAÇÃO =====
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('bambinos_current_user') || 'null');
}

function checkAuthentication() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('bambinos_current_user');
        window.location.href = 'login.html';
    }
}

// Verificar autenticação ao carregar
if (!checkAuthentication()) {
    throw new Error('Not authenticated - redirecting to login');
}

// Exibir nome do usuário
window.addEventListener('DOMContentLoaded', function () {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const firstName = currentUser.name.split(' ')[0];
        document.getElementById('userName').textContent = firstName;
    }
});
