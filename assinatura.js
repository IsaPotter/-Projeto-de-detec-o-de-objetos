document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('status-text');
    const subscribeSection = document.getElementById('subscribe-section');
    const premiumSection = document.getElementById('premium-section');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const messageDiv = document.getElementById('message');
    const cancelBtn = document.getElementById('cancel-btn');

    // Elementos do Modal
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const paymentForm = document.getElementById('payment-form');

    const token = localStorage.getItem('sessionToken');

    // Protege a página: se não houver usuário, redireciona para o login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(atob(token.split('.')[1]));

    // Atualiza a interface com base no status do usuário
    function updateUI(status) {
        if (status === 'premium') {
            statusText.textContent = 'Premium';
            statusText.style.color = '#198754'; // Verde
            subscribeSection.style.display = 'none';
            premiumSection.style.display = 'block';
        } else {
            statusText.textContent = 'Gratuito';
            statusText.style.color = '#6c757d'; // Cinza
            subscribeSection.style.display = 'block';
            premiumSection.style.display = 'none';
        }
    }

    // Exibe o status inicial
    updateUI(user.subscription_status || 'free');

    // Lógica para o botão de assinar
    subscribeBtn.addEventListener('click', () => {
        paymentModal.style.display = 'block';
    });

    // Fechar o modal
    closeModalBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == paymentModal) {
            paymentModal.style.display = 'none';
        }
    });

    // Lógica para o formulário de pagamento (simulação)
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmBtn = document.getElementById('confirm-payment-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';

        // Simula uma chamada de API
        setTimeout(async () => {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({}) // userId vem do token
            });

            const data = await response.json();
            
            if (response.ok) {
                // Recarrega a página para que o novo status seja refletido no token de sessão no próximo login/refresh.
                window.location.reload();
                updateUI(data.subscription_status);
                paymentModal.style.display = 'none'; // Fecha o modal com sucesso
            }

            showMessage(data.message, response.ok);

            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Confirmar Pagamento (R$ 9,99/mês)';
        }, 2000); // Simula 2 segundos de processamento
    });

    // Lógica para o botão de cancelar
    cancelBtn.addEventListener('click', async () => {
        // Adiciona uma confirmação para evitar cancelamentos acidentais
        if (!confirm('Tem certeza que deseja cancelar sua assinatura Premium?')) {
            return;
        }

        const response = await fetch('/api/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({}) // O ID do usuário é obtido do token no backend
        });

        const data = await response.json();

        if (response.ok) {
            // Recarrega a página para que o novo status seja refletido
            window.location.reload();
            updateUI(data.subscription_status);
        }

        showMessage(data.message, response.ok);
    });

    function showMessage(message, isSuccess) {
        messageDiv.textContent = message;
        messageDiv.className = `alert ${isSuccess ? 'alert-info' : 'alert-warning'}`;
        messageDiv.style.display = 'block';
    }
});