const API_BASE = "../api";
let pedidos = [];
let itensPedido = [];
let produtos = [];
let mesas = [];
let pedidosDetalhados = [];
let filtroStatusAtivo = "todos";
let filtroMesaAtivo = "todas";
const ORDEM_STATUS = ["aberto", "entregue", "pago"];
const PROXIMO_STATUS = {
    aberto: "entregue",
    entregue: "pago",
    pago: null,
};
const ROTULO_ACAO = {
    aberto: "marcar como entregue",
    entregue: "marcar como pago",
    pago: "concluído",
};
function formatarPreco(preco) {
    const valor = typeof preco === "string" ? parseFloat(preco) : preco;
    const valorValido = Number.isFinite(valor) ? valor : 0;
    return valorValido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function precoNumerico(preco) {
    const valor = typeof preco === "string" ? parseFloat(preco) : preco;
    return Number.isFinite(valor) ? valor : 0;
}
function formatarHorario(data) {
    if (!data)
        return "—";
    const d = new Date(data.replace(" ", "T"));
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}
async function apiGet(caminho) {
    const resposta = await fetch(`${API_BASE}/${caminho}`);
    if (!resposta.ok) {
        throw new Error(`Falha ao buscar ${caminho} (status ${resposta.status})`);
    }
    return resposta.json();
}
async function apiPut(caminho, corpo) {
    const resposta = await fetch(`${API_BASE}/${caminho}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
    });
    if (!resposta.ok) {
        const texto = await resposta.text().catch(() => "");
        throw new Error(texto || `Falha ao atualizar ${caminho} (status ${resposta.status})`);
    }
    return resposta.json();
}
const highlightCardEl = document.getElementById("highlight-card");
const ordersBodyEl = document.getElementById("orders-body");
const mesaFilterEl = document.getElementById("mesa-filter");
const statusBtns = Array.from(document.querySelectorAll(".btn-status"));
const toastEl = document.getElementById("toast");
let toastTimer;
function mostrarToast(mensagem, tipo = "ok") {
    if (!toastEl)
        return;
    toastEl.textContent = mensagem;
    toastEl.classList.toggle("error", tipo === "error");
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 3200);
}
async function carregarTudo() {
    if (ordersBodyEl) {
        ordersBodyEl.innerHTML = `<tr><td colspan="6" class="loading-state">carregando pedidos…</td></tr>`;
    }
    try {
        [pedidos, itensPedido, produtos, mesas] = await Promise.all([
            apiGet("pedidos.php"),
            apiGet("itens_pedido.php"),
            apiGet("produtos.php"),
            apiGet("mesas.php"),
        ]);
        montarPedidosDetalhados();
        preencherFiltroDeMesas();
        renderizarDestaque();
        renderizarPedidos();
    }
    catch (erro) {
        console.error(erro);
        if (ordersBodyEl) {
            ordersBodyEl.innerHTML = `<tr><td colspan="6" class="error-state">não foi possível carregar os pedidos.</td></tr>`;
        }
    }
}
function montarPedidosDetalhados() {
    pedidosDetalhados = pedidos.map((pedido) => {
        const itensDoPedido = itensPedido.filter((item) => item.pedido_id === pedido.id);
        const linhasItens = itensDoPedido.map((item) => {
            const produto = produtos.find((p) => p.id === item.produto_id);
            const nome = produto ? produto.nome : "produto removido";
            return `${item.quantidade}x ${nome}`;
        });
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
function preencherFiltroDeMesas() {
    if (!mesaFilterEl)
        return;
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
function renderizarDestaque() {
    var _a;
    if (!highlightCardEl)
        return;
    if (itensPedido.length === 0) {
        highlightCardEl.innerHTML = `<p class="highlight-sub">ainda não há pedidos suficientes para calcular um destaque.</p>`;
        return;
    }
    const quantidadePorProduto = itensPedido.reduce((contagem, item) => {
        var _a;
        contagem[item.produto_id] = ((_a = contagem[item.produto_id]) !== null && _a !== void 0 ? _a : 0) + item.quantidade;
        return contagem;
    }, {});
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
      <p class="highlight-value">${escapeHtml((_a = produtoDestaque === null || produtoDestaque === void 0 ? void 0 : produtoDestaque.nome) !== null && _a !== void 0 ? _a : "produto removido")}</p>
      <p class="highlight-sub">${quantidadeDestaque} unidade(s) pedidas até agora</p>
    </div>
  `;
}
function pedidosFiltrados() {
    return pedidosDetalhados.filter((pd) => {
        const passaStatus = filtroStatusAtivo === "todos" || pd.pedido.status === filtroStatusAtivo;
        const passaMesa = filtroMesaAtivo === "todas" || pd.pedido.mesa_numero === filtroMesaAtivo;
        return passaStatus && passaMesa;
    });
}
function ordenarPorRecente(lista) {
    return lista.slice().sort((a, b) => b.pedido.id - a.pedido.id);
}
function renderizarPedidos() {
    if (!ordersBodyEl)
        return;
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
      <td class="order-itens">${pd.linhasItens.length > 0 ? escapeHtml(pd.linhasItens.join(", ")) : "sem itens"}</td>
      <td class="text-end order-total">${formatarPreco(pd.total)}</td>
      <td><span class="status-badge status-${pd.pedido.status}">${pd.pedido.status}</span></td>
      <td class="text-end">
        <button type="button" class="advance-btn" ${proximoStatus ? "" : "disabled"}>${rotuloAcao}</button>
      </td>
    `;
        const btn = tr.querySelector(".advance-btn");
        if (proximoStatus) {
            btn.addEventListener("click", () => void avancarStatus(pd.pedido, proximoStatus));
        }
        ordersBodyEl.appendChild(tr);
    });
}
async function avancarStatus(pedido, novoStatus) {
    try {
        await apiPut("pedidos.php", { id: pedido.id, status: novoStatus });
        pedido.status = novoStatus;
        montarPedidosDetalhados();
        renderizarPedidos();
        mostrarToast(`pedido da mesa ${pedido.mesa_numero} atualizado para "${novoStatus}"`);
    }
    catch (erro) {
        console.error(erro);
        mostrarToast("não foi possível atualizar o status. tente novamente.", "error");
    }
}
statusBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const status = btn.dataset.status;
        if (!status)
            return;
        filtroStatusAtivo = status;
        statusBtns.forEach((b) => b.classList.toggle("active", b === btn));
        renderizarPedidos();
    });
});
mesaFilterEl === null || mesaFilterEl === void 0 ? void 0 : mesaFilterEl.addEventListener("change", () => {
    const valor = mesaFilterEl.value;
    filtroMesaAtivo = valor === "todas" ? "todas" : Number(valor);
    renderizarPedidos();
});
document.addEventListener("DOMContentLoaded", () => {
    void carregarTudo();
});
export {};
