// Verificar autenticação ao iniciar o app

if (typeof checkAuthentication === 'function') {
    if (!checkAuthentication()) {
        // Redirecionar para login já é feito pela função
    }
}
// Inicialização principal
document.addEventListener('DOMContentLoaded', function () {
    renderTamanhosSelection();
    updateCart();
});
