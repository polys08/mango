"use strict";
const API_BASE = "../api";
let categorias = [];
let categoriaAtivaId = null;
let carrinho = [];
let mesaSelecionada = null;
let enviandoPedido = false;
function formatarPreco(preco) {
    const valor = typeof preco === "string" ? parseFloat(preco) : preco;
    const valorValido = Number.isFinite(valor) ? valor : 0;
    return valorValido.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}
function precoNumerico(preco) {
    const valor = typeof preco === "string" ? parseFloat(preco) : preco;
    return Number.isFinite(valor) ? valor : 0;
}
async function apiGet(caminho) {
    const resposta = await fetch(`${API_BASE}/${caminho}`);
    if (!resposta.ok) {
        throw new Error(`Falha ao buscar ${caminho} (status ${resposta.status})`);
    }
    return resposta.json();
}
async function apiPost(caminho, corpo) {
    const resposta = await fetch(`${API_BASE}/${caminho}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
    });
    if (!resposta.ok) {
        const texto = await resposta.text().catch(() => "");
        throw new Error(texto || `Falha ao enviar para ${caminho} (status ${resposta.status})`);
    }
    return resposta.json();
}
const catNavEl = document.getElementById("cat-nav");
const sectionTitleEl = document.getElementById("section-title");
const productGridEl = document.getElementById("product-grid");
const cartBtn = document.getElementById("cart-btn");
const cartBadge = document.getElementById("cart-badge");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const cartCloseBtn = document.getElementById("cart-close");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartMesaLineEl = document.getElementById("cart-mesa-line");
const sendOrderBtn = document.getElementById("send-order-btn");
const mesaOverlay = document.getElementById("mesa-overlay");
const mesaIndicator = document.getElementById("mesa-indicator");
const toastEl = document.getElementById("toast");
const ICONE_PADRAO = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 26h30v16a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10V26Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M44 30h4a6 6 0 0 1 0 12h-4" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICONE_SALGADO = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 34c0-10 10-20 22-20s22 10 22 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 34h44l-4 18H14l-4-18Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`;
const ICONE_DOCE = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="14" width="32" height="36" rx="4" stroke="currentColor" stroke-width="3"/><path d="M16 26h32M24 14v-4M40 14v-4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
function iconeParaCategoria(nomeCategoria) {
    const nome = nomeCategoria.toLowerCase();
    if (nome.includes("salgado"))
        return ICONE_SALGADO;
    if (nome.includes("doce"))
        return ICONE_DOCE;
    return ICONE_PADRAO;
}
let toastTimer;
function mostrarToast(mensagem, tipo = "ok") {
    toastEl.textContent = mensagem;
    toastEl.classList.toggle("error", tipo === "error");
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 3200);
}
async function carregarCategorias() {
    catNavEl.innerHTML = `<p class="loading-state">carregando categorias…</p>`;
    try {
        categorias = await apiGet("categorias.php");
        if (categorias.length === 0) {
            catNavEl.innerHTML = `<p class="empty-state">nenhuma categoria cadastrada ainda.</p>`;
            return;
        }
        categoriaAtivaId = categorias[0].id;
        renderizarCategorias();
        await carregarProdutos(categoriaAtivaId);
    }
    catch (erro) {
        console.error(erro);
        catNavEl.innerHTML = `<p class="error-state">não foi possível carregar as categorias.</p>`;
    }
}
function renderizarCategorias() {
    catNavEl.innerHTML = "";
    categorias.forEach((categoria) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat-btn" + (categoria.id === categoriaAtivaId ? " active" : "");
        btn.textContent = categoria.nome;
        btn.addEventListener("click", () => selecionarCategoria(categoria.id));
        catNavEl.appendChild(btn);
    });
}
async function selecionarCategoria(id) {
    if (id === categoriaAtivaId)
        return;
    categoriaAtivaId = id;
    renderizarCategorias();
    await carregarProdutos(id);
}
async function carregarProdutos(categoriaId) {
    var _a;
    const categoria = categorias.find((c) => c.id === categoriaId);
    sectionTitleEl.textContent = categoria ? categoria.nome : "";
    productGridEl.innerHTML = `<p class="loading-state">carregando itens…</p>`;
    try {
        const produtos = await apiGet(`produtos.php?categoria_id=${categoriaId}`);
        const produtosDaCategoria = produtos.filter((p) => p.categoria_id === categoriaId);
        if (produtosDaCategoria.length === 0) {
            productGridEl.innerHTML = `<p class="empty-state">nenhum item nessa categoria ainda.</p>`;
            return;
        }
        renderizarProdutos(produtosDaCategoria, (_a = categoria === null || categoria === void 0 ? void 0 : categoria.nome) !== null && _a !== void 0 ? _a : "");
    }
    catch (erro) {
        console.error(erro);
        productGridEl.innerHTML = `<p class="error-state">não foi possível carregar os itens do cardápio.</p>`;
    }
}
function renderizarProdutos(produtos, nomeCategoria) {
    productGridEl.innerHTML = "";
    const icone = iconeParaCategoria(nomeCategoria);
    produtos.forEach((produto) => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
      <div class="product-icon">${icone}</div>
      <h3 class="product-name">${escapeHtml(produto.nome)}</h3>
      ${produto.descricao ? `<p class="product-desc">${escapeHtml(produto.descricao)}</p>` : `<p class="product-desc"></p>`}
      <div class="product-footer">
        <span class="product-price">${formatarPreco(produto.preco)}</span>
        <button type="button" class="add-btn" aria-label="Adicionar ${escapeHtml(produto.nome)}">+</button>
      </div>
    `;
        const addBtn = card.querySelector(".add-btn");
        addBtn.addEventListener("click", () => adicionarAoCarrinho(produto));
        productGridEl.appendChild(card);
    });
}
function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}
function adicionarAoCarrinho(produto) {
    const itemExistente = carrinho.find((item) => item.produto.id === produto.id);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    }
    else {
        carrinho.push({ produto, quantidade: 1 });
    }
    salvarCarrinho();
    renderizarCarrinho();
    mostrarToast(`${produto.nome} adicionado ao pedido`);
    abrirCarrinho();
}
function alterarQuantidade(produtoId, delta) {
    const item = carrinho.find((i) => i.produto.id === produtoId);
    if (!item)
        return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter((i) => i.produto.id !== produtoId);
    }
    salvarCarrinho();
    renderizarCarrinho();
}
function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter((i) => i.produto.id !== produtoId);
    salvarCarrinho();
    renderizarCarrinho();
}
function totalCarrinho() {
    return carrinho.reduce((soma, item) => soma + precoNumerico(item.produto.preco) * item.quantidade, 0);
}
function quantidadeTotalCarrinho() {
    return carrinho.reduce((soma, item) => soma + item.quantidade, 0);
}
function renderizarCarrinho() {
    const totalItens = quantidadeTotalCarrinho();
    cartBadge.textContent = String(totalItens);
    cartBadge.hidden = totalItens === 0;
    if (carrinho.length === 0) {
        cartItemsEl.innerHTML = `<p class="cart-empty">seu pedido está vazio. adicione itens do cardápio.</p>`;
    }
    else {
        cartItemsEl.innerHTML = "";
        carrinho.forEach((item) => {
            const linha = document.createElement("div");
            linha.className = "cart-item";
            linha.innerHTML = `
        <div class="cart-item-info">
          <p class="cart-item-name">${escapeHtml(item.produto.nome)}</p>
          <p class="cart-item-unit">${formatarPreco(item.produto.preco)} un.</p>
        </div>
        <div class="qty-stepper">
          <button type="button" data-action="menos" aria-label="Diminuir quantidade">–</button>
          <span>${item.quantidade}</span>
          <button type="button" data-action="mais" aria-label="Aumentar quantidade">+</button>
        </div>
        <button type="button" class="cart-item-remove" aria-label="Remover item">✕</button>
      `;
            const menosBtn = linha.querySelector('[data-action="menos"]');
            const maisBtn = linha.querySelector('[data-action="mais"]');
            const removeBtn = linha.querySelector(".cart-item-remove");
            menosBtn.addEventListener("click", () => alterarQuantidade(item.produto.id, -1));
            maisBtn.addEventListener("click", () => alterarQuantidade(item.produto.id, 1));
            removeBtn.addEventListener("click", () => removerDoCarrinho(item.produto.id));
            cartItemsEl.appendChild(linha);
        });
    }
    cartTotalEl.textContent = formatarPreco(totalCarrinho());
    atualizarEstadoBotaoEnviar();
}
function atualizarEstadoBotaoEnviar() {
    sendOrderBtn.disabled = carrinho.length === 0 || !mesaSelecionada || enviandoPedido;
    sendOrderBtn.textContent = enviandoPedido ? "enviando…" : "enviar pedido";
}
function abrirCarrinho() {
    cartOverlay.classList.add("open");
    cartDrawer.classList.add("open");
}
function fecharCarrinho() {
    cartOverlay.classList.remove("open");
    cartDrawer.classList.remove("open");
}
function salvarCarrinho() {
    try {
        sessionStorage.setItem("mango_carrinho", JSON.stringify(carrinho));
    }
    catch (_a) {
    }
}
function restaurarCarrinho() {
    try {
        const salvo = sessionStorage.getItem("mango_carrinho");
        if (salvo)
            carrinho = JSON.parse(salvo);
    }
    catch (_a) {
        carrinho = [];
    }
}
async function resolverMesaAtual() {
    const paramMesa = new URLSearchParams(window.location.search).get("mesa");
    const numero = paramMesa ? parseInt(paramMesa, 10) : NaN;
    if (paramMesa === null || Number.isNaN(numero)) {
        mesaSelecionada = null;
        exibirErroMesa();
        return;
    }
    try {
        const mesas = await apiGet("mesas.php");
        const mesa = mesas.find((m) => m.numero === numero);
        if (!mesa) {
            mesaSelecionada = null;
            exibirErroMesa();
            return;
        }
        mesaSelecionada = mesa;
        mesaOverlay.hidden = true;
        atualizarIndicadorMesa();
    }
    catch (erro) {
        console.error(erro);
        mesaSelecionada = null;
        exibirErroMesa();
    }
    finally {
        atualizarEstadoBotaoEnviar();
    }
}
function exibirErroMesa() {
    mesaOverlay.hidden = false;
    atualizarIndicadorMesa();
}
function atualizarIndicadorMesa() {
    if (mesaSelecionada) {
        mesaIndicator.textContent = `mesa ${mesaSelecionada.numero}`;
        cartMesaLineEl.textContent = `mesa ${mesaSelecionada.numero}`;
    }
    else {
        mesaIndicator.textContent = `mesa não identificada`;
        cartMesaLineEl.textContent = `nenhuma mesa identificada`;
    }
}
async function obterOuCriarPedidoAberto(mesaId) {
    const pedidos = await apiGet("pedidos.php");
    const pedidoAberto = pedidos.find((p) => p.mesa_id === mesaId && p.status === "aberto");
    if (pedidoAberto)
        return pedidoAberto;
    return apiPost("pedidos.php", { mesa_id: mesaId, status: "aberto" });
}
async function enviarPedido() {
    if (carrinho.length === 0 || !mesaSelecionada || enviandoPedido)
        return;
    enviandoPedido = true;
    atualizarEstadoBotaoEnviar();
    try {
        const pedido = await obterOuCriarPedidoAberto(mesaSelecionada.id);
        for (const item of carrinho) {
            await apiPost("itens_pedido.php", {
                pedido_id: pedido.id,
                produto_id: item.produto.id,
                quantidade: item.quantidade,
            });
        }
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
        fecharCarrinho();
        mostrarToast(`pedido enviado para a mesa ${mesaSelecionada.numero}!`);
    }
    catch (erro) {
        console.error(erro);
        mostrarToast("não foi possível enviar o pedido. tente novamente.", "error");
    }
    finally {
        enviandoPedido = false;
        atualizarEstadoBotaoEnviar();
    }
}
cartBtn.addEventListener("click", abrirCarrinho);
cartCloseBtn.addEventListener("click", fecharCarrinho);
cartOverlay.addEventListener("click", fecharCarrinho);
sendOrderBtn.addEventListener("click", () => {
    void enviarPedido();
});
async function iniciar() {
    restaurarCarrinho();
    renderizarCarrinho();
    await resolverMesaAtual();
    void carregarCategorias();
}
document.addEventListener("DOMContentLoaded", () => {
    void iniciar();
});
