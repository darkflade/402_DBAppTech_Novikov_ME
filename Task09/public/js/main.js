import Board from './ai/Board.js';
import Computer from './ai/Computer.js';
import * as db from './db.js';
import * as ui from './ui.js';

let board, ai, playerSymbol, computerSymbol, turn, M, gameInProgress;
let moveNum = 1;
let isReplaying = false;
let currentGameId = null;

async function startGame(playerName, boardSize) {
    const N = boardSize;
    M = Math.min((N <= 3) ? 3 : 5, N);

    board = new Board(N);
    ai = new Computer(board, M);

    playerSymbol = Math.random() > 0.5 ? 'X' : 'O';
    computerSymbol = (playerSymbol === 'X') ? 'O' : 'X';
    turn = 'X';
    gameInProgress = true;
    moveNum = 1;

    const gameData = {
        date: new Date().toISOString(),
        player_name: playerName,
        board_size: N,
        human_symbol: playerSymbol
    };
    
    currentGameId = await db.createGame(gameData);
    if (!currentGameId) {
        alert("Ошибка связи с сервером. Игра не будет сохранена.");
    }

    ui.updateMessage(turn === playerSymbol ? 'Ваш ход' : 'Ход компьютера');
    ui.renderBoard(board, handlePlayerMove);

    if (turn === computerSymbol) {
        setTimeout(handleComputerMove, 500);
    }
}

async function handlePlayerMove(x, y) {
    if (!gameInProgress || turn !== playerSymbol || isReplaying) return; 

    board.set(x, y, playerSymbol);
    // Отправляем ход на сервер
    await recordMove(x, y, playerSymbol);
    
    ui.renderBoard(board, handlePlayerMove);

    if (checkGameOver(x, y, playerSymbol)) return;

    turn = computerSymbol;
    ui.updateMessage('Ход компьютера');
    setTimeout(handleComputerMove, 500);
}

async function handleComputerMove() {
    if (!gameInProgress) return;

    const [x, y] = ai.chooseMove(board);
    board.set(x, y, computerSymbol);
    await recordMove(x, y, computerSymbol);

    ui.renderBoard(board, handlePlayerMove);

    if (checkGameOver(x, y, computerSymbol)) return;

    turn = playerSymbol;
    ui.updateMessage('Ваш ход');
}

async function recordMove(x, y, symbol, winner = null) {
    if (!currentGameId) return;

    const moveData = {
        num: moveNum++,
        x: x,
        y: y,
        symbol: symbol
    };
    if (winner) {
        moveData.winner = winner;
    }

    await db.saveMove(currentGameId, moveData);
}

function checkGameOver(x, y, lastSymbol) {
    if (board.winAt(x, y, M)) {
        endGame(lastSymbol);
        return true;
    }
    if (board.isDraw()) {
        endGame('DRAW');
        return true;
    }
    return false;
}

async function endGame(winner) {
    gameInProgress = false;
    ui.showGameOver(winner);

    if (currentGameId) {
        await fetch(`/step/${currentGameId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                num: moveNum, 
                x: -1, y: -1, symbol: '',
                winner: winner 
            })
        });
    }
}

async function showHistory() {
    const games = await db.listGames();
    ui.renderHistory(games, handleReplayRequest);
}

async function handleReplayRequest(gameId) {
    const gameData = await db.getGameById(gameId);
    if (gameData) {
        replayGame(gameData);
    }
}

function replayGame(gameData) {
    isReplaying = true;
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('new-game-btn').classList.add('hidden');

    const moves = gameData.moves || [];
    const replayBoard = new Board(gameData.board_size);

    ui.updateMessage(`Воспроизведение игры от ${new Date(gameData.date).toLocaleString()}`);
    ui.renderBoard(replayBoard, () => {});
    let currentMove = 0;

    function nextMove() {
        if (currentMove >= moves.length) {
            isReplaying = false;
            const winner = gameData.winner_symbol;
            const message = !winner ? 'Игра не закончена' : (winner === 'DRAW' ? 'Ничья!' : `${winner} победил!`);
            ui.updateMessage(`Воспроизведение завершено. ${message}`);
            document.getElementById('new-game-btn').classList.remove('hidden');
            return;
        }

        const move = moves[currentMove];
        if (move.x !== -1) {
            replayBoard.set(move.x, move.y, move.symbol);
            ui.renderBoard(replayBoard, () => {});
        }

        currentMove++;
        setTimeout(nextMove, 700);
    }

    nextMove();
}

ui.setupScreens(startGame);
ui.setupHistory(showHistory);