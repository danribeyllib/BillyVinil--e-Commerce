//   VAR Globais   //
let discoAtual = null;
let favoritos = (JSON.parse(localStorage.getItem("favoritos")) || []).map(Number);
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

////////        DESCONTO         ////////
function calculoPrecoFinal(disco) {

    const precoNormal = Number(disco.preco);

    if (!disco.oferta || !disco.percentualDesconto) {
        return {
            precoNormal,
            precoFinal: precoNormal,
            percentual: 0,
            temDesconto: false
        };
    }

    const desconto = precoNormal * (disco.percentualDesconto / 100);
    const precoFinal = +(precoNormal - desconto).toFixed(2);

    return {
        precoNormal,
        precoFinal,
        percentual: disco.percentualDesconto,
        temDesconto: true
    };
}


///   MENU SANDUÍCHE - Bulma CSS   ///
document.addEventListener('DOMContentLoaded', () => {
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {

            const target = el.dataset.target;
            const $target = document.getElementById(target);

            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
        });
    });
});

///  ---   Contatdor Carrinho  ----  ///
function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const contadorElemento = document.getElementById("carrinho-contador");

    if (contadorElemento) {
        contadorElemento.innerText = totalItens;
        contadorElemento.style.display = totalItens > 0 ? "inline-block" : "none";
    }
}

//  --  MODAIS CARRINHO  --  //
window.abrirModalCarrinhoSucesso = function () {
    const modal = document.getElementById("modal-carrinho-add-sucesso");

    if (modal) modal.classList.add("is-active");
}

window.fecharModalCarrinhoSucesso = function () {
    const modal = document.getElementById("modal-carrinho-add-sucesso");

    if (modal) modal.classList.remove("is-active");
}

window.abrirModalErroEstoque = function () {
    const modal = document.getElementById("modal-carrinho-erro");

    if (modal) modal.classList.add("is-active");
}

window.fecharModalErroEstoque = function () {
    const modal = document.getElementById("modal-carrinho-erro");

    if (modal) modal.classList.remove("is-active");
}


////  --   Modal Zoom Imagens  --  ////
function abrirImagemModal(src) {
    const modal = document.getElementById("modal-imagem");
    const imgModal = document.getElementById("img-modal-src");

    if (modal && imgModal) {
        imgModal.src = src;
        modal.classList.add("is-active");

        modal.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

function fecharImagemModal() {
    const modal = document.getElementById("modal-imagem");

    if (modal) {
        modal.classList.remove("is-active");
        document.documentElement.classList.remove("is-clipped");
    }
}

/////        CARRINHO           ////
window.abrirModalCarrinho = function () {
    const modal = document.getElementById("modal-carrinho");

    const dadosPreco = calculoPrecoFinal(discoAtual);
    const carrinhoPreco = document.getElementById("carrinho-preco");

    if (discoAtual && modal) {
        document.getElementById("carrinho-capa").src = discoAtual.capa;
        document.getElementById("carrinho-album").innerText = discoAtual.album;
        document.getElementById("carrinho-artista").innerText = discoAtual.artista;
        document.getElementById("carrinho-qtd").value = 1;

        if (dadosPreco.temDesconto) {
            carrinhoPreco.innerHTML = `
            <span class="preco-normal">
                R$ ${dadosPreco.precoNormal.toLocaleString("pt-br", { minimumFractionDigits: 2 })}
            </span><br>
            <span class="preco-desconto has-text-weight-bold">
                R$ ${dadosPreco.precoFinal.toLocaleString("pt-br", { minimumFractionDigits: 2 })}
            </span>
        `;
        } else {
            carrinhoPreco.innerHTML = `
            <span class="preco-desconto has-text-weight-bold">
                R$ ${dadosPreco.precoNormal.toLocaleString("pt-br", { minimumFractionDigits: 2 })}
            </span>
        `;
        }

        modal.classList.add("is-active");
    }
}

window.fecharModalCarrinho = function () {
    const modal = document.getElementById("modal-carrinho");

    if (modal) modal.classList.remove("is-active");
}

window.alterarQtd = function (valor) {
    const input = document.getElementById("carrinho-qtd");

    let atual = parseInt(input.value);

    const estoqueDisponivel = discoAtual.estoque;

    if (valor > 0 && atual < estoqueDisponivel) {
        input.value = atual + 1;
    } else if (valor < 0 && atual > 1) {
        input.value = atual - 1;
    }
}

window.confirmarAdicao = function () {
    const qtd = parseInt(document.getElementById("carrinho-qtd").value);
    const itemExistente = carrinho.find(item => item.id === discoAtual.id);
    const totalNoCarrinho = itemExistente ? itemExistente.quantidade + qtd : qtd;

    if (totalNoCarrinho > discoAtual.estoque) {
        fecharModalCarrinho();
        abrirModalErroEstoque();
        return;
    }

    if (itemExistente) {
        itemExistente.quantidade += qtd;
    } else {
        carrinho.push({
            id: discoAtual.id,
            album: discoAtual.album,
            artista: discoAtual.artista,
            capa: discoAtual.capa,
            preco: discoAtual.preco,  
            quantidade: qtd
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    fecharModalCarrinho();
    atualizarContadorCarrinho();
    abrirModalCarrinhoSucesso();
}

////    FAVORITOS      ////
window.alternarFavorito = function () {
    if (!discoAtual) return;

    let favoritosIds = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritosIds = favoritosIds.map(f => typeof f === "object" ? f.id : f);

    const id = discoAtual.id;
    const index = favoritosIds.indexOf(id);

    const btn = document.getElementById("favoritar-btn");
    const icone = btn.querySelector("i");

    if (index > -1) {
        favoritosIds.splice(index, 1);

        if (icone) icone.classList.replace("fa-solid", "fa-regular");
        if (btn) btn.classList.add("is-light");
    } else {
        favoritosIds.push(id);

        if (icone) icone.classList.replace("fa-regular", "fa-solid");
        if (btn) btn.classList.remove("is-light");
    }

    localStorage.setItem("favoritos", JSON.stringify(favoritosIds));
};

// --- Dados e renderização ---  ///
async function carregarDiscosIDJson(idDesejado) {
    try {
        const response = await fetch("./data/catalogo_discos.json");
        const dados = await response.json();
        const disco = dados.find(d => d.id === idDesejado);

        if (!disco) {
            console.error("Disco não encontrado");
            return;
        }

        discoAtual = disco;
        const estaFavoritado = favoritos.some(f => (typeof f === "object" ? f.id : f) === disco.id);

        const container = document.getElementById("render-detalhes");

        const tagsHtml = disco.tags.map(tag =>
            `<span class="tag ${tag.cor} mx-1">${tag.nome}</span>`
        ).join("");

        const galeriaHtml = disco.galeria.map((img, index) => `
            <div class="mx-2 detalhes-thumbnail" onclick='abrirImagemModal("${img}")'>
                <img class="imagem-thumbnail" src="${img}" alt="Thumbnail ${index + 1}" />
            </div>
        `).join("");

        ///   ---  Lista de Faixas   ---   //
        const faixasPorLado = disco.musicas.reduce((acc, musica) => {
            if (!acc[musica.lado]) acc[musica.lado] = [];
            acc[musica.lado].push(musica);
            return acc;
        }, {});

        const colunasFaixasHtml = Object.keys(faixasPorLado).sort().map(lado => `
            <div class="column is-6">
                <p class="titulo-faixa has-text-weight-semibold is-size-5 mb-0">Lado ${lado}</p>
                <table class="table is-fullwidth is-hoverable is-striped">
                    <tbody>
                        ${faixasPorLado[lado].map(m => `
                        <tr>
                            <td class="has-text-weight-bold">${m.faixa}.</td>
                            <td>${m.nome}</td>
                        </tr>`).join("")}
                </tbody>
            </table>
        </div>`).join("");
        
        //  --  Preço  --  //
        const dadosPreco = calculoPrecoFinal(disco);

        let precoHTML = `
            <span class="preco-detalhes is-size-3 has-text-weight-bold mx-4">
                R$ ${dadosPreco.precoFinal.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
            </span>
            `;

        if (dadosPreco.temDesconto) {
            precoHTML = `
                <div class="precos-verticais-detalhes mx-4">
                <span class="preco-normal">
                    R$ ${dadosPreco.precoNormal.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                </span>
                <span class="preco-detalhes desconto is-size-3 has-text-weight-bold">
                    R$ ${dadosPreco.precoFinal.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                </span>
                </div>
            `;
        }

        //// ESTRUTUTA DE IMAGENS E CONTAINER ////
        container.innerHTML = `
        <section id="detalhes-disco" class="section">
            <div class="container mx-auto px-8 py-12">

                <div class="titulo-detalhes container mb-6">
                    <div class="is-flex mb-4">${tagsHtml}</div>
                    <h1 class="title is-size-2 has-text-link-60 has-text-weight-bold mb-2">${disco.album}</h1>
                    <p class="subtitulo-detalhes subtitle is-size-4 has-text-weight-bold has-text-danger-60 mb-4">${disco.artista}</p>
                </div>

                <div class="columns detalhes-disco">
                ${gerarSeloDesconto(disco)}
                    <div class="column is-6 py-6">
                        <div class="is-flex is-flex-direction-column is-align-items-center">
                        
                        <div class="mb-4 indisponivel-container">
                                ${disco.estoque === 0 ? `<span class="faixa-indisponivel">Indisponível</span>` : ""}
                                
                                <img class="is-cover capa-detalhes" 
                                    src="${disco.capa}" 
                                    alt="Capa" 
                                    onclick='abrirImagemModal('${disco.capa}')' />
                            </div>
                            <div class="is-flex mt-4">${galeriaHtml}</div>
                        </div>
                    </div>
                    
                    <div class="column is-6 py-6">
                     
                    <div class="is-flex is-align-items-center mb-5 preco-container-detalhes mr-5">
                                <span class="preco-detalhes is-size-3 has-text-weight-bold mx-4">
                                ${precoHTML}
                                </span>
                                </div>

                        
                        <div class="mb-6 px-4">
                            <p class="has-text-white mb-4">${disco.resumo.join(' ')}</p>
                        </div>

                        <div class="mb-6 px-4">
                            <table class="table is-fullwidth is-striped is-narrow" id="tabela-detalhes">
                                <thead>
                                    <tr>
                                        <th colspan="4" class="tabela-head-detalhes has-text-weight-semibold">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="is-size-6 tabela-icon"><i class="fa-solid fa-compact-disc"></i></td>
                                        <td class="is-size-6">${disco.peso} ${disco.tipo}</td>
                                        <td class="is-size-6 tabela-icon"><i class="fa-solid fa-microphone-lines"></i></td>
                                        <td class="is-size-7 is-vcentered">${disco.estilo.join(', ')}</td>
                                    </tr>
                                    <tr>
                                        <td class="is-size-6 tabela-icon"><i class="fa-regular fa-calendar-days"></i></td>
                                        <td class="is-size-6">${disco.lancamento}</td>
                                        <td class="is-size-6 tabela-icon"><i class="fa-solid fa-earth-americas"></i></td>
                                        <td class="is-size-6"> <span class="fi fi-${disco.pais.toLowerCase()}"></span> <span>${disco.pais.toUpperCase()}</span></td>
                                    </tr>
                                    <tr>
                                        <td class="is-size-6 tabela-icon"><i class="fa-solid fa-stamp"></i></td>
                                        <td class="is-size-6">${disco.edicao}</td>
                                        <td class="is-size-6 tabela-icon"><i class="fa-solid fa-stamp"></i></td>
                                        <td class="is-size-6"> <span class="fi fi-${disco.paisFab.toLowerCase()}"></span> <span>${disco.paisFab.toUpperCase()}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="is-flex is-flex-wrap-wrap mb-6" id="add-carrinho-btn">
                            <a class="button is-link mx-2" ${disco.estoque === 0 ? 'disabled title="Indisponível"' : 'onclick="abrirModalCarrinho()"'}>
                            <span class="icon has-text"> <i class="fa-solid fa-cart-plus fa-flip-horizontal"></i> </span>
                            <strong> Adicionar ao carrinho</strong>
                            </a>
                            <a class="button favoritar is-danger ${estaFavoritado ? '' : 'is-light'} is-inverted" id="favoritar-btn" onclick="alternarFavorito()">
                                <span class="icon has-text">
                                    <i class="${estaFavoritado ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="lista-de-faixas" class="section faixas-fundo mt-4">
            <div class="container mx-auto px-8">
                <div class="mb-8">
                    <input type="checkbox" id="toggle-faixas" class="toggle-checkbox">
                    <h2 class="title is-size-3 has-text-primary-40 has-text-weight-bold mb-6">
                        <i class="fa-solid fa-headphones"></i> Faixas 
                        <span> 
                            <label for="toggle-faixas" class="button is-primary is-dark mt-1">
                                <i class="fa-solid fa-angles-down"></i>
                            </label>
                        </span>
                    </h2>
                    <div id="colunasFaixas" class="columns is-multiline conteudo-faixas">
                        ${colunasFaixasHtml}
                    </div>
                </div>
            </div>
        </section>

        <div id="modal-imagem" class="modal">
            <div class="modal-background" onclick="fecharImagemModal()"></div>
            <div class="modal-content">
                <p class="image">
                    <img id="img-modal-src" src="" alt="">
                </p>
            </div>
            <button class="modal-close is-large" aria-label="close" onclick="fecharImagemModal()"></button>
        </div>
        `;
    } catch (e) { console.error("Erro ao carregar detalhes:", e); }
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

    return `
      <div class="selo-porcentagem selo-desconto ${classe}">
        <span class="porcentagem">${disco.percentualDesconto}%</span>
        <span class="texto-off">OFF</span>
      </div>
    `;
};

//    URL - pela id    //  
const urlParams = new URLSearchParams(window.location.search);
const idUrl = parseInt(urlParams.get("id"));
if (idUrl) carregarDiscosIDJson(idUrl);