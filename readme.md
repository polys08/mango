# 🥭☕ Sistema de Pedidos por Mesa - Mango Café

Sistema web para gerenciamento de pedidos por mesa do **Mango Café**, desenvolvido como projeto individual do 2º semestre da faculdade, integrando banco de dados, backend e frontend.

## 📋 Sobre o projeto

O sistema permite gerenciar categorias, produtos, mesas e pedidos (com carrinho) do Mango Café, sem envolver a parte de pagamento. Foi desenvolvido para aplicar, em um único projeto, conceitos de banco de dados avançado, desenvolvimento web com PHP e lógica de programação com TypeScript.

## 🛠️ Tecnologias utilizadas

- **Banco de Dados:** MariaDB (CTEs, Views, Stored Procedures, Triggers)
- **Backend:** PHP (CRUDs via API REST, retorno em JSON)
- **Frontend:** HTML5, CSS3, Bootstrap
- **Lógica:** TypeScript (tipagem, fetch assíncrono, manipulação de DOM)
- **Ambiente:** XAMPP (Apache + MariaDB)
- **Ferramentas:** VS Code, DBeaver

## 📂 Estrutura do projeto

```
mango-cafe/
├── public/     → páginas HTML e estilos CSS
├── src/        → código-fonte TypeScript
├── api/        → endpoints PHP (JSON)
```

## ⚙️ Funcionalidades

- [ ] Cadastro e listagem de categorias
- [ ] Cadastro e listagem de produtos
- [ ] Gerenciamento de mesas
- [ ] Criação de pedidos com carrinho
- [ ] Adição/remoção de itens do pedido
- [ ] Consulta de pedidos por mesa

## 🚀 Como rodar o projeto localmente

1. Clone o repositório dentro da pasta `htdocs` do XAMPP
2. Inicie o **Apache** e o **MariaDB** pelo painel do XAMPP
3. Importe o banco de dados (arquivo `.sql` disponível em `/database`)
4. Configure a conexão em `api/conexao.php` (usuário, senha, nome do banco: `mango_cafe`)
5. Acesse `http://localhost/mango-cafe/public/index.html`

## 🖼️ Prints do sistema

_(adicionar screenshots das telas principais aqui)_

## 👤 Autor

Desenvolvido por [seu nome] como projeto individual de faculdade.




ADICIONAR DPS:
-- Adiciona a coluna de descrição em produtos.
-- Sem ela, os cards do cardápio funcionam normalmente,
-- só não mostram a linha de descrição abaixo do nome.

USE CAFETERIA;

ALTER TABLE produtos
  ADD COLUMN descricao VARCHAR(150) NULL AFTER nome;

-- Exemplos pra popular (ajuste os ids conforme o seu banco):
-- UPDATE produtos SET descricao = 'Café encorpado' WHERE nome = 'Expresso';
-- UPDATE produtos SET descricao = 'Leite vaporizado e café' WHERE nome = 'Latte';
-- UPDATE produtos SET descricao = 'Leite vaporizado, café e chocolate' WHERE nome = 'Mocha';