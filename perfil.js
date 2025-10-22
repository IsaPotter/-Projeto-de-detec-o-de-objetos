document.addEventListener('DOMContentLoaded', () => {
    const userEmailSpan = document.getElementById('user-email');
    const subscriptionStatusSpan = document.getElementById('subscription-status');
    const logoutBtn = document.getElementById('logout-btn');
    const changePasswordForm = document.getElementById('change-password-form');
    const passwordMessageDiv = document.getElementById('password-message');
    const totalDetectionsSpan = document.getElementById('total-detections');
    const mostDetectedObjectSpan = document.getElementById('most-detected-object');
    const showDeleteModalBtn = document.getElementById('show-delete-modal-btn');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const closeDeleteModalBtn = document.getElementById('close-delete-modal');
    const deleteAccountForm = document.getElementById('delete-account-form');
    const deleteMessageDiv = document.getElementById('delete-message');
    const activityLogList = document.getElementById('activity-log-list');
    const activityLogPagination = document.getElementById('activity-log-pagination');
    const activityLogSearch = document.getElementById('activity-log-search');
    const exportChartBtn = document.getElementById('export-chart-btn');
    const sessionList = document.getElementById('session-list');
    const statsPeriodSelect = document.getElementById('stats-period-select');
    // Elementos 2FA
    const twoFaStatusText = document.getElementById('2fa-status-text');
    const toggle2faBtn = document.getElementById('toggle-2fa-btn');
    const twoFaSetupModal = document.getElementById('2fa-setup-modal');
    const close2faModalBtn = document.getElementById('close-2fa-modal');
    const twoFaQrCode = document.getElementById('2fa-qr-code');
    const twoFaVerifyForm = document.getElementById('2fa-verify-form');
    const twoFaSecretKeySpan = document.getElementById('2fa-secret-key');
    const copy2faSecretBtn = document.getElementById('copy-2fa-secret-btn');
    const twoFaMessageDiv = document.getElementById('2fa-message');


    let statsChartInstance = null; // Variável para guardar a instância do gráfico


    const token = localStorage.getItem('sessionToken');    

    // Protege a página: se não houver usuário, redireciona para o login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(atob(token.split('.')[1]));

    // Preenche as informações do usuário
    if (userEmailSpan) {
        userEmailSpan.textContent = user.email;
    }

    // Atualiza a UI do 2FA com base no status do usuário
    function update2FA_UI(is2faEnabled) {
        twoFaStatusText.textContent = is2faEnabled ? 'Ativado. Sua conta está protegida.' : 'Desativado. Aumente sua segurança.';
        toggle2faBtn.textContent = is2faEnabled ? 'Desativar' : 'Ativar';
        toggle2faBtn.className = `btn ${is2faEnabled ? 'btn-warning' : 'btn-success'}`;
        toggle2faBtn.disabled = false;
    }

    if (subscriptionStatusSpan) {
        const status = user.subscription_status === 'premium' ? 'Premium ⭐' : 'Gratuito';
        subscriptionStatusSpan.textContent = status;
        if (user.subscription_status === 'premium') {
            subscriptionStatusSpan.style.color = 'var(--primary-color)';
            subscriptionStatusSpan.style.fontWeight = 'bold';
            update2FA_UI(user.two_fa_enabled); // Atualiza UI do 2FA
        }
    }

    // Carrega e exibe as estatísticas
    async function loadUserStats() {
        const period = statsPeriodSelect.value;
        try {
            const response = await fetch(`/api/stats?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar estatísticas');
            
            const stats = await response.json(); // Ex: [{object_name: 'person', total_count: 10}]
            if (stats.length === 0) {
                totalDetectionsSpan.textContent = 0;
                mostDetectedObjectSpan.textContent = '-';
                renderStatsChart([], []); // Limpa o gráfico
                return;
            }

            // Calcula o total de detecções
            const totalDetections = stats.reduce((sum, item) => sum + item.total_count, 0);
            totalDetectionsSpan.textContent = totalDetections;

            // Encontra o objeto mais detectado
            const sortedStats = stats.sort((a, b) => b.total_count - a.total_count);
            const mostDetected = sortedStats[0];
            mostDetectedObjectSpan.textContent = `${translateObjectName(mostDetected.object_name)} (${mostDetected.total_count} vezes)`;

            // Prepara dados para o gráfico (Top 5)
            const topStats = sortedStats.slice(0, 5);
            const chartLabels = topStats.map(item => translateObjectName(item.object_name));
            const chartData = topStats.map(item => item.total_count);

            renderStatsChart(chartLabels, chartData);

        } catch (error) {
            console.error("Erro ao carregar estatísticas do servidor:", error);
            totalDetectionsSpan.textContent = 'Erro';
            mostDetectedObjectSpan.textContent = 'Erro';
        }
    }

    loadUserStats();
    loadActiveSessions();

    // Adiciona evento para o seletor de período
    statsPeriodSelect.addEventListener('change', () => {
        loadUserStats();
    });

    // Carrega e exibe o log de atividades
    let debounceTimeout;
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function loadActivityLog(page = 1) {
        const searchTerm = activityLogSearch.value;
        try {
            const query = `?page=${page}&search=${encodeURIComponent(searchTerm)}`;
            const response = await fetch(`/api/activity-log${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar log de atividades');

            const data = await response.json();
            const { logs, totalPages, currentPage } = data;
            
            if (logs.length === 0) {
                activityLogPagination.innerHTML = ''; // Limpa controles de paginação
                activityLogList.innerHTML = '<li class="text-center">Nenhuma atividade recente.</li>';
                return;
            }

            activityLogList.innerHTML = logs.map(log => {
                // Formata a data para um formato legível
                const date = new Date(log.timestamp);
                const formattedDate = date.toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                return `<li><span>${log.activity}</span><small class="text-muted">${formattedDate}</small></li>`;
            }).join('');

            renderActivityLogPagination(totalPages, currentPage);

        } catch (error) {
            console.error("Erro ao carregar log de atividades:", error);
            activityLogList.innerHTML = '<li class="text-center text-danger">Erro ao carregar atividades.</li>';
        }
    }
    loadActivityLog(1); // Carrega a primeira página inicialmente

    // Carrega e exibe as sessões ativas
    async function loadActiveSessions() {
        try {
            const response = await fetch('/api/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar sessões');

            const sessions = await response.json();
            if (sessions.length === 0) {
                sessionList.innerHTML = '<li class="text-center">Nenhuma sessão ativa encontrada.</li>';
                return;
            }

            sessionList.innerHTML = sessions.map(session => {
                const date = new Date(session.created_at).toLocaleString('pt-BR');
                const isCurrent = session.isCurrent;
                return `
                    <li class="session-item">
                        <div>
                            <strong><i class="bi bi-pc-display me-2"></i> ${parseUserAgent(session.user_agent)}</strong>
                            <small class="d-block text-muted">IP: ${session.ip_address} • Ativa desde: ${date}</small>
                        </div>
                        ${isCurrent 
                            ? '<span class="badge bg-success">Sessão Atual</span>' 
                            : `<button class="btn btn-sm btn-warning revoke-session-btn" data-session-id="${session.session_id}">Revogar</button>`
                        }
                    </li>
                `;
            }).join('');

            // Adiciona eventos aos botões de revogar
            document.querySelectorAll('.revoke-session-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const sessionId = e.target.dataset.sessionId;
                    if (confirm('Tem certeza que deseja revogar esta sessão? O dispositivo será desconectado.')) {
                        await revokeSession(sessionId);
                    }
                });
            });

        } catch (error) {
            console.error("Erro ao carregar sessões:", error);
            sessionList.innerHTML = '<li class="text-center text-danger">Erro ao carregar sessões.</li>';
        }
    }

    async function revokeSession(sessionId) {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao revogar sessão');
            loadActiveSessions(); // Recarrega a lista de sessões
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    function parseUserAgent(ua) {
        // Simples parser de User Agent (pode ser melhorado com uma biblioteca)
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Navegador Desconhecido';
    }

    // Adiciona evento de busca com debounce
    activityLogSearch.addEventListener('input', debounce(() => {
        loadActivityLog(1); // Reseta para a página 1 ao buscar
    }, 500));

    // Renderiza os controles de paginação para o log de atividades
    function renderActivityLogPagination(totalPages, currentPage) {
        if (totalPages <= 1) {
            activityLogPagination.innerHTML = '';
            return;
        }

        activityLogPagination.innerHTML = `
            <button id="prev-log-page" class="btn" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${currentPage} de ${totalPages}</span>
            <button id="next-log-page" class="btn" ${currentPage === totalPages ? 'disabled' : ''}>Próxima</button>
        `;

        const prevBtn = document.getElementById('prev-log-page');
        const nextBtn = document.getElementById('next-log-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                loadActivityLog(currentPage - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                loadActivityLog(currentPage + 1);
            });
        }
    }
    
    // Função para renderizar o gráfico de estatísticas
    function renderStatsChart(labels, data) {
        const ctx = document.getElementById('statsChart').getContext('2d');

        // Destrói a instância anterior do gráfico, se existir, para evitar sobreposição
        if (statsChartInstance) {
            statsChartInstance.destroy();
        }
        
        // Cria e armazena a nova instância do gráfico
        statsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nº de Detecções',
                    data: data,
                    backgroundColor: [
                        'rgba(106, 130, 251, 0.6)',
                        'rgba(78, 205, 196, 0.6)',
                        'rgba(255, 160, 122, 0.6)',
                        'rgba(247, 220, 111, 0.6)',
                        'rgba(187, 143, 206, 0.6)'
                    ],
                    borderColor: [
                        'rgba(106, 130, 251, 1)',
                        'rgba(78, 205, 196, 1)',
                        'rgba(255, 160, 122, 1)',
                        'rgba(247, 220, 111, 1)',
                        'rgba(187, 143, 206, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1 // Garante que o eixo Y mostre apenas números inteiros
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // Esconde a legenda, pois é um gráfico simples
                    },
                    title: {
                        display: true,
                        text: 'Top 5 Objetos Mais Detectados'
                    }
                }
            }
        });
    }

    // Copiado de script.js para traduzir os nomes no perfil
    function translateObjectName(name) {
        const translations = {
            'person': 'Pessoa', 'bicycle': 'Bicicleta', 'car': 'Carro', 'motorcycle': 'Motocicleta',
            'airplane': 'Avião', 'bus': 'Ônibus', 'train': 'Trem', 'truck': 'Caminhão', 'boat': 'Barco',
            'traffic light': 'Semáforo', 'fire hydrant': 'Hidrante', 'stop sign': 'Placa de Pare',
            'parking meter': 'Parquímetro', 'bench': 'Banco', 'bird': 'Pássaro', 'cat': 'Gato',
            'dog': 'Cachorro', 'horse': 'Cavalo', 'sheep': 'Ovelha', 'cow': 'Vaca', 'elephant': 'Elefante',
            'bear': 'Urso', 'zebra': 'Zebra', 'giraffe': 'Girafa', 'backpack': 'Mochila',
            'umbrella': 'Guarda-chuva', 'handbag': 'Bolsa', 'tie': 'Gravata', 'suitcase': 'Mala',
            'frisbee': 'Frisbee', 'skis': 'Esquis', 'snowboard': 'Prancha de Snowboard',
            'sports ball': 'Bola', 'kite': 'Pipa', 'baseball bat': 'Taco de Beisebol',
            'baseball glove': 'Luva de Beisebol', 'skateboard': 'Skate', 'surfboard': 'Prancha de Surf',
            'tennis racket': 'Raquete de Tênis', 'bottle': 'Garrafa', 'wine glass': 'Taça de Vinho',
            'cup': 'Xícara', 'fork': 'Garfo', 'knife': 'Faca', 'spoon': 'Colher', 'bowl': 'Tigela',
            'banana': 'Banana', 'apple': 'Maçã', 'sandwich': 'Sanduíche', 'orange': 'Laranja',
            'broccoli': 'Brócolis', 'carrot': 'Cenoura', 'hot dog': 'Cachorro-quente', 'pizza': 'Pizza',
            'donut': 'Rosquinha', 'cake': 'Bolo', 'chair': 'Cadeira', 'couch': 'Sofá',
            'potted plant': 'Planta em Vaso', 'bed': 'Cama', 'dining table': 'Mesa de Jantar',
            'toilet': 'Vaso Sanitário', 'tv': 'TV', 'laptop': 'Laptop', 'mouse': 'Mouse',
            'remote': 'Controle Remoto', 'keyboard': 'Teclado', 'cell phone': 'Celular',
            'microwave': 'Micro-ondas', 'oven': 'Forno', 'toaster': 'Torradeira', 'sink': 'Pia',
            'refrigerator': 'Geladeira', 'book': 'Livro', 'clock': 'Relógio', 'vase': 'Vaso de Flor',
            'scissors': 'Tesoura', 'teddy bear': 'Ursinho de Pelúcia', 'hair drier': 'Secador de Cabelo',
            'toothbrush': 'Escova de Dentes'
        };
        return translations[name] || name;
    }

    // Adiciona lógica ao formulário de alteração de senha
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showPasswordMessage('A nova senha e a confirmação não correspondem.', false);
                return;
            }

            try {
                const response = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });

                const data = await response.json();
                showPasswordMessage(data.message, response.ok);

                if (response.ok) {
                    changePasswordForm.reset(); // Limpa o formulário
                }
            } catch (error) {
                showPasswordMessage('Erro de conexão. Tente novamente.', false);
            }
        });
    }

    function showPasswordMessage(message, isSuccess) {
        passwordMessageDiv.textContent = message;
        passwordMessageDiv.className = `alert ${isSuccess ? 'alert-info' : 'alert-warning'}`;
        passwordMessageDiv.style.display = 'block';
    }

    // Lógica para exportar o gráfico
    if (exportChartBtn) {
        exportChartBtn.addEventListener('click', () => {
            if (statsChartInstance) {
                const imageUrl = statsChartInstance.toBase64Image();
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = 'estatisticas-deteccao.png';
                document.body.appendChild(link); // Necessário para o Firefox
                link.click();
                document.body.removeChild(link);
            } else {
                alert('O gráfico ainda não foi carregado ou não há dados para exibir.');
            }
        });
    }

    // Lógica para deletar conta
    if (showDeleteModalBtn) {
        showDeleteModalBtn.addEventListener('click', () => {
            deleteAccountModal.style.display = 'block';
        });

        closeDeleteModalBtn.addEventListener('click', () => {
            deleteAccountModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == deleteAccountModal) {
                deleteAccountModal.style.display = 'none';
            }
        });

        deleteAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('delete-confirm-password').value;

            try {
                const response = await fetch('/api/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showDeleteMessage(data.message, true);
                    // Logout e redirecionamento após um breve delay
                    setTimeout(() => {
                        localStorage.removeItem('sessionToken');
                        window.location.href = 'login.html?message=account_deleted';
                    }, 2000);
                } else {
                    showDeleteMessage(data.message, false);
                }
            } catch (error) {
                showDeleteMessage('Erro de conexão. Tente novamente.', false);
            }
        });
    }

    function showDeleteMessage(message, isSuccess) {
        deleteMessageDiv.textContent = message;
        deleteMessageDiv.className = `alert ${isSuccess ? 'alert-info' : 'alert-warning'}`;
        deleteMessageDiv.style.display = 'block';
    }

    // --- Lógica para 2FA ---

    // Função para buscar o status do 2FA do servidor (mais seguro)
    async function check2FAStatus() {
        // Esta é uma melhoria opcional. Por simplicidade, vamos usar o localStorage por enquanto.
        // A forma mais segura seria fazer um fetch para uma rota /api/user/status que retorna o estado atual do 2FA.
        update2FA_UI(user.two_fa_enabled);
    }
    check2FAStatus();

    toggle2faBtn.addEventListener('click', () => {
        if (user.two_fa_enabled) {
            // Lógica para desativar
            const password = prompt('Para desativar o 2FA, por favor, digite sua senha:');
            if (password) {
                disable2FA(password);
            }
        } else {
            // Lógica para ativar
            setup2FA();
        }
    });

    async function setup2FA() {
        try {
            const response = await fetch('/api/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({}) // O userId vem do token agora
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            twoFaQrCode.src = data.qrCodeUrl;
            twoFaSecretKeySpan.textContent = data.secret; // Exibe a chave secreta
            twoFaSetupModal.style.display = 'block';
        } catch (error) {
            alert(`Erro ao iniciar configuração do 2FA: ${error.message}`);
        }
    }

    twoFaVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('2fa-token').value;

        try {
            const response = await fetch('/api/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ token: token })
            });
            const data = await response.json();
            show2FAMessage(data.message, response.ok);

            if (response.ok) {
                // Força a recarga da página para obter um novo token com o status 2FA atualizado
                alert('2FA ativado com sucesso! A página será recarregada.');
                window.location.reload();
                setTimeout(() => {
                    twoFaSetupModal.style.display = 'none';
                    update2FA_UI(true);
                }, 1500);
            }
        } catch (error) {
            show2FAMessage('Erro de conexão.', false);
        }
    });

    async function disable2FA(password) {
        try {
            const response = await fetch('/api/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: password })
            });
            const data = await response.json();
            alert(data.message);

            if (response.ok) {
                // Força a recarga da página para obter um novo token com o status 2FA atualizado
                alert('2FA desativado com sucesso! A página será recarregada.');
                window.location.reload();
                update2FA_UI(false);
            }
        } catch (error) {
            alert('Erro de conexão ao tentar desativar o 2FA.');
        }
    }

    // Fechar modal do 2FA
    close2faModalBtn.addEventListener('click', () => twoFaSetupModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == twoFaSetupModal) {
            twoFaSetupModal.style.display = 'none';
        }
    });

    // Lógica para copiar a chave secreta 2FA
    copy2faSecretBtn.addEventListener('click', () => {
        const secret = twoFaSecretKeySpan.textContent;
        navigator.clipboard.writeText(secret).then(() => {
            const originalIcon = copy2faSecretBtn.innerHTML;
            copy2faSecretBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
            copy2faSecretBtn.title = 'Copiado!';
            setTimeout(() => {
                copy2faSecretBtn.innerHTML = originalIcon;
                copy2faSecretBtn.title = 'Copiar chave';
            }, 2000);
        }).catch(err => {
            console.error('Falha ao copiar a chave: ', err);
        });
    });

    function show2FAMessage(message, isSuccess) {
        twoFaMessageDiv.textContent = message;
        twoFaMessageDiv.className = `alert ${isSuccess ? 'alert-info' : 'alert-warning'}`;
        twoFaMessageDiv.style.display = 'block';
    }
});