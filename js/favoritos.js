///     VAR GLOBAIS        ///
let produtoSelecionadoNoModal = null;
let idParaExcluir = null;
let todosOsDiscos = [];

document.addEventListener("DOMContentLoaded", () => {
    renderizarFavoritos();
});

////     VERIFICAÇÃO DO LOCALSTORAGE    ///
window.addEventListener('storage', (event) => {
   
    if (event.key === 'favoritos') {
        renderizarFavoritos();
    }
});

// Menu Sanduiche - Bulma CSS
const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
$navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
    });
});

////    DESCONTO    ////
function calcularPrecoComDesconto(disco) {
    if (!disco.oferta || !disco.percentualDesconto) return Number(disco.preco);

    const desconto = Number(disco.preco) * (disco.percentualDesconto / 100);
    return +(Number(disco.preco) - desconto).toFixed(2);
}

///         RENDERIZAÇÃO DOS FAVORITOS         ////
async function renderizarFavoritos() {
    const container = document.getElementById("lista-favoritos");
    const btnLimpar = document.querySelector(".concluir-compra-btn");

    if (!container) return;

    try {

        const favoritosJSON = JSON.parse(localStorage.getItem("favoritos")) || [];
        console.log("Favoritos JSON (já existentes):" , favoritosJSON);

        const favoritosIds = favoritosJSON.map(f => typeof f === "object" ? Number(f.id) : Number(f));

        ///   ---  Dados do JSON   ---   ///
        const response = await fetch("./data/catalogo_discos.json");
        if (!response.ok) throw new Error("Não foi possível carregar o arquivo JSON.");

        todosOsDiscos = await response.json();

        const discosFavoritados = todosOsDiscos.filter(disco =>
            favoritosIds.includes(Number(disco.id))
        );

        if (btnLimpar) {
            btnLimpar.style.display = discosFavoritados.length === 0 ? "none" : "inline-flex";
        }

        if (discosFavoritados.length === 0) {
            container.innerHTML = `
        <div class="column is-12 has-text-centered">
            <h2 class="has-text-white is-size-4 mb-5">Ainda não há discos favoritados.</h2>
            <div class="is-block">
                <a href="./index.html"> 
                    <button class="button is-info is-dark is-inverted concluir-compra-btn">
                        <span>Voltar ao Início</span>
                    </button>
                </a>
            </div>
        </div>`;
            return;
        }

        ////       Estrutura do Card       /////
        container.innerHTML = discosFavoritados.map(disco => {
            const paisCodigo = disco.pais ? disco.pais.toLowerCase() : "br";
            const paisNome = disco.pais ? disco.pais.toUpperCase() : "BR";
            const tagsHtml = disco.tags ? disco.tags.map(tag => `<span class="tag ${tag.cor} is-small mr-1">${tag.nome}</span>`).join("") : "";
            const precoNormal = Number(disco.preco);
            const precoFinal = calcularPrecoComDesconto(disco);

            return `
            <div class="column is-3-desktop is-4-tablet is-12-mobile" style="position: relative; z-index: 5;">
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
                        <div class="disco-tags mb-3">${tagsHtml}</div>
                        <p class="disco-descricao">
                          ${disco.edicao} · ${paisNome} 
                            <span class="fi fi-${paisCodigo}"></span>
                        </p>
                        <div class="disco-footer mt-4">
                            ${disco.oferta && disco.percentualDesconto ? `
                                    <div class="precos-verticais">
                                        <span class="preco-normal">
                                            R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span class="preco-desconto is-size-6 has-text-weight-bold">
                                            R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ` : `
                                    <span class="preco is-size-6 has-text-weight-bold">
                                        R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                `}
                            <div class="buttons has-addons">
                                <button class="button is-link is-small" ${disco.estoque === 0 ? 'disabled title="Indisponível"' :
                    `onclick="abrirModalCarrinho(${disco.id})"`}>
                                    Comprar
                                </button>
                                <button class="button is-small is-info is-inverted" onclick="window.open('./detalhes.html?id=${disco.id}', '_blank')">Detalhes</button>
                                <button class="button is-small is-danger is-inverted" onclick="confirmarExclusaoFavorito(${disco.id})">
                                     <span class="icon is-small"><i class="fa-solid fa-heart"></i></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join("");

    } catch (error) {
        console.error("Erro na renderização dos cards:", error);
        container.innerHTML = `<div class="column is-12 has-text-centered"><p class="has-text-danger">Erro ao carregar favoritos.</p></div>`;
    }
}

////     SELO DESCONTO     ////
function gerarSeloDesconto(disco) {
    if (!disco.oferta || !disco.percentualDesconto) return "";

    let classe = "";

    //  -- Adiciona a class conforme o percentual --  //
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

    //  -- Monta o Selo no HTML --  //
    return `
      <div class="selo-porcentagem selo-desconto ${classe}">
        <span class="porcentagem">${disco.percentualDesconto}%</span>
        <span class="texto-off">OFF</span>
      </div>
    `;
};


// --- MODAIS ---  //
window.fecharModalConfirmacao = () => document.getElementById("modal-carrinho-confirmacao").classList.remove("is-active");

window.confirmarExclusaoFavorito = function (id) {
    const disco = todosOsDiscos.find(f => Number(f.id) === Number(id));
    if (!disco) return;

    idParaExcluir = id;
    
    const modal = document.getElementById("modal-carrinho-confirmacao");
    modal.querySelector(".modal-card-title").innerText = "Remover Favorito";

    const confModal = modal.querySelector(".modal-card-body p.is-size-5") || modal.querySelector("#carrinho-preco");
    if (confModal) confModal.innerText = `Deseja remover "${disco.album}" dos favoritos?`;

    const btnExcluir = modal.querySelector(".button.is-danger");
    btnExcluir.onclick = function () {
   
        let favsJSON = JSON.parse(localStorage.getItem("favoritos")) || [];
        
        const novosFavs = favsJSON
            .map(f => typeof f === "object" ? Number(f.id) : Number(f))
            .filter(favId => favId !== Number(idParaExcluir));

        localStorage.setItem("favoritos", JSON.stringify(novosFavs));

        fecharModalConfirmacao();
        renderizarFavoritos();
    };

    modal.classList.add("is-active");
};

////    LIMPAR FAVORITOS    ////
window.limparFavoritosCompleto = function () {
    const modal = document.getElementById("modal-carrinho-confirmacao");
    modal.querySelector(".modal-card-title").innerText = "Limpar Todos";

    const confModal = modal.querySelector(".modal-card-body p.is-size-5") || modal.querySelector("#carrinho-preco");
    if (confModal) confModal.innerText = "Tem certeza que deseja remover TODOS os itens?";

    const btnExcluir = modal.querySelector(".button.is-danger");

    btnExcluir.onclick = function () {
        localStorage.removeItem("favoritos");
        fecharModalConfirmacao();
        renderizarFavoritos();
    };

    modal.classList.add("is-active");
};

////    CARRINHO    ////
window.abrirModalCarrinho = function (id) {
    const produto = todosOsDiscos.find(p => Number(p.id) === Number(id));
    if (produto) {
        if (produto.estoque <= 0) {
            document.getElementById("modal-carrinho-erro").classList.add("is-active");
            return;
        }
        produtoSelecionadoNoModal = produto;

        document.getElementById("carrinho-capa").src = produto.capa;
        document.getElementById("carrinho-album").innerText = produto.album;
        document.querySelectorAll("#carrinho-artista").forEach(el => el.innerText = produto.artista);
        document.getElementById("carrinho-qtd").value = 1;

        const precoNormal = Number(produto.preco);
        const precoFinal = calcularPrecoComDesconto(produto);

        let precoHTML = `
            <span class="preco-modal has-text-weight-bold">
                R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>`;

        if (produto.oferta && produto.percentualDesconto) {
            precoHTML = `
                <div class="precos-verticais-modal">
                    <span class="preco-normal">
                    R$ ${precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span class="preco-desconto has-text-weight-bold">
                    R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                </div>`;
        }

        document.getElementById("carrinho-preco").innerHTML = precoHTML;
        document.getElementById("modal-carrinho").classList.add("is-active");
    }
};

window.alterarQtd = function (valor) {
    const input = document.getElementById("carrinho-qtd");
    let novoValor = parseInt(input.value) + valor;

    if (produtoSelecionadoNoModal && novoValor >= 1 && novoValor <= produtoSelecionadoNoModal.estoque) {
        input.value = novoValor;
    }
};

window.confirmarAdicao = function () {
    if (!produtoSelecionadoNoModal) return;

    const qtdDesejada = parseInt(document.getElementById("carrinho-qtd").value);
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const itemNoCarrinho = carrinho.find(item => Number(item.id) === Number(produtoSelecionadoNoModal.id));
    const qtdNoCarrinho = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

    if (qtdDesejada + qtdNoCarrinho > produtoSelecionadoNoModal.estoque) {
        window.fecharModalCarrinho();
        document.getElementById("modal-carrinho-erro").classList.add("is-active");
        return;
    }

    if (itemNoCarrinho) {
        itemNoCarrinho.quantidade += qtdDesejada;
    } else {
        carrinho.push({ ...produtoSelecionadoNoModal, quantidade: qtdDesejada });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    window.fecharModalCarrinho();
    document.getElementById("modal-carrinho-add-sucesso").classList.add("is-active");
};

window.fecharModalCarrinho = () => document.getElementById("modal-carrinho").classList.remove("is-active");
window.fecharModalCarrinhoSucesso = () => document.getElementById("modal-carrinho-add-sucesso").classList.remove("is-active");
window.fecharModalErroEstoque = () => document.getElementById("modal-carrinho-erro").classList.remove("is-active");