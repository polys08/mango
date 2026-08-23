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
    $sql = 'SELECT produtos.id, produtos.nome, produtos.descricao, produtos.preco, produtos.categoria_id, produtos.imagem,
                    categorias.nome AS categoria_nome
            FROM produtos
            JOIN categorias ON produtos.categoria_id = categorias.id';

    $parametros = [];

    if (!empty($_GET['categoria_id'])) {
        $sql .= ' WHERE produtos.categoria_id = :categoria_id';
        $parametros['categoria_id'] = $_GET['categoria_id'];
    }

    $sql .= ' ORDER BY produtos.nome';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);
    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($produtos);
}

function criar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['nome']) || empty($dados['preco']) || empty($dados['categoria_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos nome, preco e categoria_id são obrigatórios']);
        return;
    }

    if (!categoriaExiste($pdo, $dados['categoria_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'A categoria informada não existe']);
        return;
    }

    $descricao = $dados['descricao'] ?? null;
    $imagem = $dados['imagem'] ?? null;

    $stmt = $pdo->prepare('INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem) VALUES (:nome, :descricao, :preco, :categoria_id, :imagem)');
    $stmt->execute([
        'nome' => $dados['nome'],
        'descricao' => $descricao,
        'preco' => $dados['preco'],
        'categoria_id' => $dados['categoria_id'],
        'imagem' => $imagem,
    ]);

    echo json_encode([
        'id' => $pdo->lastInsertId(),
        'nome' => $dados['nome'],
        'descricao' => $descricao,
        'preco' => $dados['preco'],
        'categoria_id' => $dados['categoria_id'],
        'imagem' => $imagem
    ]);
}

function editar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id']) || empty($dados['nome']) || empty($dados['preco']) || empty($dados['categoria_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos id, nome, preco e categoria_id são obrigatórios']);
        return;
    }

    if (!categoriaExiste($pdo, $dados['categoria_id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'A categoria informada não existe']);
        return;
    }

    $descricao = $dados['descricao'] ?? null;
    $imagem = $dados['imagem'] ?? null;

    $stmt = $pdo->prepare('UPDATE produtos SET nome = :nome, descricao = :descricao, preco = :preco, categoria_id = :categoria_id, imagem = :imagem WHERE id = :id');
    $stmt->execute([
        'nome' => $dados['nome'],
        'descricao' => $descricao,
        'preco' => $dados['preco'],
        'categoria_id' => $dados['categoria_id'],
        'imagem' => $imagem,
        'id' => $dados['id'],
    ]);

    echo json_encode(['mensagem' => 'Produto atualizado com sucesso']);
}

function excluir($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo id é obrigatório']);
        return;
    }

    if (produtoTemPedido($pdo, $dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Não é possível excluir: existem pedidos vinculados a esse produto']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
    $stmt->execute(['id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Produto excluído com sucesso']);
}

function categoriaExiste($pdo, $categoriaId) {
    $stmt = $pdo->prepare('SELECT id FROM categorias WHERE id = :id');
    $stmt->execute(['id' => $categoriaId]);
    return $stmt->fetch() !== false;
}

function produtoTemPedido($pdo, $produtoId) {
    $stmt = $pdo->prepare('SELECT id FROM itens_pedido WHERE produto_id = :produto_id');
    $stmt->execute(['produto_id' => $produtoId]);
    return $stmt->fetch() !== false;
}