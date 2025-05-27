// Palavras e config jogo
const CONFIG = {
    TARGET_WORDS: [
        "SOLAR", "LUNAR", "STARS", "ROVER", "METEO",
        "HELIO", "FOGOS", "NUVEM", "MAGMA", "CINZA",
        "VIRGO", "ZENIT", "NADIR", "NIGHT", "SIGMA",
        "GAMMA", "FOTON", "MASSA", "AUROR", "COMET",
        "RADIO", "NOMAD", "FIELD", "GIANT", "SPACE",
        "IONIC", "NEBUL", "SATUR", "LIGHT", "FOCUS",
        "DUSTY", "BLACK", "SHINE", "NAVEL", "LUNAS",
        "WORLD", "NORTH", "SOUTH", "CRUZE", "STORM",
        "CLOUD", "WAVES", "BLAZE", "SKIES", "STELL"
    ],
    MAX_LETTERS: 5,
    MAX_HINTS: 3,
    MAX_ATTEMPTS: 6
};

// Elementos DOM
const elements = {
    guessInput: document.getElementById('guessInput'),
    submitBtn: document.getElementById('submitBtn'),
    resetBtn: document.getElementById('resetBtn'),
    messageArea: document.getElementById('messageArea'),
    attemptsGrid: document.getElementById('attemptsGrid'),
    targetWord: document.getElementById('targetWord'),
    attemptsCount: document.getElementById('attemptsCount'),
    hintsCount: document.getElementById('hintsCount'),
    infoIcon: document.getElementById('infoIcon'),
    infoBox: document.getElementById('infoBox'),
    infoOverlay: document.getElementById('infoOverlay'),
    hintBtn: document.getElementById('hintBtn'),
    currentYear: document.getElementById('currentYear'),
    themeToggle: document.querySelector('.theme-toggle'),
    victoryModal: document.getElementById('victoryModal'),
    defeatModal: document.getElementById('defeatModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    correctWord: document.getElementById('correctWord')
};

// Estado Jogo
let gameState = {
    targetWord: "",
    attempts: 0,
    hintsUsed: 0,
    gameOver: false,
    revealedLetters: [],
    correctLetters: new Set(),
    usedLetters: new Set()
};

// Configurações Usuário
let userSettings = {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
};

// Inicialização Jogo
function initGame() {
    gameState.targetWord = CONFIG.TARGET_WORDS[Math.floor(Math.random() * CONFIG.TARGET_WORDS.length)];
    gameState.attempts = 0;
    gameState.hintsUsed = 0;
    gameState.gameOver = false;
    gameState.revealedLetters = [];
    gameState.correctLetters = new Set();
    gameState.usedLetters = new Set();

    elements.attemptsGrid.innerHTML = '';
    elements.messageArea.textContent = '';
    elements.messageArea.className = 'message-area';
    elements.targetWord.innerHTML = '';
    elements.attemptsCount.textContent = '0';
    elements.hintsCount.textContent = CONFIG.MAX_HINTS;
    elements.guessInput.value = '';
    elements.guessInput.disabled = false;
    elements.guessInput.focus();

    for (let i = 0; i < CONFIG.MAX_LETTERS; i++) {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter';
        letterBox.textContent = '?';
        elements.targetWord.appendChild(letterBox);
    }

    loadSettings();
    hideModals();
}

// Verificação palpite
function checkGuess() {
    if (gameState.gameOver) return;

    const guess = elements.guessInput.value.toUpperCase().trim();

    if (guess.length !== CONFIG.MAX_LETTERS) {
        showMessage(`A palavra deve ter ${CONFIG.MAX_LETTERS} letras!`, 'error');
        return;
    }

    if (!/^[A-ZÀ-Ú]+$/.test(guess)) {
        showMessage('Apenas letras são permitidas!', 'error');
        return;
    }

    gameState.attempts++;
    elements.attemptsCount.textContent = gameState.attempts;

    const attemptRow = document.createElement('div');
    attemptRow.className = 'attempt-row';

    const targetLetters = gameState.targetWord.split('');
    const guessLetters = guess.split('');
    const result = Array(CONFIG.MAX_LETTERS).fill(null);

    // Verificar letras corretas
    for (let i = 0; i < CONFIG.MAX_LETTERS; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = 'correct';
            targetLetters[i] = null;
            gameState.correctLetters.add(guessLetters[i]);
        }
    }

    // Verificar letras presentes
    for (let i = 0; i < CONFIG.MAX_LETTERS; i++) {
        if (result[i] !== 'correct') {
            const foundIndex = targetLetters.indexOf(guessLetters[i]);
            if (foundIndex !== -1) {
                result[i] = 'present';
                targetLetters[foundIndex] = null;
            } else {
                result[i] = 'absent';
            }
            gameState.usedLetters.add(guessLetters[i]);
        }
    }

    // Criar elementos visuais
    for (let i = 0; i < CONFIG.MAX_LETTERS; i++) {
        const letterBox = document.createElement('div');
        letterBox.className = `letter ${result[i]} flip-in`;
        letterBox.style.animationDelay = `${i * 0.1}s`;
        letterBox.textContent = guessLetters[i];
        attemptRow.appendChild(letterBox);
    }

    elements.attemptsGrid.appendChild(attemptRow);

    // Verificar vitória
    if (guess === gameState.targetWord) {
        gameState.gameOver = true;
        showModal('victory');
        elements.guessInput.disabled = true;
        saveGameStats(true);
        return;
    }

    // Verificar derrota
    if (gameState.attempts >= CONFIG.MAX_ATTEMPTS) {
        gameState.gameOver = true;
        showModal('defeat');
        elements.correctWord.textContent = gameState.targetWord;
        elements.guessInput.disabled = true;
        saveGameStats(false);
        return;
    }

    elements.guessInput.value = '';
    showMessage('Continue explorando o cosmos...', 'info');
}

// Sistema dicas
function giveHint() {
    if (gameState.gameOver) return;

    const correctCount = gameState.correctLetters.size;
    if (correctCount >= 4) {
        showMessage('Você já descobriu quase toda a palavra!', 'error');
        return;
    }
    if (correctCount >= 3 && gameState.hintsUsed >= 1) {
        showMessage('Só pode usar 1 dica após acertar 3 letras!', 'error');
        return;
    }
    if (gameState.hintsUsed >= CONFIG.MAX_HINTS) {
        showMessage('Todas as dicas foram usadas!', 'error');
        return;
    }

    const availableIndices = [];
    for (let i = 0; i < CONFIG.MAX_LETTERS; i++) {
        if (!gameState.revealedLetters.includes(i) && 
            !gameState.correctLetters.has(gameState.targetWord[i])) {
            availableIndices.push(i);
        }
    }

    if (availableIndices.length === 0) {
        showMessage('Não há mais letras para revelar!', 'info');
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const correctLetter = gameState.targetWord[randomIndex];

    gameState.revealedLetters.push(randomIndex);
    gameState.hintsUsed++;
    elements.hintsCount.textContent = CONFIG.MAX_HINTS - gameState.hintsUsed;

    elements.targetWord.children[randomIndex].textContent = correctLetter;
    elements.targetWord.children[randomIndex].classList.add('correct', 'float');
    showMessage(`Dica: Posição ${randomIndex + 1} → ${correctLetter}`, 'hint');
}

// Mostrar modais
function showModal(modalType) {
    elements.modalOverlay.classList.add('active');
    if(modalType === 'victory') {
        elements.victoryModal.classList.add('active');
        const rocket = elements.victoryModal.querySelector('.rocket');
        rocket.style.animation = 'none';
        setTimeout(() => rocket.style.animation = '', 10);
    } else {
        elements.defeatModal.classList.add('active');
    }
}

// Fechar modais
function hideModals() {
    elements.modalOverlay.classList.remove('active');
    elements.victoryModal.classList.remove('active');
    elements.defeatModal.classList.remove('active');
}

// Mostrar mensagens
function showMessage(message, type = 'info') {
    elements.messageArea.textContent = message;
    elements.messageArea.className = `message-area message-${type}`;
    
    if (type === 'error') {
        elements.messageArea.classList.add('bounce');
        setTimeout(() => {
            elements.messageArea.classList.remove('bounce');
        }, 500);
    }
}

// Sistema tema
function toggleTheme() {
    userSettings.darkMode = !userSettings.darkMode;
    updateTheme();
    localStorage.setItem('darkMode', userSettings.darkMode);
}

function updateTheme() {
    const theme = userSettings.darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function loadSettings() {
    const themeSetting = localStorage.getItem('darkMode');
    if (themeSetting !== null) {
        userSettings.darkMode = themeSetting === 'true';
    } else {
        userSettings.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateTheme();
}

// Estatísticas jogo
function saveGameStats(win) {
    const stats = JSON.parse(localStorage.getItem('wordleStats')) || {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayed: null
    };

    const today = new Date().toISOString().slice(0, 10);
    
    if (stats.lastPlayed === today) return;
    
    stats.gamesPlayed++;
    stats.lastPlayed = today;
    
    if (win) {
        stats.gamesWon++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.maxStreak) {
            stats.maxStreak = stats.currentStreak;
        }
    } else {
        stats.currentStreak = 0;
    }
    
    localStorage.setItem('wordleStats', JSON.stringify(stats));
}

// Event Listeners
elements.submitBtn.addEventListener('click', checkGuess);
elements.resetBtn.addEventListener('click', initGame);
elements.hintBtn.addEventListener('click', giveHint);
elements.themeToggle.addEventListener('click', toggleTheme);

document.querySelectorAll('.new-game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        hideModals();
        initGame();
    });
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', hideModals);
});

elements.guessInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkGuess();
    elements.guessInput.value = elements.guessInput.value.toUpperCase();
});

// Inicialização
elements.currentYear.textContent = new Date().getFullYear();
initGame();