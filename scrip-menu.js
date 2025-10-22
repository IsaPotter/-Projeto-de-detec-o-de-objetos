document.addEventListener('DOMContentLoaded', function() {
    const hamburguer = document.querySelector(".hamburguer");
    const sidebar = document.querySelector(".sidebar");
    const menu = document.querySelector(".menu");
    
    // Cria o overlay dinamicamente
    const overlay = document.createElement('div');
    overlay.classList.add('page-overlay');
    document.body.appendChild(overlay);

    hamburguer.addEventListener('click', function () {
        sidebar.classList.toggle('show-menu');
        hamburguer.classList.toggle('show-menu');
        overlay.classList.toggle('show-menu');
    });

    overlay.addEventListener('click', () => hamburguer.click());

    // Verifica o status de login e atualiza o menu
    function updateUserStatus() {
        const token = localStorage.getItem('sessionToken');
        const loginMenuItem = menu.querySelector('a[href="login.html"]')?.parentElement;
        const user = token ? JSON.parse(atob(token.split('.')[1])) : null;

        if (user && loginMenuItem) {
            // Usuário está logado: muda o link de Login para Perfil
            const profileLink = loginMenuItem.querySelector('a');
            profileLink.href = 'perfil.html';
            profileLink.innerHTML = `<i class="bi bi-person-fill me-2"></i>Meu Perfil`;

            // Adiciona um link para Relatórios
            const reportsItem = document.createElement('li');
            reportsItem.className = 'menu-item';
            reportsItem.innerHTML = `<a href="relatorios.html" class="menu-link"><i class="bi bi-graph-up-arrow me-2"></i>Relatórios</a>`;
            loginMenuItem.insertAdjacentElement('beforebegin', reportsItem);

            // Adiciona um botão de Sair abaixo do perfil
            const logoutItem = document.createElement('li');
            logoutItem.className = 'menu-item';
            logoutItem.innerHTML = `<button id="logoutBtn" class="btn-logout">Sair <i class="bi bi-box-arrow-right"></i></button>`;
            loginMenuItem.insertAdjacentElement('afterend', logoutItem);
            
            logoutItem.querySelector('#logoutBtn').addEventListener('click', async () => {
                const token = localStorage.getItem('sessionToken');
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('user'); // Remove o item antigo, caso ainda exista
                window.location.href = 'login.html'; // Redireciona para a página de login
            });
        }
    }
    updateUserStatus();
});