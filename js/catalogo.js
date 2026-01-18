///   VAR GLOBAIS   ///
let todosDiscos = [];
let itemAtualCarrinho = null;
let favoritos = (JSON.parse(localStorage.getItem("favoritos")) || [])
  .map(f => typeof f === "object" ? Number(f.id) : Number(f));


//  --  Nomes dos Países para o menu do filtro  --  //
const nomesPaises = {
  "br": "Brasil", "us": "Estados Unidos", "uk": "Reino Unido",
  "eu": "Europa", "jp": "Japão", "fr": "França",
  "de": "Alemanha", "it": "Itália", "at": "Áustria", "EU": "Europa", "se": "Suécia", "ru": "Rússia"
};

// ---   CARRINHO  ---   ///
function atualizarContadorCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const contadorCarrinho = document.getElementById("carrinho-contador");

  if (contadorCarrinho) {
    contadorCarrinho.innerText = totalItens;
    contadorCarrinho.style.display = totalItens > 0 ? "inline-block" : "none";
  };

  console.log("Total itens contador: " + totalItens);
}

///   INICIALIZAÇÃO   ///
document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
  atualizarContadorCarrinho();

  // Menu Sanduiche - Bulma CSS  //
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  $navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });

  //  --  Menu Sanduíche -- Filtros  //
  const botaoMobile = document.getElementById("botao-menu-mobile");
  const menuNavegacao = document.getElementById("navbarFiltros");

  if (botaoMobile && menuNavegacao) {
    botaoMobile.addEventListener("click", (e) => {
      e.stopPropagation();
      botaoMobile.classList.toggle("is-active");
      menuNavegacao.classList.toggle("is-active");

      if (menuNavegacao.classList.contains("is-active")) {
        menuNavegacao.scrollTop = 0;
        document.body.classList.add("menu-aberto");
      } else {
        document.body.classList.remove("menu-aberto");
      }
    });
  }

  //  --  Dropdowns  --  //
  const dropdownsInternos = document.querySelectorAll("#navbarFiltros .has-dropdown");
  dropdownsInternos.forEach(dropdown => {
    const link = dropdown.querySelector(".navbar-link");

    if (link) {
      link.addEventListener("click", (e) => {

        if (window.matchMedia("(max-width: 1023px)").matches) {
          e.preventDefault();
          e.stopPropagation();
          dropdownsInternos.forEach(d => { if (d !== dropdown) d.classList.remove("is-active"); });
          dropdown.classList.toggle("is-active");
        }
      });
    }
  });

  document.addEventListener("click", (e) => {

    if (menuNavegacao && menuNavegacao.classList.contains("is-active")) {

      if (!menuNavegacao.contains(e.target) && e.target !== botaoMobile) {
        fecharMenuMobile();
        dropdownsInternos.forEach(d => d.classList.remove("is-active"));
      }
    }
  });

  ////    BUSCA POR INPUT    ////
  const inputBusca = document.getElementById("inputBusca");

  if (inputBusca) {
    inputBusca.addEventListener("keypress", (e) => { if (e.key === "Enter") executarBusca(); });
    inputBusca.addEventListener("input", () => { if (inputBusca.value === "") renderizarVertical(todosDiscos); });
  }
});

function fecharMenuMobile() {
  const menuNavegacao = document.getElementById("navbarFiltros");
  const botaoMobile = document.getElementById("botao-menu-mobile");

  if (window.innerWidth < 1024) {

    if (menuNavegacao) menuNavegacao.classList.remove("is-active");

    if (botaoMobile) botaoMobile.classList.remove("is-active");
    document.body.classList.remove("menu-aberto");
  }
}

////           CARREGAMENTO DE DADOS       ////
async function carregarDados() {
  try {
    const resposta = await fetch("./data/catalogo_discos.json");

    todosDiscos = await resposta.json();

    configurarFiltrosDinamicos(todosDiscos);

    if (document.getElementById("lista-vertical")) renderizarVertical(todosDiscos);
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}


function configurarFiltrosDinamicos(discos) {
  let artistas = [];
  let albuns = [];
  let estilos = [];
  let paises = [];
  let decadas = [];

  discos.forEach(disco => {

    // --- ARTISTAS ---  ///
    if (!artistas.includes(disco.artista)) {
      artistas.push(disco.artista);
    }

    //  --  ÁLBUNS  --  //
    if (!albuns.includes(disco.album)) {
      albuns.push(disco.album);
    }

    //  --  PAÍSES  --  //
    if (!paises.includes(disco.pais)) {
      paises.push(disco.pais);
    }

    //  -- ESTILOS --  //
    disco.estilo.forEach(est => {
      if (!estilos.includes(est)) {
        estilos.push(est);
      }
    });

    //  --  DÉCADAS  --  //
    let decada = Math.floor(disco.lancamento / 10) * 10;
    if (!decadas.includes(decada)) {
      decadas.push(decada);
    }

  });

  //  -- Ordenações -- //  
  artistas.sort();
  albuns.sort();
  estilos.sort();
  paises.sort();
  decadas.sort((a, b) => b - a);

  // -- Menus  --  //
  preencherMenu("filtro-artista", artistas, "artista");
  preencherMenu("filtro-album", albuns, "album");
  preencherMenu("filtro-genero", estilos, "estilo");
  preencherMenuPais("filtro-pais", paises);
  preencherMenuDecadas("filtro-ano", decadas);
}


//  --  Países e Bandeiras  --  //
function preencherMenuPais(idContainer, lista) {
  const container = document.getElementById(idContainer);

  if (!container) return;
  container.innerHTML += lista.map(codigo => `
        <a class="navbar-item" onclick="aplicarFiltro('pais', '${codigo}')">
            <span class="icon is-small mr-3"><span class="fi fi-${codigo}"></span></span>
            <span>${nomesPaises[codigo] || codigo.toUpperCase()}</span>
        </a>`).join("");
}

//  --  Menu Décadas  --  //
function preencherMenuDecadas(idContainer, lista) {
  const container = document.getElementById(idContainer);

  if (!container) return;
  container.innerHTML += lista.map(anoBase => {
   
    let label = anoBase >= 2000 ? `Anos ${anoBase}` : `Anos ${anoBase.toString().substring(2)}`;
    return `
    <a class="navbar-item" onclick="aplicarFiltro('decada', ${anoBase})">${label}</a>`;
  }).join("");
}

//  --  Estrutura dos Menus   --  //
function preencherMenu(idContainer, lista, campo) {
  const container = document.getElementById(idContainer);

  if (!container) return;
  container.innerHTML += lista.map(item => `
        <a class="navbar-item" onclick="aplicarFiltro('${campo}', '${item}')">
            ${campo === "pais" ? item.toUpperCase() : item}
        </a>`).join("");
}

//  --  Aplicação dos Filtros  --  //
window.aplicarFiltro = function (campo, valor) {
  let filtrados = [];

  if (campo === "estilo") filtrados = todosDiscos.filter(d => d.estilo.includes(valor));

  else if (campo === "decada") filtrados = todosDiscos.filter(d => d.lancamento >= valor && d.lancamento <= valor + 9);
  else filtrados = todosDiscos.filter(d => d[campo] == valor);

  if (document.getElementById("lista-vertical")) renderizarVertical(filtrados);
  fecharMenuMobile();
};

window.limparFiltros = function () {
  const inputBusca = document.getElementById("inputBusca");

  if (inputBusca) inputBusca.value = "";
  renderizarVertical(todosDiscos);
  fecharMenuMobile();
}

//  --  Ordenar  --  //
window.ordenar = function (campo, direcao) {
  const ordenados = [...todosDiscos].sort((a, b) => {
    let valA = a[campo], valB = b[campo];

    if (typeof valA === "string") return direcao === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return direcao === "asc" ? valA - valB : valB - valA;
  });

  renderizarVertical(ordenados);
  fecharMenuMobile();
}

////    FILTRO DE BUSCA   ////
window.executarBusca = function () {
  const input = document.getElementById("inputBusca");
  const termo = input.value.toLowerCase().trim();
  const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const termoNormalizado = normalizar(termo);

  if (termoNormalizado === "") {
    renderizarVertical(todosDiscos);
  } else {
    const resultados = todosDiscos.filter(disco => {
      return normalizar(disco.album).includes(termoNormalizado) || normalizar(disco.artista).includes(termoNormalizado);
    });

    renderizarVertical(resultados);
  }

  fecharMenuMobile();
}

////         CARRINHO         ////
window.abrirModalCarrinho = function (id) {
  const disco = todosDiscos.find(d => Number(d.id) === Number(id));

  if (!disco) return;
  itemAtualCarrinho = disco;

  const qtdInput = document.getElementById("carrinho-qtd");

  if (qtdInput) {
    qtdInput.value = 1;
    qtdInput.max = itemAtualCarrinho.estoque || 99;
  }

  document.getElementById("carrinho-capa").src = itemAtualCarrinho.capa;
  document.getElementById("carrinho-album").innerText = itemAtualCarrinho.album;
  document.querySelectorAll("#carrinho-artista").forEach(el => el.innerText = itemAtualCarrinho.artista);

  const precoNormal = Number(itemAtualCarrinho.preco);
  const precoFinal = calcularPrecoComDesconto(itemAtualCarrinho);

  const precoCarrinho = document.getElementById("carrinho-preco");

  if (itemAtualCarrinho.oferta && itemAtualCarrinho.percentualDesconto) {
    precoCarrinho.innerHTML = `
        <span class="preco-normal-modal">
          R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span class="preco-desconto-modal">
          R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      `;

  } else {
    precoCarrinho.innerHTML = `
          <span class="preco-modal">
            R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
      `;
  }

  document.getElementById("modal-carrinho").classList.add("is-active");
}

window.alterarQtd = function (valor) {
  const input = document.getElementById("carrinho-qtd");
  let novoValor = parseInt(input.value) + valor;

  if (novoValor >= 1 && novoValor <= (itemAtualCarrinho.estoque || 99)) {
    input.value = novoValor;
  }
};

//  --  Add Carrinho  --  //
window.confirmarAdicao = function () {
  if (!itemAtualCarrinho) return;
  const qtdDesejada = parseInt(document.getElementById("carrinho-qtd").value);
  const estoqueLimite = itemAtualCarrinho.estoque !== undefined ? Number(itemAtualCarrinho.estoque) : 99;

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const indexExistente = carrinho.findIndex(item => Number(item.id) === Number(itemAtualCarrinho.id));
  const qtdJaNoCarrinho = indexExistente !== -1 ? Number(carrinho[indexExistente].quantidade) : 0;

  if ((qtdJaNoCarrinho + qtdDesejada) > estoqueLimite) {
    fecharModalCarrinho();
    document.getElementById("modal-carrinho-erro").classList.add("is-active");
    return;
  }

  if (indexExistente !== -1) {
    carrinho[indexExistente].quantidade += qtdDesejada;
  } else {
    carrinho.push({
      id: Number(itemAtualCarrinho.id),
      album: itemAtualCarrinho.album,
      artista: itemAtualCarrinho.artista,
      capa: itemAtualCarrinho.capa,
      preco: calcularPrecoComDesconto(itemAtualCarrinho),
      quantidade: qtdDesejada
    });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  fecharModalCarrinho();
  atualizarContadorCarrinho();

  document.getElementById("modal-carrinho-add-sucesso").classList.add("is-active");
}

////          FAVORITOS           /////                         /////////////////////////////
window.alternarFavorito = function (id) {
  const numId = Number(id);
  const index = favoritos.indexOf(numId);

  const btn = document.getElementById(`fav-btn-${id}`);
  const icone = btn ? btn.querySelector("i") : null;

  if (index > -1) {

    favoritos.splice(index, 1);

    if (icone) icone.classList.replace("fa-solid", "fa-regular");
    if (btn) btn.classList.add("is-light");
  } else {

    favoritos.push(numId);

    if (icone) icone.classList.replace("fa-regular", "fa-solid");
    if (btn) btn.classList.remove("is-light");
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
};

window.addEventListener("storage", (event) => {
  if (event.key === "favoritos") {
    favoritos = (JSON.parse(localStorage.getItem("favoritos")) || [])
      .map(f => typeof f === "object" ? Number(f.id) : Number(f));

    if (document.getElementById("lista-vertical")) {
      renderizarVertical(todosDiscos);
    }
  }
});

///            RENDERIZAÇÃO DOS CARDS         ////
window.renderizarVertical = function (discos) {

  const container = document.getElementById("lista-vertical");

  if (!container) return;

  //   ---   Aviso se não encntrar    ---   //
  if (discos.length === 0) {
    container.innerHTML = `<div class="column is-12 has-text-centered py-6"><p class="title is-4 has-text-grey">Nenhum disco encontrado.</p></div>`;
    return;
  }

  ////   ---   Preço e Desconto   ---   //// 
  container.innerHTML = discos.map(disco => {
    const precoNormal = Number(disco.preco);
    const precoFinal = calcularPrecoComDesconto(disco);

    let precoHTML = `
      <span class="preco is-size-5 has-text-weight-bold">
        R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
`;

    if (disco.oferta && disco.percentualDesconto) {
      precoHTML = `
        <div class="precos-verticais">
          <span class="preco-normal">
            R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <span class="preco-desconto is-size-5 has-text-weight-bold">
            R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
  `;
    }

    ///   ---  Tags e Favoritar  ---  ///
    const criarTags = disco.tags ? disco.tags.map(t => `<span class="tag ${t.cor} is-small">${t.nome}</span>`).join(" ") : "";
    const estaFavoritado = favoritos.some(f => Number(f.id) === Number(disco.id));

    return `
    <div class="column is-3-desktop is-4-tablet is-12-mobile">
        <div class="card disco-card">
            <div class="card-image">
               <figure class="image disco-imagem indisponivel-container">
               ${gerarSeloDesconto(disco)}
                ${disco.estoque === 0 ? `<span class="faixa-indisponivel">Indisponível</span>` : ""}
                 <img src="${disco.capa}" alt="${disco.album}"></figure>
            </div>
            <div class="card-content">
                <h4 class="title is-5 mb-1 has-text-link has-text-weight-bold">${disco.album}</h4>
                <p class="subtitle is-6 mb-2 has-text-danger has-text-weight-bold">${disco.artista}</p>
                <div class="disco-tags mb-3">${criarTags}</div>
                <p class="disco-descricao">
                    ${disco.edicao} · ${disco.pais.toUpperCase()} 
                    <span class="fi fi-${disco.pais.toLowerCase()}"></span>
                </p>
                <div class="disco-footer mt-4">
                    ${precoHTML}
                    <div class="buttons has-addons">
                        <button class="button is-link is-small" ${disco.estoque === 0 ? 'disabled title="Indisponível"' : `onclick="abrirModalCarrinho(${disco.id})"`}>
                        Comprar </button>
                        <button class="button is-small is-info is-inverted" onclick="window.open('./detalhes.html?id=${disco.id}', '_blank')">Detalhes</button>
                        <button id="fav-btn-${disco.id}" class="button is-small is-danger ${estaFavoritado ? "" : "is-light"} is-inverted" onclick="alternarFavorito(${disco.id})">
                             <span class="icon is-small"><i class="${estaFavoritado ? "fa-solid" : "fa-regular"} fa-heart"></i></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
  }).join("");
}

////     SELO DESCONTO     ////
function gerarSeloDesconto(disco) {
  if (!disco.oferta || !disco.percentualDesconto) return "";

  let classe = "";

  //  -- Selo conforme o percentual --  //
  if (disco.percentualDesconto === 20) {
    classe = "selo-desconto-20";
  } else if (disco.percentualDesconto === 15) {
    classe = "selo-desconto-15";
  } else if (disco.percentualDesconto === 10) {
    classe = "selo-desconto-10";
  } else if (disco.percentualDesconto === 5) {
    classe = "selo-desconto-05";
  } else {
    classe = "";
  }

  return `
      <div class="selo-porcentagem selo-desconto ${classe}">
        <span class="porcentagem">${disco.percentualDesconto}%</span>
        <span class="texto-off">OFF</span>
      </div>
    `;
};

///   ---   Cálculo Desconto   --  ///
function calcularPrecoComDesconto(disco) {
  if (!disco.oferta || !disco.percentualDesconto) return disco.preco;

  const desconto = disco.preco * (disco.percentualDesconto / 100);
  return +(disco.preco - desconto).toFixed(2);
}

// --- FECHAR  MODAIS  ---   ///
window.fecharModalCarrinho = () => document.getElementById("modal-carrinho").classList.remove("is-active");
window.fecharModalCarrinhoSucesso = () => document.getElementById("modal-carrinho-add-sucesso").classList.remove("is-active");
window.fecharModalErroEstoque = () => document.getElementById("modal-carrinho-erro").classList.remove("is-active");
window.fecharModalConfirmacao = () => document.getElementById("modal-carrinho-confirmacao").classList.remove("is-active");