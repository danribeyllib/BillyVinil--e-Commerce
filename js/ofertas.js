///    VAR GLOBAIS    ///
let todosDiscos = [];
let itemAtualCarrinho = null;
let favoritos = (JSON.parse(localStorage.getItem("favoritos")) || []).map(Number);

//  --   MODAIS   --  //
window.fecharModalCarrinho = () => document.getElementById("modal-carrinho").classList.remove("is-active");
window.fecharModalCarrinhoSucesso = () => document.getElementById("modal-carrinho-add-sucesso").classList.remove("is-active");
window.fecharModalErroEstoque = () => document.getElementById("modal-carrinho-erro").classList.remove("is-active");

//  --  Contador Carrinho  --  //
function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const contadorCarrinho = document.getElementById("carrinho-contador");

    if (contadorCarrinho) {
        contadorCarrinho.innerText = totalItens;
        contadorCarrinho.style.display = totalItens > 0 ? "inline-block" : "none";
    }
}

/////  DADOS E INICIALIZAÇÃO  ////
document.addEventListener("DOMContentLoaded", async () => {

    await carregarDados();
    atualizarContadorCarrinho();

    //  --  Menu Sanduiche - Bulma CSS  --  //
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll(".navbar-burger"), 0);
    $navbarBurgers.forEach(el => {
        el.addEventListener("click", () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);
            el.classList.toggle("is-active");
            $target.classList.toggle("is-active");
        });
    });

    //  --  Renderizar seções por ID  --  //                 
    ///-------------------- RAUL
    renderizarDiscosPorId([7, 8, 23], "section-discos-raul");
    ///-------------------- MPB
    renderizarDiscosPorId([9, 10, 18, 19, 20, 25], "section-discos-mpb");
    ///-------------------- QUEEN 
    renderizarDiscosPorId([3, 4, 32, 33], "section-discos-queen");
    ///-------------------- ORQUESTRA 
    renderizarDiscosPorId([15, 16, 17, 27, 36], "section-discos-orquestra");
    ///-------------------- CYNDI 
    renderizarDiscosPorId([2, 6, 39], "section-discos-cyndi");

    //  --  Botão Ver Ofertas (checkbox)  -- //
    configurarToggle("toggle-ofertas-raul", "section-discos-raul", ".toggle-ofertas-raul");
    configurarToggle("toggle-ofertas-mpb", "section-discos-mpb", ".toggle-ofertas-mpb");
    configurarToggle("toggle-ofertas-queen", "section-discos-queen", ".toggle-ofertas-queen");
    configurarToggle("toggle-ofertas-orquestra", "section-discos-orquestra", ".toggle-ofertas-orquestra");
    configurarToggle("toggle-ofertas-cyndi", "section-discos-cyndi", ".toggle-ofertas-cyndi");
});

//  --  Mostrar/Esconder Ofertas  --  //
function configurarToggle(idCheck, idSection, classLabel) {
    const check = document.getElementById(idCheck);
    const section = document.getElementById(idSection);
    const label = document.querySelector(classLabel);

    if (!check || !section) return;

    check.addEventListener("change", function () {
        if (this.checked) {
            section.style.display = "block";
            setTimeout(() => {
                section.classList.add("is-visible");
                if (label) label.classList.add("toggle-active");
            }, 10);

        } else {
            section.classList.remove("is-visible");

            if (label) label.classList.remove("toggle-active");
            setTimeout(() => {

                if (!check.checked) section.style.display = "none";
            }, 100);
        }
    });
}

////      CARREGAR DADOS JSON      ////
async function carregarDados() {
    try {
        const resposta = await fetch("../data/catalogo_discos.json");
        todosDiscos = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar JSON:", erro);
    }
}

////         RENDERIZAÇÃO DOS CARDS      ////
async function renderizarDiscosPorId(idsSelecionados, idContainerDestino) {
    const section = document.getElementById(idContainerDestino);

    if (!section || todosDiscos.length === 0) return;

    const container = section.querySelector(".container");
    const discosFiltrados = todosDiscos.filter(disco => idsSelecionados.includes(disco.id));
    
    container.innerHTML = '<div class="columns is-multiline"></div>';
    const colunas = container.querySelector(".columns");

    discosFiltrados.forEach(disco => {
        const estaFavoritado = favoritos.includes(Number(disco.id));

        const criarTags = disco.tags.map(tag =>
            `<span class="tag ${tag.cor}">${tag.nome}</span>`
        ).join("");

        const precoNormal = Number(disco.preco);
        const precoComDesconto = calcularPrecoComDesconto(disco);

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
                    R$ ${precoComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
            </div>
            `;
        }

        const cardHTML = `
            <div class="column is-3-desktop is-4-tablet is-12-mobile">
                <div class="card disco-card">
                    <div class="card-image">
                        <figure class="image disco-imagem indisponivel-container">
                            ${gerarSeloDesconto(disco)}
                            ${disco.estoque === 0 ? `<span class="faixa-indisponivel">Indisponível</span>` : ""}
                            <img src="${disco.capa}" alt="${disco.album}">
                        </figure>
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
                                <button class="button is-link is-small" ${disco.estoque === 0 ? 'disabled' : `onclick="abrirModalCarrinho(${disco.id})"`}>
                                    Comprar 
                                </button>
                                <button class="button is-small is-info is-inverted" onclick="window.open('./detalhes.html?id=${disco.id}', '_blank')">Detalhes</button>
                                <button id="fav-btn-${disco.id}" class="button is-small is-danger ${estaFavoritado ? '' : 'is-light'} is-inverted" onclick="alternarFavorito(${disco.id})">
                                    <span class="icon is-small">
                                        <i class="${estaFavoritado ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        colunas.innerHTML += cardHTML;
    });
}

////        CARRINHO       ////
window.abrirModalCarrinho = function (id) {
    const disco = todosDiscos.find(d => Number(d.id) === Number(id));
    if (!disco) return;

    itemAtualCarrinho = disco;

    document.getElementById("cart-qtd").value = 1;
    document.getElementById("carrinho-capa").src = itemAtualCarrinho.capa;
    document.getElementById("cart-album").innerText = itemAtualCarrinho.album;
    document.querySelectorAll("#cart-artista").forEach(el => el.innerText = itemAtualCarrinho.artista);

    const precoNormal = Number(itemAtualCarrinho.preco);
    const precoComDesconto = calcularPrecoComDesconto(itemAtualCarrinho);

    let precoHTML = `
        <span class="preco-modal is-size-5 has-text-weight-bold">
            R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
    `;

    if (itemAtualCarrinho.oferta && itemAtualCarrinho.percentualDesconto) {
        precoHTML = `
            <div class="precos-verticais-modal">
                <span class="preco-normal">
                    R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span class="preco-desconto is-size-5 has-text-weight-bold">
                    R$ ${precoComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
            </div>
        `;
        };

    document.getElementById("cart-preco").innerHTML = precoHTML;

    document.getElementById("modal-carrinho").classList.add("is-active");
}

window.alterarQtd = function (valor) {
    const input = document.getElementById("cart-qtd");
    let novoValor = parseInt(input.value) + valor;
    if (novoValor >= 1 && novoValor <= (itemAtualCarrinho.estoque || 99)) {
        input.value = novoValor;
    }
}

window.confirmarAdicao = function () {
    if (!itemAtualCarrinho) return;
    const qtdDesejada = parseInt(document.getElementById("cart-qtd").value);
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
            preco: Number(itemAtualCarrinho.preco),
            quantidade: qtdDesejada
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    fecharModalCarrinho();
    atualizarContadorCarrinho();
    document.getElementById("modal-carrinho-add-sucesso").classList.add("is-active");
}

/////       FAVORITOS        /////
window.alternarFavorito = function (id) {

    let favoritosAtuais = (JSON.parse(localStorage.getItem("favoritos")) || [])
        .map(f => typeof f === "object" ? Number(f.id) : Number(f));

    const btn = document.getElementById(`fav-btn-${id}`);
    const icone = btn ? btn.querySelector("i") : null;

    const index = favoritosAtuais.indexOf(Number(id));

    if (index > -1) {
        favoritosAtuais.splice(index, 1);

        if (icone) icone.classList.replace("fa-solid", "fa-regular");
        if (btn) btn.classList.add("is-light");

    } else {
        favoritosAtuais.push(Number(id));

        if (icone) icone.classList.replace("fa-regular", "fa-solid");
        if (btn) btn.classList.remove("is-light");
    }

    favoritos = favoritosAtuais;
    localStorage.setItem("favoritos", JSON.stringify(favoritosAtuais));
};

////     SELO DESCONTO   ////
function gerarSeloDesconto(disco) {
    if (!disco.oferta || !disco.percentualDesconto) return "";

    let classe = "";

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

    //  -- Monta o Selo  --  //
    return `
      <div class="selo-porcentagem selo-desconto ${classe}">
        <span class="porcentagem">${disco.percentualDesconto}%</span>
        <span class="texto-off">OFF</span>
      </div>
    `;
};

////    CÁLCULO DESCONTO    ////
function calcularPrecoComDesconto(disco) {
    if (!disco.oferta || !disco.percentualDesconto) {
        return disco.preco;
    }

    const desconto = disco.preco * (disco.percentualDesconto / 100);
    return +(disco.preco - desconto).toFixed(2);
}