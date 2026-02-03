// Login simplificado para clientes do site
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const address = form.address.value.trim();

        // Validações básicas
        if (!name || !phone || !address) {
            alert('Por favor, preencha todos os campos para continuar.');
            return;
        }

        if (name.length < 3) {
            alert('Nome deve ter pelo menos 3 caracteres.');
            return;
        }

        // Remover espaços e verificar telefone
        const phoneNumbers = phone.replace(/\D/g, '');
        if (phoneNumbers.length < 10) {
            alert('Telefone inválido. Digite um número completo.');
            return;
        }

        try {
            // Chamar API de login
            const response = await fetch('http://localhost:3333/api/clientes/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, address })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Erro ao fazer login. Tente novamente.');
                return;
            }

            const userFromApi = await response.json();

            // Salvar no localStorage
            localStorage.setItem('bambinos_current_user', JSON.stringify(userFromApi));

            console.log('✅ Login realizado com sucesso:', userFromApi);

            // Redirecionar para o app
            window.location.href = 'index.html';
        } catch (err) {
            console.error('❌ Erro ao conectar com servidor:', err);
            alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3333');
        }
    });
});
