// ===== Mango Café — painel administrativo =====
// Consome api/pedidos.php, api/itens_pedido.php, api/produtos.php e api/mesas.php via fetch.

export {}; // torna este arquivo um módulo isolado, evitando colisão de nomes com cardapio.ts

// ---------- Tipos ----------

type StatusPedido = "aberto" | "entregue" | "pago";
type FiltroStatus = "todos" | StatusPedido;

interface Produto {
  id: number;
  nome: string;
  preco: number | string;
  categoria_id: number;
}

interface Mesa {
  id: number;
  numero: number;
}

interface Pedido {
  id: number;
  mesa_id: number;
  mesa_numero: number; // já vem pronto do JOIN em pedidos.php
  status: StatusPedido;
  data?: string;
}

interface ItemPedido {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
}

// Estrutura já pronta para renderização (dados de várias tabelas consolidados)
interface PedidoDetalhado {
  pedido: Pedido;
  itens: ItemPedido[];
  linhasItens: string[]; // via map(): "2x Latte"
  total: number; // via reduce()
}

// ---------- Config ----------

const API_BASE = "../api";

// ---------- Estado ----------

let pedidos: Pedido[] = [];
let itensPedido: ItemPedido[] = [];
let produtos: Produto[] = [];
let mesas: Mesa[] = [];

let pedidosDetalhados: PedidoDetalhado[] = [];
let filtroStatusAtivo: FiltroStatus = "todos";
let filtroMesaAtivo: number | "todas" = "todas";

const ORDEM_STATUS: StatusPedido[] = ["aberto", "entregue", "pago"];
const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  aberto: "entregue",
  entregue: "pago",
  pago: null,
};
const ROTULO_ACAO: Record<StatusPedido, string> = {
  aberto: "marcar como entregue",
  entregue: "marcar como pago",
  pago: "concluído",
};

// ---------- Utilidades ----------

function formatarPreco(preco: number | string): string {
  const valor = typeof preco === "string" ? parseFloat(preco) : preco;
  const valorValido = Number.isFinite(valor) ? valor : 0;
  return valorValido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function precoNumerico(preco: number | string): number {
  const valor = typeof preco === "string" ? parseFloat(preco) : preco;
  return Number.isFinite(valor) ? valor : 0;
}

function formatarHorario(data: string | undefined): string {
  if (!data) return "—";
  const d = new Date(data.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function apiGet<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar ${caminho} (status ${resposta.status})`);
  }
  return resposta.json() as Promise<T>;
}

async function apiPut<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new Error(texto || `Falha ao atualizar ${caminho} (status ${resposta.status})`);
  }
  return resposta.json() as Promise<T>;
}

// ---------- Elementos do DOM ----------

const highlightCardEl = document.getElementById("highlight-card") as HTMLElement | null;
const ordersBodyEl = document.getElementById("orders-body") as HTMLElement | null;
const mesaFilterEl = document.getElementById("mesa-filter") as HTMLSelectElement | null;
const statusBtns = Array.from(document.querySelectorAll<HTMLButtonElement>(".btn-status"));
const toastEl = document.getElementById("toast") as HTMLElement | null;

// ---------- Toast ----------

let toastTimer: number | undefined;

function mostrarToast(mensagem: string, tipo: "ok" | "error" = "ok"): void {
  if (!toastEl) return;
  toastEl.textContent = mensagem;
  toastEl.classList.toggle("error", tipo === "error");
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 3200);
}

// ---------- Carregamento e montagem dos dados ----------

async function carregarTudo(): Promise<void> {
  if (ordersBodyEl) {
    ordersBodyEl.innerHTML = `<tr><td colspan="6" class="loading-state">carregando pedidos…</td></tr>`;
  }

  try {
    [pedidos, itensPedido, produtos, mesas] = await Promise.all([
      apiGet<Pedido[]>("pedidos.php"),
      apiGet<ItemPedido[]>("itens_pedido.php"),
      apiGet<Produto[]>("produtos.php"),
      apiGet<Mesa[]>("mesas.php"),
    ]);

    montarPedidosDetalhados();
    preencherFiltroDeMesas();
    renderizarDestaque();
    renderizarPedidos();
  } catch (erro) {
    console.error(erro);
    if (ordersBodyEl) {
      ordersBodyEl.innerHTML = `<tr><td colspan="6" class="error-state">não foi possível carregar os pedidos.</td></tr>`;
    }
  }
}

// Junta pedidos + itens_pedido + produtos + mesas em algo pronto para a tela.
function montarPedidosDetalhados(): void {
  pedidosDetalhados = pedidos.map((pedido): PedidoDetalhado => {
    // filter(): separa só os itens deste pedido dentro da lista completa
    const itensDoPedido = itensPedido.filter((item) => item.pedido_id === pedido.id);

    // map(): transforma cada item em uma linha de texto pronta para exibir ("2x Latte")
    const linhasItens = itensDoPedido.map((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const nome = produto ? produto.nome : "produto removido";
      return `${item.quantidade}x ${nome}`;
    });

    // reduce(): soma o valor de todos os itens do pedido em um total financeiro
    const total = itensDoPedido.reduce((soma, item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const preco = produto ? precoNumerico(produto.preco) : 0;
      return soma + preco * item.quantidade;
    }, 0);

    return {
      pedido,
      itens: itensDoPedido,
      linhasItens,
      total,
    };
  });
}

function preencherFiltroDeMesas(): void {
  if (!mesaFilterEl) return;
  const valorAtual = mesaFilterEl.value;
  mesaFilterEl.innerHTML = `<option value="todas">todas</option>`;
  mesas
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .forEach((mesa) => {
      const opt = document.createElement("option");
      opt.value = String(mesa.numero);
      opt.textContent = `mesa ${mesa.numero}`;
      mesaFilterEl.appendChild(opt);
    });
  if ([...mesaFilterEl.options].some((o) => o.value === valorAtual)) {
    mesaFilterEl.value = valorAtual;
  }
}

// ---------- Destaque do dia (ranking dinâmico) ----------

function renderizarDestaque(): void {
  if (!highlightCardEl) return;

  if (itensPedido.length === 0) {
    highlightCardEl.innerHTML = `<p class="highlight-sub">ainda não há pedidos suficientes para calcular um destaque.</p>`;
    return;
  }

  // reduce(): conta a quantidade pedida de cada produto, indexado por produto_id
  const quantidadePorProduto = itensPedido.reduce<Record<number, number>>((contagem, item) => {
    contagem[item.produto_id] = (contagem[item.produto_id] ?? 0) + item.quantidade;
    return contagem;
  }, {});

  // reduce(): encontra o produto com maior quantidade sem precisar ordenar tudo
  const idMaisPedidoStr = Object.keys(quantidadePorProduto).reduce((idMaisVendido, idAtual) => {
    return quantidadePorProduto[Number(idAtual)] > quantidadePorProduto[Number(idMaisVendido)]
      ? idAtual
      : idMaisVendido;
  });

  const idMaisPedido = Number(idMaisPedidoStr);
  const produtoDestaque = produtos.find((p) => p.id === idMaisPedido);
  const quantidadeDestaque = quantidadePorProduto[idMaisPedido];

  highlightCardEl.innerHTML = `
    <div>
      <p class="highlight-label">destaque do dia</p>
      <p class="highlight-value">${escapeHtml(produtoDestaque?.nome ?? "produto removido")}</p>
      <p class="highlight-sub">${quantidadeDestaque} unidade(s) pedidas até agora</p>
    </div>
  `;
}

// ---------- Filtro (segmentação de pedidos) ----------

function pedidosFiltrados(): PedidoDetalhado[] {
  // filter(): aplica o filtro de negócio escolhido (status e/ou mesa) sobre a lista completa
  return pedidosDetalhados.filter((pd) => {
    const passaStatus = filtroStatusAtivo === "todos" || pd.pedido.status === filtroStatusAtivo;
    const passaMesa = filtroMesaAtivo === "todas" || pd.pedido.mesa_numero === filtroMesaAtivo;
    return passaStatus && passaMesa;
  });
}

function ordenarPorRecente(lista: PedidoDetalhado[]): PedidoDetalhado[] {
  return lista.slice().sort((a, b) => b.pedido.id - a.pedido.id);
}

// ---------- Renderização da tabela ----------

function renderizarPedidos(): void {
  if (!ordersBodyEl) return;

  const lista = ordenarPorRecente(pedidosFiltrados());

  if (lista.length === 0) {
    ordersBodyEl.innerHTML = `<tr><td colspan="6" class="empty-state">nenhum pedido encontrado para esse filtro.</td></tr>`;
    return;
  }

  ordersBodyEl.innerHTML = "";
  lista.forEach((pd) => {
    const tr = document.createElement("tr");

    const proximoStatus = PROXIMO_STATUS[pd.pedido.status];
    const rotuloAcao = ROTULO_ACAO[pd.pedido.status];

    tr.innerHTML = `
      <td class="order-mesa">mesa ${pd.pedido.mesa_numero}</td>
      <td>${formatarHorario(pd.pedido.data)}</td>
      <td class="order-itens">${
        pd.linhasItens.length > 0 ? escapeHtml(pd.linhasItens.join(", ")) : "sem itens"
      }</td>
      <td class="text-end order-total">${formatarPreco(pd.total)}</td>
      <td><span class="status-badge status-${pd.pedido.status}">${pd.pedido.status}</span></td>
      <td class="text-end">
        <button type="button" class="advance-btn" ${proximoStatus ? "" : "disabled"}>${rotuloAcao}</button>
      </td>
    `;

    const btn = tr.querySelector(".advance-btn") as HTMLButtonElement;
    if (proximoStatus) {
      btn.addEventListener("click", () => void avancarStatus(pd.pedido, proximoStatus));
    }

    ordersBodyEl.appendChild(tr);
  });
}

async function avancarStatus(pedido: Pedido, novoStatus: StatusPedido): Promise<void> {
  try {
    await apiPut<{ mensagem: string }>("pedidos.php", { id: pedido.id, status: novoStatus });
    pedido.status = novoStatus;
    montarPedidosDetalhados();
    renderizarPedidos();
    mostrarToast(`pedido da mesa ${pedido.mesa_numero} atualizado para "${novoStatus}"`);
  } catch (erro) {
    console.error(erro);
    mostrarToast("não foi possível atualizar o status. tente novamente.", "error");
  }
}

// ---------- Eventos de filtro ----------

statusBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const status = btn.dataset.status as FiltroStatus | undefined;
    if (!status) return;
    filtroStatusAtivo = status;
    statusBtns.forEach((b) => b.classList.toggle("active", b === btn));
    renderizarPedidos();
  });
});

mesaFilterEl?.addEventListener("change", () => {
  const valor = mesaFilterEl.value;
  filtroMesaAtivo = valor === "todas" ? "todas" : Number(valor);
  renderizarPedidos();
});

// ---------- Inicialização ----------

document.addEventListener("DOMContentLoaded", () => {
  void carregarTudo();
});