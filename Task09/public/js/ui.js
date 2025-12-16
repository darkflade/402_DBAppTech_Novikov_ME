export function setupScreens(onStart) {
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-game-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    startBtn.addEventListener('click', () => {
        const playerName = document.getElementById('player-name').value;
        const boardSize = parseInt(document.getElementById('board-size').value, 10);
        
        if (boardSize >= 3 && boardSize <= 10) {
            setupScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            onStart(playerName, boardSize);
        } else {
            alert('Размер поля должен быть от 3 до 10.');
        }
    });

    newGameBtn.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        document.getElementById('new-game-btn').classList.add('hidden');
    });
}

export function renderBoard(board, onCellClick) {
    const container = document.getElementById('board-container');
    container.innerHTML = '';
    const N = board.getSize();
    container.style.gridTemplateColumns = `repeat(${N}, 60px)`;
    container.style.gridTemplateRows = `repeat(${N}, 60px)`;

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const symbol = board.get(i, j);
            if (symbol !== '.') {
                cell.textContent = symbol;
                cell.classList.add(symbol);
            } else {
                cell.addEventListener('click', () => onCellClick(i, j), { once: true });
            }
            container.appendChild(cell);
        }
    }
}

export function updateMessage(message) {
    document.getElementById('status-message').textContent = message;
}

export function showGameOver(winner) {
    const message = winner === 'DRAW' ? 'Ничья!' : `${winner} победил!`;
    updateMessage(message);
    document.getElementById('new-game-btn').classList.remove('hidden');
}

export function setupHistory(onShowHistory) {
    document.getElementById('show-history-btn').addEventListener('click', onShowHistory);
}

export function renderHistory(games, onReplayClick) {
    const list = document.getElementById('game-list');
    list.innerHTML = '';
    if (games.length === 0) {
        list.innerHTML = '<li>История игр пуста.</li>';
        return;
    }
    games.forEach(game => {
        const item = document.createElement('li');
        
        const replayBtn = document.createElement('button');
        replayBtn.textContent = 'Replay';
        replayBtn.classList.add('replay-btn');
        replayBtn.dataset.gameId = game.id;
        replayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onReplayClick(game.id);
        });
        
        const winnerMsg = game.winner_symbol === 'DRAW' 
            ? 'Ничья' 
            : `Победитель: ${game.winner_symbol}`;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `[${new Date(game.date).toLocaleString()}] ${game.player_name} (${game.human_symbol}) - ${winnerMsg}, поле ${game.board_size}x${game.board_size}`;
        
        item.appendChild(textSpan);
        item.appendChild(replayBtn);
        list.appendChild(item);
    });
}