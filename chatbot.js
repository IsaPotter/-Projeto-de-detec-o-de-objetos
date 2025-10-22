document.addEventListener('DOMContentLoaded', () => {
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const chatBody = document.querySelector('.chat-body'); // Usado para verificar se o chat está aberto
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    // Abrir e fechar o chat
    chatFab.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        chatFab.classList.toggle('open');
        // Se o chat está abrindo e não tem mensagens, adiciona a saudação
        if (chatWindow.classList.contains('open') && chatMessages.children.length === 0) {
            setTimeout(() => {
                addMessage('bot', 'Olá! 👋 Sou seu assistente virtual. Como posso ajudar?');
            }, 300);
        }
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatFab.classList.remove('open');
    });

    // Enviar mensagem
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            addMessage('user', userMessage);
            chatInput.value = '';
            chatInput.disabled = true; // Desabilita o input enquanto o bot responde
            
            showTypingIndicator();

            // Simula um tempo de "pensamento" e depois digita a resposta
            setTimeout(() => {
                const botResponse = getBotResponse(userMessage);
                typeMessage(botResponse);
                chatInput.disabled = false; // Reabilita o input
                chatInput.focus();
            }, 1200); // Atraso para o bot "pensar"
        }
    });

    // Adiciona mensagem à janela de chat
    function addMessage(sender, text, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        
        const p = document.createElement('p');
        if (isTyping) {
            // Lógica de digitação será tratada por typeMessage
        } else {
            p.innerHTML = text; // Permite renderizar links HTML
        }
        messageElement.appendChild(p);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return p; // Retorna o parágrafo para a função de digitação
    }

    // Efeito de digitação
    function typeMessage(text) {
        removeTypingIndicator();
        const p = addMessage('bot', '', true); // Cria a bolha de mensagem vazia
        let i = 0;
        const speed = 30; // Velocidade da digitação em milissegundos

        function typeWriter() {
            if (i < text.length) {
                p.innerHTML += text.charAt(i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(typeWriter, speed);
            }
        }
        typeWriter();
    }

    // Mostra o indicador "digitando..."
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('chat-message', 'bot-message', 'typing-indicator');
        typingElement.innerHTML = `<p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>`;
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove o indicador "digitando..."
    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Lógica de resposta do bot aprimorada
    function getBotResponse(userInput) {
        const lowerInput = userInput.toLowerCase();

        // Palavras-chave para cada tópico
        const keywords = {
            saudacao: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ei', 'hey'],
            preco: ['preço', 'plano', 'premium', 'custo', 'pagar', 'assinatura', 'gratuito', 'free'],
            uso: ['como funciona', 'usar', 'iniciar', 'começar', 'webcam', 'ativar', 'detecção', 'objeto', 'reconhecer', 'identificar'],
            privacidade: ['privacidade', 'seguro', 'dados', 'armazenar', 'segurança', 'protegido'],
            instalacao: ['instalar', 'baixar', 'app', 'aplicativo', 'download'],
            suporte: ['contato', 'suporte', 'ajuda', 'problema', 'erro', 'bug'],
            sobre: ['quem criou', 'desenvolveu', 'sobre', 'projeto', 'desenvolvedor', 'isabela'],
            faq: ['faq', 'perguntas', 'duvidas', 'frequentes'],
            relatorios: ['relatório', 'relatorios', 'dados', 'estatísticas', 'estatisticas', 'gráfico', 'grafico'],
            perfil: ['perfil', 'conta', 'login', 'cadastro', 'registrar', 'senha', 'alterar senha'],
            alertas: ['alerta', 'notificação', 'notificacao', 'aviso', 'monitorar', 'monitoramento'],
            autenticacao: ['2fa', 'dois fatores', 'autenticação', 'autenticacao', 'google', 'github', 'oauth'],
            sessoes: ['sessão', 'sessao', 'logout', 'desconectar', 'revogar'],
            agradecimento: ['obrigado', 'valeu', 'agradecido', 'thanks', 'thank you']
        };

        // Função auxiliar para verificar se alguma palavra-chave está presente
        function hasKeyword(category) {
            return keywords[category].some(word => lowerInput.includes(word));
        }

        // Respostas por categoria
        if (hasKeyword('saudacao')) {
            return 'Olá! 👋 Como posso te ajudar hoje?';
        }

        if (hasKeyword('preco')) {
            return 'Temos um plano Gratuito com detecção básica e um Premium com recursos avançados, como detecção de múltiplos objetos, relatórios e alertas. Você pode ver todos os detalhes na nossa <a href="assinatura.html">página de assinatura</a>.';
        }

        if (hasKeyword('uso')) {
            return 'É simples! Na página inicial, clique em "Ativar Webcam", permita o acesso à câmera e posicione objetos na frente dela. A detecção é automática usando TensorFlow.js! Suportamos detecção de pessoas, animais, objetos comuns e muito mais!';
        }

        if (hasKeyword('privacidade')) {
            return 'Sua privacidade é nossa prioridade. Todo o processamento acontece no seu navegador, e nenhuma imagem é enviada para nossos servidores. Saiba mais na nossa <a href="politica.html">Política de Privacidade</a>.';
        }

        if (hasKeyword('instalacao')) {
            return 'Não precisa instalar nada! Nosso sistema funciona 100% online, direto no seu navegador. Compatível com desktop e mobile.';
        }

        if (hasKeyword('suporte')) {
            return 'Para suporte, você pode entrar em contato conosco através das redes sociais listadas no rodapé do site ou acessar nossa <a href="faq.html">FAQ</a>.';
        }

        if (hasKeyword('sobre')) {
            return 'Este projeto foi desenvolvido por Isabela Paiva Novais, utilizando tecnologias de ponta como TensorFlow.js para detecção de objetos em tempo real.';
        }

        if (hasKeyword('faq')) {
            return 'Confira nossa <a href="faq.html">página de FAQ</a> para respostas às perguntas mais comuns sobre o uso do sistema.';
        }

        if (hasKeyword('relatorios')) {
            return 'No plano Premium, você tem acesso a relatórios detalhados das detecções, com gráficos e estatísticas. Acesse a <a href="relatorios.html">página de relatórios</a> para mais informações.';
        }

        if (hasKeyword('perfil')) {
            return 'Gerencie sua conta na <a href="perfil.html">página de perfil</a>. Lá você pode atualizar informações, alterar senha, gerenciar assinatura e configurar alertas.';
        }

        if (hasKeyword('alertas')) {
            return 'Configure alertas para objetos específicos no seu perfil. Quando detectados, você recebe notificações por e-mail. Disponível no plano Premium!';
        }

        if (hasKeyword('autenticacao')) {
            return 'Oferecemos login seguro com 2FA (autenticação de dois fatores), além de opções via Google e GitHub. Configure no seu perfil para maior segurança.';
        }

        if (hasKeyword('sessoes')) {
            return 'Você pode gerenciar suas sessões ativas no perfil, revogando acessos antigos se necessário. Sempre faça logout ao terminar.';
        }

        if (hasKeyword('agradecimento')) {
            return 'De nada! 😊 Se precisar de mais alguma coisa, é só perguntar.';
        }

        // Resposta padrão aprimorada com sugestões e tentativa de resposta genérica
        // Tentar encontrar palavras-chave parciais ou contextos
        const partialKeywords = {
            'detecção': 'Nosso sistema detecta objetos em tempo real usando IA. Suportamos pessoas, animais e objetos comuns!',
            'preço': 'Confira nossos planos na <a href="assinatura.html">página de assinatura</a>. Temos gratuito e premium.',
            'ajuda': 'Estou aqui para ajudar! Pergunte sobre detecção, planos, privacidade ou suporte.',
            'problema': 'Se você está com problemas, acesse nossa <a href="faq.html">FAQ</a> ou entre em contato pelo suporte.',
            'como': 'Para usar: clique em "Ativar Webcam", permita acesso e posicione objetos. É automático!',
            'o que': 'Somos um sistema de detecção de objetos em tempo real com TensorFlow.js.',
            'por que': 'Para segurança, monitoramento ou aprendizado. Tudo processado localmente no navegador.',
            'quando': 'O sistema funciona 24/7 online, sem instalação necessária.',
            'onde': 'Acesse de qualquer dispositivo com câmera: desktop ou mobile.',
            'quem': 'Desenvolvido por Isabela Paiva Novais. Equipe especializada em IA e web.',
            'qual': 'Qual a sua dúvida específica? Posso ajudar com detecção, planos ou suporte.'
        };

        for (const [key, response] of Object.entries(partialKeywords)) {
            if (lowerInput.includes(key)) {
                return response;
            }
        }

        // Se ainda não encontrou, resposta genérica com sugestões
        return 'Hmm, não tenho certeza sobre isso. Você pode perguntar sobre detecção de objetos, planos, como usar, privacidade, alertas, 2FA, relatórios, perfil ou visite nossa <a href="faq.html">FAQ</a> para mais detalhes. O que mais posso esclarecer?';
    }
});