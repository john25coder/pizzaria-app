// Login simples só para identificar o cliente e salvar no localStorage
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const address = form.address.value.trim();

        if (!name || !phone || !address) {
            alert('Preencha todos os campos para continuar.');
            return;
        }

        const user = {
            name,
            phone,
            address,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('bambinos_current_user', JSON.stringify(user));

        window.location.href = 'index.html';
    });
});
