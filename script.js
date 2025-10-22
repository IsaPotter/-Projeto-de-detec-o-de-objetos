// Elementos do DOM
const video = document.getElementById('webcam');
const loadingOverlay = document.getElementById('loading-overlay');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const enableBtn = document.getElementById('enableBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const webcamContainer = document.getElementById('webcamContainer');
const pauseBtn = document.getElementById('pauseBtn');
const objectCountSpan = document.getElementById('objectCount');
const fpsSpan = document.getElementById('fps');
const objectsList = document.getElementById('objectsList');
const clearListBtn = document.getElementById('clearListBtn');
const confidenceSlider = document.getElementById('confidence-slider');
const confidenceValueSpan = document.getElementById('confidence-value');
const volumeSlider = document.getElementById('volume-slider');
const volumeValueSpan = document.getElementById('volume-value');

// Variáveis globais
let model = undefined;
let isWebcamActive = false;
let isPaused = false;
let detectedObjectsMap = new Map();
let alertCooldowns = new Map(); // Mapa para cooldown de alertas no cliente
let unsyncedDetections = new Map(); // Mapa para contagens não sincronizadas
let lastFrameTime = Date.now();
let frameCount = 0;
let confidenceThreshold = 0.5; // Valor inicial do slider

// Cores para as caixas delimitadoras
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
];

// Som de notificação.
// Crie uma pasta 'assets' e coloque um arquivo 'notification.mp3' dentro dela.
const notificationSound = new Audio('assets/notification.mp3');

// Carregar o modelo COCO-SSD
async function loadModel() {
    try {
        updateStatus('loading', 'Carregando modelo de IA...');
        model = await cocoSsd.load();
        updateStatus('ready', 'Modelo carregado! Clique para ativar a webcam.');
        loadingOverlay.classList.add('hidden'); // Esconde a tela de loading
        enableBtn.disabled = false;
        enableBtn.querySelector('.btn-text').textContent = 'Ativar Webcam';
    } catch (error) {
        console.error('Erro ao carregar o modelo:', error);
        updateStatus('loading', 'Erro ao carregar modelo. Recarregue a página.');
        loadingOverlay.classList.add('hidden'); // Esconde a tela de loading mesmo com erro
    }
}

// Atualizar status
function updateStatus(state, message) {
    const indicator = statusBar.querySelector('.status-indicator');
    indicator.className = `status-indicator ${state}`;
    statusText.textContent = message;
}

// Verificar suporte à webcam
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Ativar webcam
async function enableWebcam() {
    if (!hasGetUserMedia()) {
        alert('getUserMedia() não é suportado pelo seu navegador.');
        return;
    }

    // Verifica se o usuário está logado
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        alert('Por favor, faça login para usar esta funcionalidade.');
        window.location.href = 'login.html';
        return;
    }

    if (!model) {
        alert('Aguarde o modelo ser carregado.');
        return;
    }

    if (isWebcamActive) {
        // Desativar webcam
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        isWebcamActive = false;
        webcamContainer.classList.remove('active');
        enableBtn.querySelector('.btn-icon').classList.replace('bi-stop-circle-fill', 'bi-webcam-fill');
        pauseBtn.style.display = 'none'; // Esconde o botão de pausa
        isPaused = false; // Reseta o estado de pausa
        enableBtn.querySelector('.btn-text').textContent = 'Ativar Webcam';

        syncStatsWithServer(); // Sincroniza as estatísticas ao desativar

        updateStatus('ready', 'Webcam desativada. Clique para ativar novamente.');
        return;
    }

    try {
        updateStatus('loading', 'Acessando webcam...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });

        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
            // Configurar canvas com as dimensões do vídeo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            isWebcamActive = true;
            webcamContainer.classList.add('active');
            enableBtn.querySelector('.btn-icon').classList.replace('bi-webcam-fill', 'bi-stop-circle-fill');
            pauseBtn.style.display = 'inline-flex'; // Mostra o botão de pausa
            enableBtn.querySelector('.btn-text').textContent = 'Desativar Webcam';
            updateStatus('active', 'Webcam ativa - Detectando objetos...');
            
            // Iniciar detecção
            predictWebcam();
        });
    } catch (error) {
        console.error('Erro ao acessar webcam:', error);
        alert('Não foi possível acessar a webcam. Verifique as permissões.');
        updateStatus('ready', 'Erro ao acessar webcam. Tente novamente.');
    }
}

// Função principal de detecção
async function predictWebcam() {
    if (!isWebcamActive) return; // Se a webcam for desativada, para tudo.

    // Se estiver pausado, continua o loop mas não processa nada.
    if (isPaused) {
        requestAnimationFrame(predictWebcam);
        return;
    }

    try {
        // Detectar objetos no frame atual
        const predictions = await model.detect(video);
        
        // Limpar canvas e predições anteriores
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Atualizar contador de objetos
        objectCountSpan.textContent = predictions.length;
        
        // Desenhar predições
        predictions.forEach((prediction, index) => {
            // Filtrar predições com base no slider de confiança
            if (prediction.score > confidenceThreshold) {
                drawPrediction(prediction, index);
                const translatedName = translateObjectName(prediction.class);
                updateDetectedObjects(translatedName);
                triggerAlertIfNeeded(translatedName);
            }
        });
        
        // Calcular e atualizar FPS
        updateFPS();
        
        // Continuar detecção
        requestAnimationFrame(predictWebcam);
    } catch (error) {
        console.error('Erro na detecção:', error);
        requestAnimationFrame(predictWebcam);
    }
}

// Desenhar predição no canvas
function drawPrediction(prediction, index) {
    const [x, y, width, height] = prediction.bbox;
    const color = colors[index % colors.length];
    
    // Desenhar caixa delimitadora
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Desenhar fundo do rótulo
    const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
    ctx.font = 'bold 16px Arial';
    const textWidth = ctx.measureText(label).width;
    const textHeight = 20;
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y - textHeight - 5, textWidth + 10, textHeight + 5);
    
    // Desenhar texto do rótulo
    ctx.fillStyle = 'white';
    ctx.fillText(label, x + 5, y - 8);
}

// Atualizar lista de objetos detectados
function updateDetectedObjects(className) {
    if (detectedObjectsMap.has(className)) {
        detectedObjectsMap.set(className, detectedObjectsMap.get(className) + 1);
    } else {
        // Novo tipo de objeto detectado, toca o som
        detectedObjectsMap.set(className, 1);
        notificationSound.play().catch(error => {
            // O autoplay pode ser bloqueado pelo navegador se não houver interação do usuário.
            console.warn("Não foi possível tocar o som de notificação:", error);
        });
    }
    
    // Limitar o tamanho do mapa (manter apenas os últimos 50 objetos únicos)
    if (detectedObjectsMap.size > 50) {
        const firstKey = detectedObjectsMap.keys().next().value;
        detectedObjectsMap.delete(firstKey);
    }
    
    // Atualiza o mapa de contagens não sincronizadas
    if (unsyncedDetections.has(className)) {
        unsyncedDetections.set(className, unsyncedDetections.get(className) + 1);
    } else {
        unsyncedDetections.set(className, 1);
    }

    renderDetectedObjects();
}

// Verifica se um alerta deve ser acionado para um objeto
function triggerAlertIfNeeded(objectName) {
    const token = localStorage.getItem('sessionToken');
    if (!token) return;

    const cooldownMinutes = 5; // Cooldown de 5 minutos no cliente para evitar spam de requisições
    const now = Date.now();

    if (alertCooldowns.has(objectName)) {
        const lastAlertTime = alertCooldowns.get(objectName);
        if ((now - lastAlertTime) / 60000 < cooldownMinutes) {
            return; // Ainda em cooldown
        }
    }

    // Define o cooldown e envia a requisição
    alertCooldowns.set(objectName, now);

    fetch('/api/trigger-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ objectName: objectName })
    })
    .then(res => res.json().then(data => console.log('Resposta do alerta:', data.message)))
    .catch(err => console.error('Erro ao acionar alerta:', err));
}

// Renderizar lista de objetos detectados
function renderDetectedObjects() {
    if (detectedObjectsMap.size === 0) {
        objectsList.innerHTML = '<p class="empty-state">Nenhum objeto detectado ainda...</p>';
        return;
    }
    
    // Ordenar por contagem (mais frequentes primeiro)
    const sortedObjects = Array.from(detectedObjectsMap.entries())
        .sort((a, b) => b[1] - a[1]);
    
    objectsList.innerHTML = sortedObjects
        .map(([name, count]) => `
            <div class="object-tag">
                <span>${name}</span>
                <span class="count">${count}</span>
            </div>
        `)
        .join('');
}

// Traduzir nomes de objetos (alguns exemplos comuns)
function translateObjectName(name) {
    const translations = {
        'person': 'Pessoa',
        'bicycle': 'Bicicleta',
        'car': 'Carro',
        'motorcycle': 'Motocicleta',
        'airplane': 'Avião',
        'bus': 'Ônibus',
        'train': 'Trem',
        'truck': 'Caminhão',
        'boat': 'Barco',
        'traffic light': 'Semáforo',
        'fire hydrant': 'Hidrante',
        'stop sign': 'Placa de Pare',
        'parking meter': 'Parquímetro',
        'bench': 'Banco',
        'bird': 'Pássaro',
        'cat': 'Gato',
        'dog': 'Cachorro',
        'horse': 'Cavalo',
        'sheep': 'Ovelha',
        'cow': 'Vaca',
        'elephant': 'Elefante',
        'bear': 'Urso',
        'zebra': 'Zebra',
        'giraffe': 'Girafa',
        'backpack': 'Mochila',
        'umbrella': 'Guarda-chuva',
        'handbag': 'Bolsa',
        'tie': 'Gravata',
        'suitcase': 'Mala',
        'frisbee': 'Frisbee',
        'skis': 'Esquis',
        'snowboard': 'Prancha de Snowboard',
        'sports ball': 'Bola',
        'kite': 'Pipa',
        'baseball bat': 'Taco de Beisebol',
        'baseball glove': 'Luva de Beisebol',
        'skateboard': 'Skate',
        'surfboard': 'Prancha de Surf',
        'tennis racket': 'Raquete de Tênis',
        'bottle': 'Garrafa',
        'wine glass': 'Taça de Vinho',
        'cup': 'Xícara',
        'fork': 'Garfo',
        'knife': 'Faca',
        'spoon': 'Colher',
        'bowl': 'Tigela',
        'banana': 'Banana',
        'apple': 'Maçã',
        'sandwich': 'Sanduíche',
        'orange': 'Laranja',
        'broccoli': 'Brócolis',
        'carrot': 'Cenoura',
        'hot dog': 'Cachorro-quente',
        'pizza': 'Pizza',
        'donut': 'Rosquinha',
        'cake': 'Bolo',
        'chair': 'Cadeira',
        'couch': 'Sofá',
        'potted plant': 'Planta em Vaso',
        'bed': 'Cama',
        'dining table': 'Mesa de Jantar',
        'toilet': 'Vaso Sanitário',
        'tv': 'TV',
        'laptop': 'Laptop',
        'mouse': 'Mouse',
        'remote': 'Controle Remoto',
        'keyboard': 'Teclado',
        'cell phone': 'Celular',
        'microwave': 'Micro-ondas',
        'oven': 'Forno',
        'toaster': 'Torradeira',
        'sink': 'Pia',
        'refrigerator': 'Geladeira',
        'book': 'Livro',
        'clock': 'Relógio',
        'vase': 'Vaso de Flor',
        'scissors': 'Tesoura',
        'teddy bear': 'Ursinho de Pelúcia',
        'hair drier': 'Secador de Cabelo',
        'toothbrush': 'Escova de Dentes'
    };
    
    return translations[name] || name;
}

// Calcular e atualizar FPS
function updateFPS() {
    frameCount++;
    const currentTime = Date.now();
    const elapsed = currentTime - lastFrameTime;
    
    // Atualizar FPS a cada segundo
    if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        fpsSpan.textContent = fps;
        frameCount = 0;
        lastFrameTime = currentTime;
    }
}

// Sincroniza as estatísticas com o servidor
async function syncStatsWithServer() {
    const token = localStorage.getItem('sessionToken');
    if (!token || unsyncedDetections.size === 0) {
        return; // Não sincroniza se não houver usuário ou nada novo
    }

    // Converte o Map para um objeto simples para enviar como JSON
    const statsObject = Object.fromEntries(unsyncedDetections);
    
    try {
        await fetch('/api/stats/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ stats: statsObject })
        });
        // Se a sincronização for bem-sucedida, limpa o mapa de não sincronizados
        unsyncedDetections.clear();
        console.log('Estatísticas sincronizadas com o servidor.');
    } catch (error) {
        console.error('Falha ao sincronizar estatísticas:', error);
    }
}

// Carregar histórico do localStorage
async function loadHistoryFromStorage() {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        return; // Se não há token, não há histórico para carregar.
    }

    try {
        const response = await fetch(`/api/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await response.json();
        // As estatísticas vêm como um array de objetos: [{object_name: 'person', detection_count: 10}]
        // Convertemos para o formato Map que a aplicação usa
        const statsMap = new Map(stats.map(item => [item.object_name, item.detection_count]));
        detectedObjectsMap = statsMap;
        renderDetectedObjects();
    } catch (error) {
        console.error("Erro ao carregar histórico do servidor:", error);
    }
}

// Carregar e aplicar configurações salvas (volume)
function loadSettings() {
    const savedVolume = localStorage.getItem('notificationVolume');
    if (savedVolume !== null) {
        const volume = parseFloat(savedVolume);
        notificationSound.volume = volume;
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
        if (volumeValueSpan) {
            volumeValueSpan.textContent = `${Math.round(volume * 100)}%`;
        }
    } else {
        // Valor padrão se nada estiver salvo
        notificationSound.volume = 0.5;
    }
}

// Event listeners
enableBtn.addEventListener('click', enableWebcam);
confidenceSlider.addEventListener('input', (e) => {
    confidenceThreshold = parseFloat(e.target.value);
    confidenceValueSpan.textContent = `${Math.round(confidenceThreshold * 100)}%`;
});

volumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    notificationSound.volume = volume;
    volumeValueSpan.textContent = `${Math.round(volume * 100)}%`;
    localStorage.setItem('notificationVolume', volume); // Salva a preferência
});

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused; // Alterna o estado de pausa
    const icon = pauseBtn.querySelector('.btn-icon');
    const text = pauseBtn.querySelector('.btn-text');

    if (isPaused) {
        icon.classList.replace('bi-pause-fill', 'bi-play-fill');
        text.textContent = 'Continuar';
        updateStatus('active', 'Detecção pausada.');
    } else {
        icon.classList.replace('bi-play-fill', 'bi-pause-fill');
        text.textContent = 'Pausar';
        updateStatus('active', 'Webcam ativa - Detectando objetos...');
    }
});

clearListBtn.addEventListener('click', () => {
    detectedObjectsMap.clear(); // Limpa o mapa de objetos
    // Futuramente, pode-se adicionar uma chamada à API para limpar as estatísticas no servidor
    renderDetectedObjects(); // Renderiza a lista novamente (agora vazia)
});

// Adiciona um aviso antes de fechar a aba se a webcam estiver ativa
window.addEventListener('beforeunload', (event) => {
    if (isWebcamActive) {
        // A maioria dos navegadores modernos ignora a mensagem customizada,
        syncStatsWithServer(); // Tenta sincronizar antes de sair
        // mas é necessário para acionar o prompt de confirmação.
        event.preventDefault(); // Padrão W3C
        event.returnValue = ''; // Para navegadores mais antigos
    }
});


// Inicializar aplicativo
loadHistoryFromStorage(); // Carrega o histórico salvo ao iniciar
loadSettings(); // Carrega as configurações de volume
loadModel();
