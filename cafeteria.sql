DROP DATABASE IF EXISTS cafeteria;
CREATE DATABASE cafeteria;
USE cafeteria;

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ordem INT DEFAULT 0,
    CONSTRAINT uk_categoria_nome UNIQUE (nome)
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(150) NULL,
    preco DECIMAL(10,2) NOT NULL,
    imagem VARCHAR(255) NULL,
    categoria_id INT NOT NULL,
    CONSTRAINT uk_produto_nome UNIQUE (nome),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    CONSTRAINT uk_mesa_numero UNIQUE (numero)
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa_id INT NOT NULL,
    data DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'aberto',
    FOREIGN KEY (mesa_id) REFERENCES mesas(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);


INSERT INTO categorias (nome, ordem) VALUES
    ('Bebidas Quentes', 1),
    ('Bebidas Geladas', 2),
    ('Salgados', 3),
    ('Doces', 4);


INSERT INTO mesas (numero) VALUES (1), (2), (3), (4), (5), (6);


INSERT INTO produtos (nome, descricao, preco, imagem, categoria_id) VALUES
    -- bebidas quentes
    ('Expresso', 'Café encorpado', 7.00, 'expresso.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Latte', 'Leite vaporizado e café', 12.00, 'latte.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Mocha', 'Expresso, leite vaporizado e calda de chocolate', 13.00, 'mocha.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Matcha Latte', 'Chá matcha e leite vaporizado', 15.00, 'matchalatte.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Cortado', '1 dose expresso e 1 dose leite vaporizado', 8.00, 'cortado.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Prensa Francesa', 'Café coado (método na prensa), 250ml', 16.00, 'prensafrancesa.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),
    ('Hot Chocolate', 'Chocolate quente cremoso (opcional: peça com canela)', 14.00, 'hotchocolate.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Quentes')),

    -- bebidas geladas
    ('Iced Latte', 'Expresso e leite vaporizado gelado', 16.00, 'icedlatte.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),
    ('Pink Lemonade', 'Água com gás, suco de limão siciliano, xarope de frutas vermelhas e rodelas de limão', 17.00, 'pinklemonade.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),
    ('Água com gás', 'Água mineral com gás', 5.00, 'aguagas.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),
    ('Água sem gás', 'Água mineral sem gás', 5.00, 'aguanormal.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),
    ('Iced Matcha', 'Chá matcha e leite vaporizado gelado', 18.00, 'icedmatcha.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),
    ('Caramel Mocha', 'Expresso, leite vaporizado e caramelo salgado', 17.00, 'caramelmocha.png', (SELECT id FROM categorias WHERE nome = 'Bebidas Geladas')),

    -- salgados
    ('Pão de Queijo', 'Pão de queijo parmesão', 2.50, 'paodequeijo.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),
    ('Pão Tostado c/ Queijo', 'Pão tostado com requeijão e queijo mussarela', 8.00, 'paocomqueijo.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),
    ('Croissant Simples', 'Croissant amanteigado simples', 9.00, 'croissant.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),
    ('Empada', 'Frango e requeijão', 7.00, 'empada.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),
    ('Toast Avocado', 'Pão, avocado, tomate cereja e requeijão com gergelim salpicado', 18.00, 'toastavocado.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),
    ('Shawarma', 'Pão sírio, alface, tomate cereja, molho de alho, carne de frango desfiada, za''atar, sal e pimenta', 20.00, 'shawarma.png', (SELECT id FROM categorias WHERE nome = 'Salgados')),

    -- doces
    ('Bolo de Cenoura', 'Bolo com massa de cenoura e cobertura de chocolate', 8.00, 'bolodecenoura.png', (SELECT id FROM categorias WHERE nome = 'Doces')),
    ('Cinnamon Roll', 'Massa fofinha com cobertura e canela', 10.00, 'cinnamonroll.png', (SELECT id FROM categorias WHERE nome = 'Doces')),
    ('Brownie', 'Brownie de chocolate acompanhado de cobertura de chocolate', 12.00, 'brownie.png', (SELECT id FROM categorias WHERE nome = 'Doces')),
    ('Cupcake Chocolate', 'Massa com chocolate e cobertura de chocolate', 8.00, 'cupcakechocolate.png', (SELECT id FROM categorias WHERE nome = 'Doces')),
    ('Cupcake Nozes', 'Massa com nozes e cobertura de caramelo salgado', 10.00, 'cupcakenozes.png', (SELECT id FROM categorias WHERE nome = 'Doces')),
    ('Bolo de Baunilha', 'Massa neutra com cobertura de baunilha', 8.00, 'bolodebaunilha.png', (SELECT id FROM categorias WHERE nome = 'Doces'));

-- view

CREATE VIEW vw_pedidos_detalhados AS
SELECT
    p.id AS pedido_id,
    m.numero AS mesa,
    p.data,
    p.status,
    pr.nome AS produto,
    c.nome AS categoria,
    ip.quantidade,
    pr.preco,
    (ip.quantidade * pr.preco) AS subtotal
FROM pedidos p
JOIN mesas m ON p.mesa_id = m.id
JOIN itens_pedido ip ON ip.pedido_id = p.id
JOIN produtos pr ON pr.id = ip.produto_id
JOIN categorias c ON c.id = pr.categoria_id;


SET GLOBAL log_bin_trust_function_creators = 1;

DROP FUNCTION IF EXISTS calcular_total_pedido;

CREATE FUNCTION calcular_total_pedido (id_pedido INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
RETURN (
    SELECT IFNULL(SUM(ip.quantidade * pr.preco), 0)
    FROM itens_pedido ip
    JOIN produtos pr ON pr.id = ip.produto_id
    WHERE ip.pedido_id = id_pedido
);


DROP PROCEDURE IF EXISTS listar_pedidos_por_mesa;

CREATE PROCEDURE listar_pedidos_por_mesa(IN p_mesa INT)
SELECT * FROM vw_pedidos_detalhados
WHERE mesa = p_mesa;

DROP PROCEDURE IF EXISTS listar_produtos_por_categoria;

CREATE PROCEDURE listar_produtos_por_categoria(IN p_categoria_id INT)
SELECT pr.id, pr.nome, pr.descricao, pr.preco, pr.categoria_id, pr.imagem,
       c.nome AS categoria_nome
FROM produtos pr
JOIN categorias c ON c.id = pr.categoria_id
WHERE pr.categoria_id = p_categoria_id
ORDER BY pr.nome;

DROP PROCEDURE IF EXISTS listar_produtos_paginado;

CREATE PROCEDURE listar_produtos_paginado(IN p_limite INT, IN p_offset INT)
SELECT pr.id, pr.nome, pr.descricao, pr.preco, pr.categoria_id, pr.imagem,
       c.nome AS categoria_nome
FROM produtos pr
JOIN categorias c ON c.id = pr.categoria_id
ORDER BY pr.nome
LIMIT p_limite OFFSET p_offset;


DROP TRIGGER IF EXISTS trg_produtos_preco_positivo;

CREATE TRIGGER trg_produtos_preco_positivo
BEFORE UPDATE ON produtos
FOR EACH ROW
SET NEW.preco = IF(NEW.preco < 0, OLD.preco, NEW.preco);


SELECT * FROM categorias ORDER BY ordem;
SELECT * FROM produtos ORDER BY categoria_id, nome;
SELECT * FROM mesas;
SHOW PROCEDURE STATUS WHERE Db = 'cafeteria';
SHOW FUNCTION STATUS WHERE Db = 'cafeteria';

SHOW FULL TABLES WHERE Table_type = 'VIEW';










