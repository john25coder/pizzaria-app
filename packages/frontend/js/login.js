// ===== LOGIN E CADASTRO SIMPLIFICADO (CPF, TELEFONE, SENHA) =====

// Alternar entre abas de Login e Cadastro
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const cadastroForm = document.getElementById('cadastroForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.add('active');
        cadastroForm.classList.remove('active');
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        cadastroForm.classList.add('active');
        tabBtns[0].classList.remove('active');
        tabBtns[1].classList.add('active');
    }
}

// Máscaras de formatação
document.getElementById('loginCPF')?.addEventListener('input', function(e) {
    e.target.value = formatCPF(e.target.value);
});

document.getElementById('cadastroCPF')?.addEventListener('input', function(e) {
    e.target.value = formatCPF(e.target.value);
});

document.getElementById('cadastroTelefone')?.addEventListener('input', function(e) {
    e.target.value = formatTelefone(e.target.value);
});

// Formato CPF: 000.000.000-00
function formatCPF(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
}

// Formato Telefone: (00) 0 0000-0000
function formatTelefone(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
}

// Validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

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

// ===== PROCESSAR LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const cpf = document.getElementById('loginCPF').value.replace(/\D/g, '');
    const senha = document.getElementById('loginSenha').value;

    // Validações básicas
    if (!validarCPF(cpf)) {
        alert('❌ CPF inválido!');
        return;
    }

    if (senha.length < 6) {
        alert('❌ Senha muito curta!');
        return;
    }

    try {
        // Tentar fazer login no backend
        const response = await fetch('http://localhost:3333/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || '❌ CPF ou senha incorretos.');
            return;
        }

        const userData = await response.json();

        // Salvar no localStorage
        localStorage.setItem('bambinos_current_user', JSON.stringify(userData));

        console.log('✅ Login realizado com sucesso!');

        // Redirecionar para o app
        window.location.href = '../index.html';

    } catch (err) {
        console.error('❌ Erro ao conectar:', err);

        // Fallback: verificar no localStorage
        const usuariosSalvos = JSON.parse(localStorage.getItem('bambinos_usuarios')) || [];
        const usuario = usuariosSalvos.find(u => u.cpf === cpf && u.senha === senha);

        if (usuario) {
            localStorage.setItem('bambinos_current_user', JSON.stringify(usuario));
            window.location.href = '../index.html';
        } else {
            alert('❌ CPF ou senha incorretos.\n\nVerifique se o backend está rodando em http://localhost:3333');
        }
    }
});

// ===== PROCESSAR CADASTRO =====
document.getElementById('cadastroForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const cpf = document.getElementById('cadastroCPF').value.replace(/\D/g, '');
    const telefone = document.getElementById('cadastroTelefone').value.replace(/\D/g, '');
    const senha = document.getElementById('cadastroSenha').value;
    const senhaConfirm = document.getElementById('cadastroSenhaConfirm').value;

    // Validações
    if (!validarCPF(cpf)) {
        alert('❌ CPF inválido!');
        return;
    }

    if (telefone.length < 10) {
        alert('❌ Telefone inválido! Digite um número completo.');
        return;
    }

    if (senha.length < 6) {
        alert('❌ A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (senha !== senhaConfirm) {
        alert('❌ As senhas não coincidem!');
        return;
    }

    try {
        // Tentar cadastrar no backend
        const response = await fetch('http://localhost:3333/api/auth/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, telefone, senha })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error || '❌ Erro ao cadastrar. CPF pode já estar em uso.');
            return;
        }

        const userData = await response.json();

        // Salvar no localStorage
        localStorage.setItem('bambinos_current_user', JSON.stringify(userData));

        alert('✅ Cadastro realizado com sucesso!');
        console.log('✅ Usuário cadastrado:', userData);

        // Redirecionar para o app
        window.location.href = '../index.html';

    } catch (err) {
        console.error('❌ Erro ao conectar:', err);

        // Fallback: salvar no localStorage
        const novoUsuario = {
            id: Date.now(),
            cpf,
            telefone,
            senha,
            dataCadastro: new Date().toISOString()
        };

        // Verificar se CPF já existe
        const usuariosSalvos = JSON.parse(localStorage.getItem('bambinos_usuarios')) || [];
        const cpfExiste = usuariosSalvos.some(u => u.cpf === cpf);

        if (cpfExiste) {
            alert('❌ Este CPF já está cadastrado!');
            return;
        }

        usuariosSalvos.push(novoUsuario);
        localStorage.setItem('bambinos_usuarios', JSON.stringify(usuariosSalvos));
        localStorage.setItem('bambinos_current_user', JSON.stringify(novoUsuario));

        alert('✅ Cadastro realizado com sucesso!\n\nNota: Backend offline. Dados salvos localmente.');
        window.location.href = '../index.html';
    }
});
