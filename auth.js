document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const twoFaForm = document.getElementById('twoFaForm');
    const tabButtons = document.querySelectorAll('.auth-tab-button');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    const authTabs = document.querySelector('.auth-tabs');

    // Variável para guardar o ID do usuário durante a verificação 2FA
    let userIdFor2FA = null;

    // Verifica se há erros na URL (ex: falha no login social)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'github_email_error') {
        showMessage('Não foi possível obter seu e-mail do GitHub. Por favor, verifique se você tem um e-mail público em seu perfil do GitHub ou use outra forma de login.', false);
    }
    // Limpa a URL para não mostrar o erro novamente ao recarregar
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Lógica para trocar de aba
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e formulários
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

            // Adiciona a classe 'active' ao botão e formulário clicados
            button.classList.add('active');
            const formId = button.dataset.form;
            document.getElementById(formId).classList.add('active');
        });
    });

    // Lógica para mostrar o formulário de recuperação
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        forgotPasswordForm.classList.add('active');
        authTabs.style.display = 'none'; // Esconde as abas
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordForm.classList.remove('active');
        loginForm.classList.add('active');
        authTabs.style.display = 'flex'; // Mostra as abas novamente
    });

    // Lógica para o formulário de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validação adicional: verificar se as senhas coincidem
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem. Tente novamente.', false);
            return;
        }

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json();
        showMessage(data.message, response.ok);
        if (response.ok) {
            // Limpa o formulário de cadastro
            registerForm.reset();

            // Preenche o email no formulário de login
            document.getElementById('loginEmail').value = email;

            // Muda para a aba de login automaticamente
            document.querySelector('.auth-tab-button[data-form="loginForm"]').click();
        }
    });

    // Lógica para o formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = loginButton.innerHTML;

        // Desabilita o botão e mostra o carregamento
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Carregando...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            showMessage(data.message, response.ok);

            if (response.ok && data.two_fa_required) {
                // 2FA é necessário, mostra o formulário 2FA
                userIdFor2FA = data.userId;
                loginForm.classList.remove('active');
                twoFaForm.classList.add('active');
                authTabs.style.display = 'none';
            } else if (response.ok) {
                // Salva o token de sessão e redireciona
                // O token agora contém as informações do usuário
                localStorage.setItem('sessionToken', data.token);
                window.location.href = 'index.html';
            }
        } finally {
            // Reabilita o botão e restaura o texto original
            loginButton.disabled = false;
            loginButton.innerHTML = originalButtonText;
        }
    });

    // Lógica para o formulário de recuperação de senha
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            showMessage(data.message, response.ok);
        } catch (error) {
            showMessage('Erro de conexão. Tente novamente.', false);
        }
    });

    // Lógica para o formulário de verificação 2FA
    twoFaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('2faToken').value;

        try {
            const response = await fetch('/api/login/2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userIdFor2FA, token: token })
            });

            const data = await response.json();
            showMessage(data.message, response.ok);

            if (response.ok) {
                // Login 2FA bem-sucedido, salva o token
                localStorage.setItem('sessionToken', data.token);
                window.location.href = 'index.html';
            }
        } catch (error) {
            showMessage('Erro de conexão. Tente novamente.', false);
        }
    });

    function showMessage(message, isSuccess) {
        messageDiv.textContent = message;
        messageDiv.className = 'alert'; // Reseta classes
        if (isSuccess) {
            messageDiv.classList.add('alert-info');
        } else {
            messageDiv.classList.add('alert-warning');
        }
        messageDiv.style.display = 'block';
    }
});