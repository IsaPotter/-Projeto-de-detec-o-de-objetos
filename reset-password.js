document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetPasswordForm');
    const messageDiv = document.getElementById('message');

    // Pega o token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('Token de redefinição inválido ou ausente.', false);
        resetForm.style.display = 'none';
        return;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showMessage('As senhas não correspondem.', false);
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();
            showMessage(data.message, response.ok);

            if (response.ok) {
                resetForm.innerHTML = `<p class="text-center">Sua senha foi redefinida com sucesso! Você já pode <a href="login.html">fazer login</a>.</p>`;
            }
        } catch (error) {
            showMessage('Erro de conexão. Tente novamente.', false);
        }
    });

    function showMessage(message, isSuccess) {
        messageDiv.textContent = message;
        messageDiv.className = `alert ${isSuccess ? 'alert-info' : 'alert-warning'}`;
        messageDiv.style.display = 'block';
    }
});