export default class Computer {
    constructor(board, M = 3) {
        this.board = board;
        this.M = M;
        this.N = board.N;
        this.memo = new Map();
    }

    chooseMove(board, depth = 3) {
        this.N = board.N;
        this.memo.clear();
        let bestMove = [-1, -1];
        let bestScore = Number.NEGATIVE_INFINITY;
        const cells = board.getEmptyAdjacentCells();
        
        for (const cell of cells) {
            const [x, y] = cell;
            board.set(x, y, board.computerSymbol);

            if (board.winAt(x, y, this.M)) {
                board.set(x, y, '.');
                return [x, y];
            }

            const score = this.minimaxAlphaBeta(board, depth - 1, false, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
            board.set(x, y, '.');

            if (score > bestScore) {
                bestScore = score;
                bestMove = [x, y];
            }
        }

        return bestMove;
    }

    minimaxAlphaBeta(board, depth, isMax, alpha, beta) {
        const hash = board.toString() + (isMax ? '1' : '0') + depth;
        if (this.memo.has(hash)) {
            return this.memo.get(hash);
        }

        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                if (board.get(i, j) !== '.' && board.winAt(i, j, this.M)) {
                    const val = (board.get(i, j) === board.computerSymbol) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                    this.memo.set(hash, val);
                    return val;
                }
            }
        }

        if (board.isDraw()) {
            this.memo.set(hash, 0);
            return 0;
        }

        if (depth <= 0) {
            const v = this.evaluate(board);
            this.memo.set(hash, v);
            return v;
        }

        const cells = board.getEmptyAdjacentCells();

        if (isMax) {
            let value = Number.NEGATIVE_INFINITY;
            for (const cell of cells) {
                const [x, y] = cell;
                board.set(x, y, board.computerSymbol);
                const evalScore = this.minimaxAlphaBeta(board, depth - 1, false, alpha, beta);
                board.set(x, y, '.');
                value = Math.max(value, evalScore);
                alpha = Math.max(alpha, value);
                if (alpha >= beta) {
                    break;
                }
            }
            this.memo.set(hash, value);
            return value;
        } else {
            let value = Number.POSITIVE_INFINITY;
            for (const cell of cells) {
                const [x, y] = cell;
                board.set(x, y, board.playerSymbol);
                const evalScore = this.minimaxAlphaBeta(board, depth - 1, true, alpha, beta);
                board.set(x, y, '.');
                value = Math.min(value, evalScore);
                beta = Math.min(beta, value);
                if (alpha >= beta) {
                    break;
                }
            }
            this.memo.set(hash, value);
            return value;
        }
    }

    evaluate(board) {
        let score = 0;
        
        const checkLine = (line) => {
            let compCount = 0;
            let playerCount = 0;
            for (const cell of line) {
                if (cell === board.computerSymbol) compCount++;
                else if (cell === board.playerSymbol) playerCount++;
            }
            if (compCount > 0 && playerCount > 0) return 0;
            if (compCount > 0) return Math.pow(10, compCount);
            if (playerCount > 0) return -Math.pow(10, playerCount);
            return 0;
        };
        
        for (let i = 0; i < this.N; i++) {
            const row = [];
            const col = [];
            for (let j = 0; j < this.N; j++) {
                row.push(board.get(i, j));
                col.push(board.get(j, i));
            }
            score += checkLine(row);
            score += checkLine(col);
        }

        const diag1 = [], diag2 = [];
        for (let i = 0; i < this.N; i++) {
            diag1.push(board.get(i, i));
            diag2.push(board.get(i, this.N - 1 - i));
        }
        score += checkLine(diag1);
        score += checkLine(diag2);

        return score;
    }
}