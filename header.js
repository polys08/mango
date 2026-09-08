// ===== Mango Café — header compartilhado =====
// Centraliza o cabeçalho usado em cardapio.html e admin.html.
// Uso: <div id="menu-header-placeholder" data-page="cardapio"></div>
//      <script src="js/components/header.js"></script>
// (o script deve vir logo depois do placeholder e ANTES do cardapio.js/admin.js,
// para que os elementos do header já existam quando esses módulos rodarem)

// Lê ?mesa= da URL atual e devolve "?mesa=N" (ou "" se não houver mesa)
function obterQueryMesa() {
  const numero = new URLSearchParams(window.location.search).get("mesa");
  return numero ? `?mesa=${encodeURIComponent(numero)}` : "";
}

function renderMenuHeader(pagina) {
  const queryMesa = obterQueryMesa();

  if (pagina === "cardapio") {
    return `
      <header class="menu-header">
        <a class="menu-logo-link" href="index.html${queryMesa}" id="logo-link">
          <img src="img/produtos/logocardapio.png" alt="Mango Café" class="menu-logo">
        </a>
        <div class="menu-header-actions">
          <span id="mesa-indicator" class="mesa-indicator">mesa —</span>
          <a class="cart-btn" href="admin.html${queryMesa}" aria-label="Painel administrativo" title="painel administrativo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </a>
          <button type="button" id="cart-btn" class="cart-btn" aria-label="Ver pedido">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8V6a6 6 0 1 1 12 0v2M4 8h16l-1.2 12.1a2 2 0 0 1-2 1.9H7.2a2 2 0 0 1-2-1.9L4 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            <span id="cart-badge" class="cart-badge" hidden>0</span>
          </button>
        </div>
      </header>
    `;
  }

  if (pagina === "admin") {
    return `
      <header class="menu-header">
        <a class="menu-logo-link" href="index.html${queryMesa}">
          <img src="img/produtos/logocardapio.png" alt="Mango Café" class="menu-logo">
        </a>
        <div class="menu-header-actions">
          <span class="admin-title">painel administrativo</span>
          <a class="cart-btn" href="cardapio.html${queryMesa}" aria-label="Voltar ao cardápio" title="voltar ao cardápio">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8V6a6 6 0 1 1 12 0v2M4 8h16l-1.2 12.1a2 2 0 0 1-2 1.9H7.2a2 2 0 0 1-2-1.9L4 8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </header>
    `;
  }

  return "";
}

(function inicializarHeader() {
  const placeholder = document.getElementById("menu-header-placeholder");
  if (!placeholder) return;
  const pagina = placeholder.dataset.page;
  placeholder.outerHTML = renderMenuHeader(pagina);
})();