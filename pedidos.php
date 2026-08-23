<?php
require_once 'conexao.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        listar($pdo);
        break;
    case 'POST':
        criar($pdo);
        break;
    case 'PUT':
        editar($pdo);
        break;
    case 'DELETE':
        excluir($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
}

function listar($pdo) {
    $sql = 'SELECT pedidos.id, pedidos.mesa_id, mesas.numero AS mesa_numero,
                    pedidos.data, pedidos.status
            FROM pedidos
            JOIN mesas ON pedidos.mesa_id = mesas.id
            ORDER BY pedidos.data DESC';

    $stmt = $pdo->query($sql);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($pedidos);
}

function criar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['mesa_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo mesa_id é obrigatório']);
        return;
    }

    if (!mesaExiste($pdo, $dados['mesa_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'A mesa informada não existe']);
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO pedidos (mesa_id, data, status) VALUES (:mesa_id, NOW(), \'aberto\')');
    $stmt->execute(['mesa_id' => $dados['mesa_id']]);

    echo json_encode([
        'id' => $pdo->lastInsertId(),
        'mesa_id' => $dados['mesa_id'],
        'status' => 'aberto'
    ]);
}

function editar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id']) || empty($dados['status'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos id e status são obrigatórios']);
        return;
    }

    // Fluxo do pedido: aberto -> entregue -> pago (pago = pedido fechado/encerrado)
    $statusValidos = ['aberto', 'entregue', 'pago'];
    if (!in_array($dados['status'], $statusValidos)) {
        http_response_code(400);
        echo json_encode(['erro' => 'Status inválido. Use "aberto", "entregue" ou "pago"']);
        return;
    }

    $stmt = $pdo->prepare('UPDATE pedidos SET status = :status WHERE id = :id');
    $stmt->execute(['status' => $dados['status'], 'id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Pedido atualizado com sucesso']);
}

function excluir($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo id é obrigatório']);
        return;
    }

    if (pedidoTemItem($pdo, $dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Não é possível excluir: existem itens vinculados a esse pedido']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM pedidos WHERE id = :id');
    $stmt->execute(['id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Pedido excluído com sucesso']);
}

function mesaExiste($pdo, $mesaId) {
    $stmt = $pdo->prepare('SELECT id FROM mesas WHERE id = :id');
    $stmt->execute(['id' => $mesaId]);
    return $stmt->fetch() !== false;
}

function pedidoTemItem($pdo, $pedidoId) {
    $stmt = $pdo->prepare('SELECT id FROM itens_pedido WHERE pedido_id = :pedido_id');
    $stmt->execute(['pedido_id' => $pedidoId]);
    return $stmt->fetch() !== false;
}