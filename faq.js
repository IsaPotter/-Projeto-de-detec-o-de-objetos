document.addEventListener('DOMContentLoaded', () => {
    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Adiciona ou remove a classe 'active' para mudar o ícone (ex: de '+' para '-')
            button.classList.toggle('active');

            // Seleciona o painel de conteúdo
            const content = button.parentElement.nextElementSibling;

            // Expande ou recolhe o conteúdo
            if (content.style.maxHeight) {
                content.style.maxHeight = null; // Recolhe
            } else {
                content.style.maxHeight = content.scrollHeight + "px"; // Expande
            }
        });
    });
});