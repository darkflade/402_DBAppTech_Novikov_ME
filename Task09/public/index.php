<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$dbFile = __DIR__ . '/../db/database.sqlite';
$dbDir = dirname($dbFile);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

try {
    $pdo = new PDO("sqlite:$dbFile");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $pdo->exec("CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        player_name TEXT,
        board_size INTEGER,
        human_symbol TEXT,
        winner_symbol TEXT DEFAULT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS moves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        move_num INTEGER,
        x INTEGER,
        y INTEGER,
        symbol TEXT,
        FOREIGN KEY(game_id) REFERENCES games(id)
    )");
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}

$app = AppFactory::create();

$app->addBodyParsingMiddleware();

$app->addErrorMiddleware(true, true, true);


$app->get('/', function (Request $request, Response $response) {
    return $response
        ->withHeader('Location', '/index.html')
        ->withStatus(302);
});

$app->get('/games', function (Request $request, Response $response) use ($pdo) {
    $stmt = $pdo->query("SELECT * FROM games ORDER BY id DESC");
    $games = $stmt->fetchAll();
    
    $response->getBody()->write(json_encode($games));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/games/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
    $gameId = (int)$args['id'];

    $stmtGame = $pdo->prepare("SELECT * FROM games WHERE id = ?");
    $stmtGame->execute([$gameId]);
    $game = $stmtGame->fetch();

    if (!$game) {
        $response->getBody()->write(json_encode(['error' => 'Game not found']));
        return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
    }

    $stmtMoves = $pdo->prepare("SELECT move_num, x, y, symbol FROM moves WHERE game_id = ? ORDER BY move_num ASC");
    $stmtMoves->execute([$gameId]);
    $moves = $stmtMoves->fetchAll();

    $game['moves'] = $moves;
    
    $response->getBody()->write(json_encode($game));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/games', function (Request $request, Response $response) use ($pdo) {
    $data = $request->getParsedBody();

    if (!$data) {
        $response->getBody()->write(json_encode(['error' => 'No input data']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    $sql = "INSERT INTO games (date, player_name, board_size, human_symbol, winner_symbol) VALUES (:date, :player_name, :board_size, :human_symbol, :winner_symbol)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':date' => $data['date'],
        ':player_name' => $data['player_name'],
        ':board_size' => $data['board_size'],
        ':human_symbol' => $data['human_symbol'],
        ':winner_symbol' => null
    ]);

    $id = $pdo->lastInsertId();
    
    $response->getBody()->write(json_encode(['id' => $id]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/step/{id}', function (Request $request, Response $response, array $args) use ($pdo) {
    $gameId = (int)$args['id'];
    $data = $request->getParsedBody();

    if (!$data) {
        $response->getBody()->write(json_encode(['error' => 'No input data']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    if (!($data['x'] == -1 && isset($data['winner']))) {
        $sql = "INSERT INTO moves (game_id, move_num, x, y, symbol) VALUES (:game_id, :move_num, :x, :y, :symbol)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':game_id' => $gameId,
            ':move_num' => $data['num'],
            ':x' => $data['x'],
            ':y' => $data['y'],
            ':symbol' => $data['symbol']
        ]);
    }

    if (isset($data['winner'])) {
        $stmtUpd = $pdo->prepare("UPDATE games SET winner_symbol = ? WHERE id = ?");
        $stmtUpd->execute([$data['winner'], $gameId]);
    }

    $response->getBody()->write(json_encode(['status' => 'ok']));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
