-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 24/08/2026 às 02:03
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `cafeteria`
--

DELIMITER $$
--
-- Procedimentos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `listar_pedidos_por_mesa` (IN `p_mesa` INT)   SELECT * FROM vw_pedidos_detalhados
WHERE mesa = p_mesa$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `listar_produtos_paginado` (IN `p_limite` INT, IN `p_offset` INT)   SELECT id, nome, preco
FROM produtos
ORDER BY nome
LIMIT p_limite OFFSET p_offset$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `listar_produtos_por_categoria` (IN `p_categoria` VARCHAR(50))   SELECT pr.id, pr.nome, pr.preco, c.nome AS categoria
FROM produtos pr
JOIN categorias c ON c.id = pr.categoria_id
WHERE c.nome = p_categoria$$

--
-- Funções
--
CREATE DEFINER=`root`@`localhost` FUNCTION `calcular_total_pedido` (`id_pedido` INT) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN (
    SELECT IFNULL(SUM(ip.quantidade * pr.preco), 0)
    FROM itens_pedido ip
    JOIN produtos pr ON pr.id = ip.produto_id
    WHERE ip.pedido_id = id_pedido
)$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `ordem` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`, `ordem`) VALUES
(1, 'Bebidas Quentes', 1),
(2, 'Bebidas Geladas', 2),
(3, 'Salgados', 3),
(4, 'Doces', 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `itens_pedido`
--

CREATE TABLE `itens_pedido` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `itens_pedido`
--

INSERT INTO `itens_pedido` (`id`, `pedido_id`, `produto_id`, `quantidade`) VALUES
(4, 2, 26, 2),
(5, 2, 31, 1),
(6, 4, 31, 1),
(7, 4, 37, 1),
(8, 4, 29, 1),
(9, 3, 37, 1),
(29, 6, 58, 1),
(30, 6, 59, 1),
(31, 7, 58, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `mesas`
--

CREATE TABLE `mesas` (
  `id` int(11) NOT NULL,
  `numero` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `mesas`
--

INSERT INTO `mesas` (`id`, `numero`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `mesa_id` int(11) NOT NULL,
  `data` datetime DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'aberto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `pedidos`
--

INSERT INTO `pedidos` (`id`, `mesa_id`, `data`, `status`) VALUES
(2, 1, '2026-08-02 13:07:24', 'aberto'),
(3, 1, '2026-08-05 00:27:51', 'aberto'),
(4, 3, '2026-08-12 19:57:11', 'aberto'),
(6, 2, '2026-08-22 20:43:40', 'entregue'),
(7, 2, '2026-08-23 19:43:55', 'aberto');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(150) DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `imagem` varchar(255) DEFAULT NULL,
  `categoria_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `nome`, `descricao`, `preco`, `imagem`, `categoria_id`) VALUES
(26, 'Expresso', 'Café encorpado', 7.00, 'expresso.png', 1),
(27, 'Latte', 'Leite vaporizado e café', 12.00, 'latte.png', 1),
(28, 'Mocha', 'Expresso, leite vaporizado e calda de chocolate', 13.00, 'mocha.png', 1),
(29, 'Iced Latte', 'Expresso e leite vaporizado gelado', 16.00, 'icedlatte.png', 2),
(30, 'Pink Lemonade', 'Água com gás, suco de limão siciliano, xarope de frutas vermelhas e rodelas de limão', 17.00, 'pinklemonade.png', 2),
(31, 'Água com gás', 'Água mineral com gás', 5.00, 'aguagas.png', 2),
(32, 'Pão de Queijo', 'Pão de queijo parmesão', 2.50, 'paodequeijo.png', 3),
(33, 'Pão Tostado c/ Queijo', 'Pão tostado com requeijão e queijo mussarela', 8.00, 'paocomqueijo.png', 3),
(34, 'Croissant Simples', 'Croissant amanteigado simples', 9.00, 'croissant.png', 3),
(35, 'Bolo de cenoura', 'Bolo com massa de cenoura e cobertura de chocolate', 8.00, 'bolodecenoura.png', 4),
(36, 'Cinnamon Roll', 'Massa fofinha com cobertura e canela', 10.00, 'cinnamonroll.png', 4),
(37, 'Brownie', 'Brownie de chocolate acompanhado de cobertura de chocolate', 12.00, 'brownie.png', 4),
(55, 'Iced matcha', 'Chá matcha e leite vaporizado gelado', 18.00, 'icedmatcha.png', 2),
(56, 'Caramel mocha', 'Expresso, leite vaporizado e caramelo salgado', 17.00, 'caramelmocha.png', 2),
(57, 'Matcha latte', 'Chá matcha e leite vaporizado', 15.00, 'matchalatte.png', 1),
(58, 'Cortado', '1 dose expresso e 1 dose leite vaporizado', 8.00, 'cortado.png', 1),
(59, 'Empada', 'Frango e requeijão', 7.00, 'empada.png', 3),
(80, 'Cupcake Chocolate', 'Massa com chocolate e cobertura de chocolate', 8.00, 'cupcakechocolate.png', 4),
(81, 'Cupcake Nozes', 'Massa com nozes e cobertura de caramelo salgado', 10.00, 'cupcakenozes.png', 4),
(82, 'Bolo de baunilha', 'Massa neutra com cobertura de baunilha', 8.00, 'bolodebaunilha.png', 4),
(86, 'Toast avocado', 'Pão, avocado, tomate cereja e requeijão com gergelim salpicado', 18.00, 'toastavocado.png', 3),
(87, 'Shawarma', 'Pão sírio, alface, tomate cereja, molho de alho, carne de frango desfiada, za\'atar, sal e pimenta', 20.00, 'shawarma.png', 3),
(88, 'Água sem gás', 'Água mineral sem gás', 5.00, 'aguanormal.png', 2),
(89, 'Prensa Francesa', 'Café coado (método na prensa), 250ml', 16.00, 'prensafrancesa.png', 1),
(90, 'Hot Chocolate', 'Chocolate quente cremoso (opcional: peça com canela)', 14.00, 'hotchocolate.png', 1);

--
-- Acionadores `produtos`
--
DELIMITER $$
CREATE TRIGGER `trg_produtos_preco_positivo` BEFORE UPDATE ON `produtos` FOR EACH ROW SET NEW.preco = IF(NEW.preco < 0, OLD.preco, NEW.preco)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_pedidos_detalhados`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_pedidos_detalhados` (
`pedido_id` int(11)
,`mesa` int(11)
,`data` datetime
,`status` varchar(20)
,`produto` varchar(100)
,`categoria` varchar(50)
,`quantidade` int(11)
,`preco` decimal(10,2)
,`subtotal` decimal(20,2)
);

-- --------------------------------------------------------

--
-- Estrutura para view `vw_pedidos_detalhados`
--
DROP TABLE IF EXISTS `vw_pedidos_detalhados`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_pedidos_detalhados`  AS SELECT `p`.`id` AS `pedido_id`, `m`.`numero` AS `mesa`, `p`.`data` AS `data`, `p`.`status` AS `status`, `pr`.`nome` AS `produto`, `c`.`nome` AS `categoria`, `ip`.`quantidade` AS `quantidade`, `pr`.`preco` AS `preco`, `ip`.`quantidade`* `pr`.`preco` AS `subtotal` FROM ((((`pedidos` `p` join `mesas` `m` on(`p`.`mesa_id` = `m`.`id`)) join `itens_pedido` `ip` on(`ip`.`pedido_id` = `p`.`id`)) join `produtos` `pr` on(`pr`.`id` = `ip`.`produto_id`)) join `categorias` `c` on(`c`.`id` = `pr`.`categoria_id`)) ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `mesas`
--
ALTER TABLE `mesas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_mesa_numero` (`numero`);

--
-- Índices de tabela `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mesa_id` (`mesa_id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_produto_nome` (`nome`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de tabela `mesas`
--
ALTER TABLE `mesas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD CONSTRAINT `itens_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  ADD CONSTRAINT `itens_pedido_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);

--
-- Restrições para tabelas `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`);

--
-- Restrições para tabelas `produtos`
--
ALTER TABLE `produtos`
  ADD CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
