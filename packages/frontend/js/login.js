// Login/Registro com telefone e senha
let currentTab = 'login';

function switchTab(tab) {
    currentTab = tab;

    // Atualizar tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Atualizar forms
    document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;

    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
        alert('Telefone inválido. Digite um número completo.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3333/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefone: phoneNumbers,
                senha: password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Erro ao fazer login. Verifique seus dados.');
            return;
        }

        const data = await response.json();
        const user = data.data?.usuario || data.usuario;

        localStorage.setItem('bambinos_current_user', JSON.stringify(user));
        localStorage.setItem('bambinos_token', data.token || '');

        console.log('✅ Login realizado com sucesso:', user);

        window.location.href = 'index.html';
    } catch (err) {
        console.error('❌ Erro ao conectar:', err);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }

    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
        alert('Telefone inválido. Digite um número completo.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3333/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: name,
                telefone: phoneNumbers,
                senha: password,
                email: `${phoneNumbers}@cliente.bambinos`
            })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Erro ao criar conta. Tente novamente.');
            return;
        }

        const data = await response.json();

        alert('✅ Conta criada com sucesso! Faça login para continuar.');

        // Mudar para tab de login
        document.querySelector('.tab:first-child').click();
        document.getElementById('loginPhone').value = phone;
    } catch (err) {
        console.error('❌ Erro ao conectar:', err);
        alert('Não foi possível conectar ao servidor.');
    }
}
