<?php
require_once "conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

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
    $stmt = $pdo->query('SELECT * FROM categorias ORDER BY ordem');
    $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($categorias);
}

function criar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if(empty($dados['nome'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Ocamponome é obrigatório']);
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO categorias (nome) VALUES (:nome)');
    $stmt->execute(['nome' => $dados['nome']]);

    echo json_encode([
        'id' => $pdo->lastInsertId(),
        'nome' => $dados['nome']
    ]);
}

function editar($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id']) || empty($dados['nome'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Os campos id e nome são obrigatórios']);
        return;
    }

    $stmt =$pdo->prepare('UPDATE categorias SET nome = :nome WHERE id = :id');
    $stmt->execute(['nome' => $dados['nome'], 'id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Categoria atualizada com sucesso']);
}

function excluir($pdo) {
    $dados = json_decode(file_get_contents('php://input'), true);

    if (empty($dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'O campo id é obrigatório']);
        return;
    }

    if (categoriaTemProduto($pdo, $dados['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Não é possível excluir: existem produtos vinculados a essa categoria']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM categorias WHERE id = :id');
    $stmt->execute(['id' => $dados['id']]);

    echo json_encode(['mensagem' => 'Categoria excluída com sucesso']);
}

function categoriaTemProduto($pdo, $id) {
    $stmt = $pdo->prepare('SELECT id FROM produtos WHERE categoria_id = :categoria_id');
    $stmt->execute(['categoria_id' => $id]);
    return $stmt->fetch() !== false;
}
