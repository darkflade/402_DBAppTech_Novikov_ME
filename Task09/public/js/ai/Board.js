export default class Board {
    constructor(N = 3, playerSymbol = 'X', computerSymbol = 'O') {
        this.N = N;
        this.playerSymbol = playerSymbol;
        this.computerSymbol = computerSymbol;
        this.playerMask = Array(N).fill(0);
        this.computerMask = Array(N).fill(0);
    }

    getSize() {
        return this.N;
    }

    get(x, y) {
        const bit = 1 << y;
        if ((this.playerMask[x] & bit) !== 0) {
            return this.playerSymbol;
        }
        if ((this.computerMask[x] & bit) !== 0) {
            return this.computerSymbol;
        }
        return '.';
    }

    set(x, y, sym) {
        const bit = 1 << y;
        if (sym === this.playerSymbol) {
            this.playerMask[x] |= bit;
            this.computerMask[x] &= (~bit);
        } else if (sym === this.computerSymbol) {
            this.computerMask[x] |= bit;
            this.playerMask[x] &= (~bit);
        } else {
            this.playerMask[x] &= (~bit);
            this.computerMask[x] &= (~bit);
        }
    }

    isEmpty(x, y) {
        const bit = 1 << y;
        return ((this.playerMask[x] | this.computerMask[x]) & bit) === 0;
    }

    getEmptyAdjacentCells() {
        const seen = new Set();
        const adj = [[-1,-1], [-1,0], [-1,1], [0,1], [0,-1], [1,-1], [1,0], [1,1]];
        for (let i = 0; i < this.N; i++) {
            const rowFilled = this.playerMask[i] | this.computerMask[i];
            if (rowFilled === 0) continue;

            for (let j = 0; j < this.N; j++) {
                if (((rowFilled >> j) & 1) === 1) {
                    for (const d of adj) {
                        const x = i + d[0];
                        const y = j + d[1];
                        if (x < 0 || y < 0 || x >= this.N || y >= this.N) continue;
                        if (this.isEmpty(x, y)) {
                            seen.add(`${x},${y}`);
                        }
                    }
                }
            }
        }

        if (seen.size === 0) {
            const c = Math.floor(this.N / 2);
            if (this.isEmpty(c, c)) return [[c,c]];
            
            const allEmpty = [];
            for (let i = 0; i < this.N; i++) {
                for (let j = 0; j < this.N; j++) {
                    if (this.isEmpty(i, j)) allEmpty.push([i, j]);
                }
            }
            return allEmpty;
        }
        return Array.from(seen).map(s => s.split(',').map(Number));
    }

    winAt(x, y, M) {
        const sym = this.get(x, y);
        if (sym === '.') return false;
        
        const dirs = [[1,0], [0,1], [1,1], [1,-1]];
        for (const d of dirs) {
            let cnt = 1;
            for (let k = 1; k < M; k++) {
                const nx = x + d[0] * k;
                const ny = y + d[1] * k;
                if (nx >= 0 && ny >= 0 && nx < this.N && ny < this.N && this.get(nx, ny) === sym) {
                    cnt++;
                } else {
                    break;
                }
            }
            for (let k = 1; k < M; k++) {
                const nx = x - d[0] * k;
                const ny = y - d[1] * k;
                if (nx >= 0 && ny >= 0 && nx < this.N && ny < this.N && this.get(nx, ny) === sym) {
                    cnt++;
                } else {
                    break;
                }
            }
            if (cnt >= M) return true;
        }
        return false;
    }

    isDraw() {
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                if (this.isEmpty(i, j)) return false;
            }
        }
        return true;
    }

    toString() {
        let s = '';
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                s += this.get(i, j);
            }
        }
        return s;
    }
}