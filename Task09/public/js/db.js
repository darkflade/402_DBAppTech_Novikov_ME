export async function createGame(gameData) {
    try {
        const response = await fetch('/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });
        if (!response.ok) throw new Error('Network error');
        const result = await response.json();
        return result.id;
    } catch (e) {
        console.error("Error creating game:", e);
        return null;
    }
}

export async function saveMove(gameId, moveData) {
    try {
        const response = await fetch(`/step/${gameId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moveData)
        });
        return response.ok;
    } catch (e) {
        console.error("Error saving move:", e);
    }
}

export async function listGames() {
    try {
        const response = await fetch('/games');
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (e) {
        console.error("Error listing games:", e);
        return [];
    }
}

export async function getGameById(id) {
    try {
        const response = await fetch(`/games/${id}`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (e) {
        console.error(`Error getting game ${id}:`, e);
        return null;
    }
}

export async function saveGame(gameData) {
    console.warn("saveGame is deprecated in REST version, use createGame and saveMove");
}