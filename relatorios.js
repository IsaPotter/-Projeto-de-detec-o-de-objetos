document.addEventListener('DOMContentLoaded', () => {
    const reportsForm = document.getElementById('reports-form');
    const alertsForm = document.getElementById('alerts-form');
    const reportFrequencySelect = document.getElementById('report-frequency');
    const alertObjectsInput = document.getElementById('alert-objects');
    const logoutBtn = document.getElementById('logout-btn'); // Assumindo que o botão de logout seja adicionado ao menu

    const token = localStorage.getItem('sessionToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Função para buscar as configurações salvas
    async function loadSettings() {
        try {
            const response = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar configurações.');

            const settings = await response.json();
            settings.forEach(setting => {
                if (setting.key === 'report_frequency') {
                    reportFrequencySelect.value = setting.value;
                }
                if (setting.key === 'alert_objects') {
                    alertObjectsInput.value = setting.value;
                }
            });
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    // Função para salvar uma configuração
    async function saveSetting(key, value) {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value })
            });
            if (!response.ok) throw new Error('Falha ao salvar configuração.');
            
            const result = await response.json();
            alert(result.message); // Exibe uma confirmação simples

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao salvar configuração.');
        }
    }

    // Event listener para o formulário de relatórios
    reportsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const frequency = reportFrequencySelect.value;
        saveSetting('report_frequency', frequency);
    });

    // Event listener para o formulário de alertas
    alertsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const objects = alertObjectsInput.value;
        saveSetting('alert_objects', objects);
    });

    // Carrega as configurações iniciais ao entrar na página
    loadSettings();
});