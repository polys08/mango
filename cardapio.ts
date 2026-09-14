
// - tipos

interface Categoria {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number | string;
  categoria_id: number;
  descricao?: string | null;
  imagem?: string | null;
}

interface Mesa {
  id: number;
  numero: number;
}

interface Pedido {
  id: number;
  mesa_id: number;
  status: "aberto" | "fechado";
  data?: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

// - config

const API_BASE = "../api";

// - estado

let categorias: Categoria[] = [];
let categoriaAtivaId: number | null = null;
let carrinho: ItemCarrinho[] = [];
let mesaSelecionada: Mesa | null = null;
let enviandoPedido = false;

// - utilidades

function formatarPreco(preco: number | string): string {
  const valor = typeof preco === "string" ? parseFloat(preco) : preco;
  const valorValido = Number.isFinite(valor) ? valor : 0;
  return valorValido.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoNumerico(preco: number | string): number {
  const valor = typeof preco === "string" ? parseFloat(preco) : preco;
  return Number.isFinite(valor) ? valor : 0;
}

async function apiGet<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar ${caminho} (status ${resposta.status})`);
  }
  return resposta.json() as Promise<T>;
}

async function apiPost<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new Error(texto || `Falha ao enviar para ${caminho} (status ${resposta.status})`);
  }
  return resposta.json() as Promise<T>;
}

// - elementos do DOM

const catNavEl = document.getElementById("cat-nav") as HTMLElement;
const sectionTitleEl = document.getElementById("section-title") as HTMLElement;
const productGridEl = document.getElementById("product-grid") as HTMLElement;

const cartBtn = document.getElementById("cart-btn") as HTMLButtonElement;
const cartBadge = document.getElementById("cart-badge") as HTMLElement;
const cartOverlay = document.getElementById("cart-overlay") as HTMLElement;
const cartDrawer = document.getElementById("cart-drawer") as HTMLElement;
const cartCloseBtn = document.getElementById("cart-close") as HTMLButtonElement;
const cartItemsEl = document.getElementById("cart-items") as HTMLElement;
const cartTotalEl = document.getElementById("cart-total") as HTMLElement;
const cartMesaLineEl = document.getElementById("cart-mesa-line") as HTMLElement;
const sendOrderBtn = document.getElementById("send-order-btn") as HTMLButtonElement;

const mesaOverlay = document.getElementById("mesa-overlay") as HTMLElement;
const mesaIndicator = document.getElementById("mesa-indicator") as HTMLElement;

const toastEl = document.getElementById("toast") as HTMLElement;

// - ícones por categoria (decorativo)

const ICONE_PADRAO = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 26h30v16a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10V26Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M44 30h4a6 6 0 0 1 0 12h-4" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const ICONE_SALGADO = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 34c0-10 10-20 22-20s22 10 22 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 34h44l-4 18H14l-4-18Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`;

const ICONE_DOCE = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="14" width="32" height="36" rx="4" stroke="currentColor" stroke-width="3"/><path d="M16 26h32M24 14v-4M40 14v-4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;

function iconeParaCategoria(nomeCategoria: string): string {
  const nome = nomeCategoria.toLowerCase();
  if (nome.includes("salgado")) return ICONE_SALGADO;
  if (nome.includes("doce")) return ICONE_DOCE;
  return ICONE_PADRAO;
}

// - tag de produto (só na seção salgados)

const NOMES_HALAL_SALGADOS = ["empada", "shawarma"];

function obterTagProduto(produto: Produto, nomeCategoria: string): { classe: string; conteudo: string } | null {
  if (!nomeCategoria.toLowerCase().includes("salgado")) return null;
  const nome = produto.nome.trim().toLowerCase();

  if (NOMES_HALAL_SALGADOS.includes(nome)) {
    return { classe: "tag-halal", conteudo: `<span>halal</span>` };
  }
  return null;
}

// - toast

let toastTimer: number | undefined;

function mostrarToast(mensagem: string, tipo: "ok" | "error" = "ok"): void {
  toastEl.textContent = mensagem;
  toastEl.classList.toggle("error", tipo === "error");
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 3200);
}

// - categorias

async function carregarCategorias(): Promise<void> {
  catNavEl.innerHTML = `<p class="loading-state">carregando categorias…</p>`;
  try {
    categorias = await apiGet<Categoria[]>("categorias.php");
    if (categorias.length === 0) {
      catNavEl.innerHTML = `<p class="empty-state">nenhuma categoria cadastrada ainda.</p>`;
      return;
    }
    categoriaAtivaId = categorias[0].id;
    renderizarCategorias();
    await carregarProdutos(categoriaAtivaId);
  } catch (erro) {
    console.error(erro);
    catNavEl.innerHTML = `<p class="error-state">não foi possível carregar as categorias.</p>`;
  }
}

function renderizarCategorias(): void {
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

async function selecionarCategoria(id: number): Promise<void> {
  if (id === categoriaAtivaId) return;
  categoriaAtivaId = id;
  renderizarCategorias();
  await carregarProdutos(id);
}

// - produtos

async function carregarProdutos(categoriaId: number): Promise<void> {
  const categoria = categorias.find((c) => c.id === categoriaId);
  sectionTitleEl.textContent = categoria ? categoria.nome : "";
  productGridEl.innerHTML = `<p class="loading-state">carregando itens…</p>`;

  try {
    const produtos = await apiGet<Produto[]>(`produtos.php?categoria_id=${categoriaId}`);
    // edge case: a API pode devolver todos os produtos ignorando o filtro —
    // garantimos a filtragem correta no cliente também.
    const produtosDaCategoria = produtos.filter((p) => p.categoria_id === categoriaId);

    if (produtosDaCategoria.length === 0) {
      productGridEl.innerHTML = `<p class="empty-state">nenhum item nessa categoria ainda.</p>`;
      return;
    }
    renderizarProdutos(produtosDaCategoria, categoria?.nome ?? "");
  } catch (erro) {
    console.error(erro);
    productGridEl.innerHTML = `<p class="error-state">não foi possível carregar os itens do cardápio.</p>`;
  }
}

function renderizarProdutos(produtos: Produto[], nomeCategoria: string): void {
  productGridEl.innerHTML = "";
  const icone = iconeParaCategoria(nomeCategoria);

  produtos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const mediaHtml = produto.imagem
      ? `<img class="product-photo" src="img/produtos/${escapeHtml(produto.imagem)}" alt="${escapeHtml(produto.nome)}">`
      : `<div class="product-icon">${icone}</div>`;

    const tag = obterTagProduto(produto, nomeCategoria);
    const tagHtml = tag ? `<span class="product-tag ${tag.classe}">${tag.conteudo}</span>` : "";

    card.innerHTML = `
      <div class="product-media">
        ${mediaHtml}
        ${tagHtml}
      </div>
      <h3 class="product-name">${escapeHtml(produto.nome)}</h3>
      ${produto.descricao ? `<p class="product-desc">${escapeHtml(produto.descricao)}</p>` : `<p class="product-desc"></p>`}
      <div class="product-footer">
        <span class="product-price">${formatarPreco(produto.preco)}</span>
        <button type="button" class="add-btn" aria-label="Adicionar ${escapeHtml(produto.nome)}">+</button>
      </div>
    `;
    const addBtn = card.querySelector(".add-btn") as HTMLButtonElement;
    addBtn.addEventListener("click", () => adicionarAoCarrinho(produto));
    productGridEl.appendChild(card);
  });
}

function escapeHtml(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// - carrinho

function adicionarAoCarrinho(produto: Produto): void {
  const itemExistente = carrinho.find((item) => item.produto.id === produto.id);
  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({ produto, quantidade: 1 });
  }
  salvarCarrinho();
  renderizarCarrinho();
  mostrarToast(`${produto.nome} adicionado ao pedido`);
  abrirCarrinho();
}

function alterarQuantidade(produtoId: number, delta: number): void {
  const item = carrinho.find((i) => i.produto.id === produtoId);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter((i) => i.produto.id !== produtoId);
  }
  salvarCarrinho();
  renderizarCarrinho();
}

function removerDoCarrinho(produtoId: number): void {
  carrinho = carrinho.filter((i) => i.produto.id !== produtoId);
  salvarCarrinho();
  renderizarCarrinho();
}

function totalCarrinho(): number {
  return carrinho.reduce((soma, item) => soma + precoNumerico(item.produto.preco) * item.quantidade, 0);
}

function quantidadeTotalCarrinho(): number {
  return carrinho.reduce((soma, item) => soma + item.quantidade, 0);
}

function renderizarCarrinho(): void {
  const totalItens = quantidadeTotalCarrinho();
  cartBadge.textContent = String(totalItens);
  cartBadge.hidden = totalItens === 0;

  if (carrinho.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">seu pedido está vazio. adicione itens do cardápio.</p>`;
  } else {
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
      const menosBtn = linha.querySelector('[data-action="menos"]') as HTMLButtonElement;
      const maisBtn = linha.querySelector('[data-action="mais"]') as HTMLButtonElement;
      const removeBtn = linha.querySelector(".cart-item-remove") as HTMLButtonElement;
      menosBtn.addEventListener("click", () => alterarQuantidade(item.produto.id, -1));
      maisBtn.addEventListener("click", () => alterarQuantidade(item.produto.id, 1));
      removeBtn.addEventListener("click", () => removerDoCarrinho(item.produto.id));
      cartItemsEl.appendChild(linha);
    });
  }

  cartTotalEl.textContent = formatarPreco(totalCarrinho());
  atualizarEstadoBotaoEnviar();
}

function atualizarEstadoBotaoEnviar(): void {
  sendOrderBtn.disabled = carrinho.length === 0 || !mesaSelecionada || enviandoPedido;
  sendOrderBtn.textContent = enviandoPedido ? "enviando…" : "enviar pedido";
}

function abrirCarrinho(): void {
  cartOverlay.classList.add("open");
  cartDrawer.classList.add("open");
}

function fecharCarrinho(): void {
  cartOverlay.classList.remove("open");
  cartDrawer.classList.remove("open");
}

function salvarCarrinho(): void {
  try {
    sessionStorage.setItem("mango_carrinho", JSON.stringify(carrinho));
  } catch {
    // sessionStorage indisponível — segue só em memória
  }
}

function restaurarCarrinho(): void {
  try {
    const salvo = sessionStorage.getItem("mango_carrinho");
    if (salvo) carrinho = JSON.parse(salvo) as ItemCarrinho[];
  } catch {
    carrinho = [];
  }
}

// - mesa

async function resolverMesaAtual(): Promise<void> {
  const paramMesa = new URLSearchParams(window.location.search).get("mesa");
  const numero = paramMesa ? parseInt(paramMesa, 10) : NaN;

  if (paramMesa === null || Number.isNaN(numero)) {
    mesaSelecionada = null;
    exibirErroMesa();
    return;
  }

  try {
    const mesas = await apiGet<Mesa[]>("mesas.php");
    const mesa = mesas.find((m) => m.numero === numero);
    if (!mesa) {
      mesaSelecionada = null;
      exibirErroMesa();
      return;
    }
    mesaSelecionada = mesa;
    mesaOverlay.hidden = true;
    atualizarIndicadorMesa();
  } catch (erro) {
    console.error(erro);
    mesaSelecionada = null;
    exibirErroMesa();
  } finally {
    atualizarEstadoBotaoEnviar();
  }

  const logoLink = document.getElementById("logo-link") as HTMLAnchorElement | null;
  if (logoLink && mesaSelecionada) {
    logoLink.href = `index.html?mesa=${mesaSelecionada.numero}`;
  }
}

function exibirErroMesa(): void {
  mesaOverlay.hidden = false;
  atualizarIndicadorMesa();
}

function atualizarIndicadorMesa(): void {
  if (mesaSelecionada) {
    mesaIndicator.textContent = `mesa ${mesaSelecionada.numero}`;
    cartMesaLineEl.textContent = `mesa ${mesaSelecionada.numero}`;
  } else {
    mesaIndicator.textContent = `mesa não identificada`;
    cartMesaLineEl.textContent = `nenhuma mesa identificada`;
  }
}

// - envio do pedido

async function obterOuCriarPedidoAberto(mesaId: number): Promise<Pedido> {
  const pedidos = await apiGet<Pedido[]>("pedidos.php");
  const pedidoAberto = pedidos.find((p) => p.mesa_id === mesaId && p.status === "aberto");
  if (pedidoAberto) return pedidoAberto;

  return apiPost<Pedido>("pedidos.php", { mesa_id: mesaId, status: "aberto" });
}

async function enviarPedido(): Promise<void> {
  if (carrinho.length === 0 || !mesaSelecionada || enviandoPedido) return;

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
  } catch (erro) {
    console.error(erro);
    mostrarToast("não foi possível enviar o pedido. tente novamente.", "error");
  } finally {
    enviandoPedido = false;
    atualizarEstadoBotaoEnviar();
  }
}

// - eventos

cartBtn.addEventListener("click", abrirCarrinho);
cartCloseBtn.addEventListener("click", fecharCarrinho);
cartOverlay.addEventListener("click", fecharCarrinho);
sendOrderBtn.addEventListener("click", () => {
  void enviarPedido();
});

// - inicialização

async function iniciar(): Promise<void> {
  restaurarCarrinho();
  renderizarCarrinho();
  await resolverMesaAtual();
  void carregarCategorias();
}

document.addEventListener("DOMContentLoaded", () => {
  void iniciar();
});