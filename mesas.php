<?php
require_once 'conexao.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        listar ($pdo);
        break;
    case 'POST':
        criar ($pdo);
        break;

    case 'PUT':
        editar ($pdo);
        break;
    case 'DELETE':
        excluir ($pdo);
        break;
    default:
    http_response_code (405);
    echo json_encode(['erro' => 'Método não permitido']);
}

function listar($pdo) {
    $stmt = $pdo->query('SELECT * FROM mesas ORDER BY numero');
    $mesas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($mesas);
}

function criar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['numero'])){
        http_response_code(400);
        echo json_encode(['erro' => 'O campo numero é obrigatório']);
        return;
    }

    if(numeroJaExiste($pdo, $dados['numero'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Já existe uma mesa com esse número']);
        return;
    }

$stmt = $pdo->prepare('INSERT INTO mesas (numero) VALUES (:numero)');
$stmt->execute(['numero' => $dados ['numero']]);

    echo json_encode([
        'id' => $pdo->lastInsertId(),
        'numero' => $dados['numero']
    ]);
}

function editar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id']) || empty($dados['numero'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos id e número são obrigatórios']);
        return;
    }

$stmt = $pdo->prepare('UPDATE mesas SET numero = :numero WHERE id = :id');
$stmt->execute(['numero' => $dados['numero'], 'id' => $dados['id']]);
    echo json_encode(['mensagem' => 'Mesa atualizada com sucesso']);
}

function excluir($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo id obrigatórios']);
        return;
    }

    if(mesaTemPedidoAberto($pdo, $dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Não é possível excluir: a mesa tem um pedido em aberto']);
        return;
    }
$stmt = $pdo->prepare('DELETE FROM mesas WHERE id= :id');
$stmt->execute(['id' =>$dados['id']]);
    echo json_encode(['mensagem' => 'Mesa excluída com sucesso']);
}

function numeroJaExiste($pdo, $numero) {
    $stmt = $pdo->prepare('SELECT id FROM mesas WHERE numero = :numero');
    $stmt->execute(['numero' => $numero]);
    return $stmt->fetch() !==false;
}

function mesaTemPedidoAberto($pdo, $id) {
    $stmt = $pdo->prepare("SELECT id FROM pedidos WHERE mesa_id =:mesa_id AND status ='aberto'");
    $stmt->execute(['mesa_id' => $id]);
    return $stmt->fetch() !==false;
}