document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const currentTheme = localStorage.getItem('theme');

    // Função para aplicar o tema
    const applyTheme = (theme) => {
        // Remove classes de tema anteriores
        document.body.classList.remove('dark-mode', 'high-contrast-mode');

        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (theme === 'high-contrast') {
            document.body.classList.add('high-contrast-mode');
        }
        // O tema 'light' é o padrão, não precisa de classe
    };

    // Aplica o tema salvo ao carregar a página
    if (currentTheme) {
        applyTheme(currentTheme);
        // Atualiza o valor do select para corresponder ao tema salvo
        themeSelect.value = currentTheme;
    }

    // Evento de mudança para o seletor de tema
    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        
        // Salva a nova preferência no localStorage
        localStorage.setItem('theme', selectedTheme);
        // Aplica o novo tema
        applyTheme(selectedTheme);
    });
});