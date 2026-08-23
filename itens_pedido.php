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
    $sql = 'SELECT itens_pedido.id, itens_pedido.pedido_id, itens_pedido.produto_id,
                    produtos.nome AS produto_nome, produtos.preco,
                    itens_pedido.quantidade
            FROM itens_pedido
            JOIN produtos ON itens_pedido.produto_id = produtos.id';

    $pedidoId = $_GET['pedido_id'] ?? null;

    if ($pedidoId) {
        $sql .= ' WHERE itens_pedido.pedido_id = :pedido_id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['pedido_id' => $pedidoId]);
    } else {
        $stmt = $pdo->query($sql);
    }

    $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($itens);
}

function criar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['pedido_id']) || empty($dados['produto_id']) || empty($dados['quantidade'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos pedido_id, produto_id e quantidade são obrigatórios']);
        return;
    }

    if (!pedidoExiste($pdo, $dados['pedido_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O pedido informado não existe']);
        return;
    }

    if (!produtoExiste($pdo, $dados['produto_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O produto informado não existe']);
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade) VALUES (:pedido_id, :produto_id, :quantidade)');
    $stmt->execute([
        'pedido_id' => $dados['pedido_id'],
        'produto_id' => $dados['produto_id'],
        'quantidade' => $dados['quantidade'],
    ]);

    echo json_encode([
        'id' => $pdo->lastInsertId(),
        'pedido_id' => $dados['pedido_id'],
        'produto_id' => $dados['produto_id'],
        'quantidade' => $dados['quantidade']
    ]);
}

function editar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id']) || empty($dados['quantidade'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos id e quantidade são obrigatórios']);
        return;
    }

    $stmt = $pdo->prepare('UPDATE itens_pedido SET quantidade = :quantidade WHERE id = :id');
    $stmt->execute(['quantidade' => $dados['quantidade'], 'id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Item atualizado com sucesso']);
}

function excluir($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo id é obrigatório']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM itens_pedido WHERE id = :id');
    $stmt->execute(['id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Item excluído com sucesso']);
}

function pedidoExiste($pdo, $pedidoId) {
    $stmt = $pdo->prepare('SELECT id FROM pedidos WHERE id = :id');
    $stmt->execute(['id' => $pedidoId]);
    return $stmt->fetch() !== false;
}

function produtoExiste($pdo, $produtoId) {
    $stmt = $pdo->prepare('SELECT id FROM produtos WHERE id = :id');
    $stmt->execute(['id' => $produtoId]);
    return $stmt->fetch() !== false;
}