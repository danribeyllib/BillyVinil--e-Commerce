//  GLOBAIS //
let todosOsDiscos = []; 
let favoritos = (JSON.parse(localStorage.getItem("favoritos")) || [])
    .map(f => typeof f === "object" ? Number(f.id) : Number(f));
let itemAtualCarrinho = null; 

//  Cálculo Descontos  //
function calcularDadosPreco(disco) {

    const precoNormal = Number(disco.preco);

    if (!disco.oferta || !disco.percentualDesconto) {
        return {
            precoNormal,
            precoFinal: precoNormal,
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
};

////    MODAIS   ////
//-- Modal Sucesso - Adicionar ao Carinho --//
window.abrirModalSucesso = function () {
    const modal = document.getElementById("modal-carrinho-add-sucesso");
    if (modal) modal.classList.add("is-active");
}

//-- Modal Sucesso - Newsletter --//
window.abrirModalNewsletterSucesso = function () {
    const modal = document.getElementById("modal-newsletter-sucesso");
    if (modal) modal.classList.add("is-active");
}

// --Fechar Modais Sucesso -- // 
window.fecharModalCarrinhoSucesso = function () {
    const modalCarrinho = document.getElementById("modal-carrinho-add-sucesso");
    const modalNews = document.getElementById("modal-newsletter-sucesso");
    if (modalCarrinho) modalCarrinho.classList.remove("is-active");
    if (modalNews) modalNews.classList.remove("is-active");
};

// --Modal Erro Estoque (qtde) -- //
window.abrirModalErroEstoque = function () {
    document.getElementById("modal-carrinho-erro").classList.add("is-active");
};

// --Modal Erro Estoque -- //
window.fecharModalErroEstoque = function () {
    ; document.getElementById("modal-carrinho-erro").classList.remove("is-active");
}

///    LOCALSTOGAGE - JSON    ///
function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0); // acc - accumulator
    const contadorCarrinho = document.getElementById("carrinho-contador");

    if (contadorCarrinho) {
        contadorCarrinho.innerText = totalItens;
        contadorCarrinho.style.display = totalItens > 0 ? "inline-block" : "none";
    }
};

////     CARREGAMENTO DE DADOS - Arquivo JSON      ////
async function carregarDados() {
    try {
        const resposta = await fetch("../data/catalogo_discos.json");
        todosOsDiscos = await resposta.json();

        // --- Discos - JSON --- //
        const discosDestaqueSlides = todosOsDiscos.filter(disco =>
            disco.tags.some(t => t.nome.toLowerCase() === "destaque")
        );

        // --- Slides do Carrossel - Destaques --- //
        if (discosDestaqueSlides.length > 0) {
            renderSlides(discosDestaqueSlides);
            showSlides(slideIndex);
        }

        // --- Cards Verticais - Topo --- //
        const containerVertical = document.getElementById("lista-vertical");

        const discosDestaqueLista = todosOsDiscos.filter(disco =>
            disco.tags.some(t => t.nome.toLowerCase().includes("destaque"))
        );

        // --- Cards Horizontais - Novidades --- //
        const containerNovidades = document.getElementById("lista-novidades");

        const discosNovos = todosOsDiscos.filter(disco =>
            disco.tags.some(t => t.nome.toLowerCase() === "novo")
        );

        // --- Cards Horizontais - Ofertas --- //
        const containerOfertas = document.getElementById("lista-ofertas");

        const discosOfertas = todosOsDiscos.filter(disco => disco.oferta === true);

        if (containerVertical) renderizarVertical(discosDestaqueLista, containerVertical);
        if (containerNovidades) renderizarHorizontal(discosNovos, containerNovidades, true);
        if (containerOfertas) renderizarHorizontal(discosOfertas, containerOfertas, false);

    } catch (erro) {
        console.error("Erro ao carregar discos");
    }
}

////    CARROSSEL - Sessão Destaques      ////
// -- Var Globais -- //
let slideIndex = 1;
let autoSlideTimeout;

// ---- FUNÇÕES DO CARROSSEL ---- //
function renderSlides(discos) {
    const container = document.getElementById("slides-target");
    const dotsContainer = document.getElementById("dots-target");

    if (!container || !dotsContainer) return;
    dotsContainer.innerHTML = "";

    discos.forEach((disco, index) => {
        const slide = document.createElement("div");

        slide.className = "mySlides fade";
        slide.innerHTML = `
            <div class="numbertext">${index + 1} / ${discos.length}</div>
            <a href="./detalhes.html?id=${disco.id}" target="_blank">
                <figure class="image is-square">
                    <img src="${disco.capa}" alt="${disco.album}">
                </figure>
            <div class="text has-text legenda-slideshow">${disco.album} - ${disco.artista}</div>
            </a>
        `;

        const prevBtn = container.querySelector(".prev");

        if (prevBtn) container.insertBefore(slide, prevBtn);
        else container.appendChild(slide);

        const dot = document.createElement("span");

        dot.className = "dot";
        dot.onclick = () => window.currentSlide(index + 1);
        dotsContainer.appendChild(dot);
    });
}

window.showSlides = function (n) {
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");

    if (slides.length === 0) return;
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";

        if (dots[i]) dots[i].classList.remove("active");
    }

    slides[slideIndex - 1].style.display = "block";

    if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");

    clearTimeout(autoSlideTimeout);
    autoSlideTimeout = setTimeout(() => { window.plusSlides(1); }, 4000);
}

window.plusSlides = function (n) {
    clearTimeout(autoSlideTimeout);
    showSlides(slideIndex += n);
}

window.currentSlide = function (n) {
    clearTimeout(autoSlideTimeout);
    showSlides(slideIndex = n);
}

////   FAVORITAR ITENS      ////                                          
window.alternarFavorito = function (id) {

    let favoritosAtuais = (JSON.parse(localStorage.getItem("favoritos")) || [])
        .map(f => typeof f === "object" ? Number(f.id) : Number(f));

    const btn = document.getElementById(`fav-btn-${id}`);
    const icone = btn ? btn.querySelector("i") : null;

    const index = favoritosAtuais.indexOf(Number(id));

    if (index > -1) {
        // --- Remover ---
        favoritosAtuais.splice(index, 1);

        if (icone) icone.classList.replace("fa-solid", "fa-regular");
        if (btn) btn.classList.add("is-light");

    } else {
        // --- Adicionar ---
        favoritosAtuais.push(Number(id));

        if (icone) icone.classList.replace("fa-regular", "fa-solid");
        if (btn) btn.classList.remove("is-light");
    }

    favoritos = favoritosAtuais;
    localStorage.setItem("favoritos", JSON.stringify(favoritosAtuais));
};

////     CARDS HORIZONTAIS     ////
function renderizarHorizontal(discos, container, isReversed = false) {

    /// --- Cards Reversos - Sessão Novidades --- ///
    const cardReverso = isReversed ? "reverse" : "";

    // -- Estruturas dos cards -- //
    container.innerHTML = discos.map(disco => {

        // -- Tags/Badges -- //
        const criarTags = disco.tags.map(t => `<span class="tag ${t.cor}">${t.nome}</span>`).join("");

        // -- Botão Favoritar -- //
        const estaFavoritado = favoritos.includes(Number(disco.id));
        console.log("Status favoritado: " + estaFavoritado, "Disco ", disco.id)

        // -- Faixa Indisponível - Gera a faixa -- //
        const indisponivel = Number(disco.estoque) === 0;
        const faixaIndisponivel = indisponivel ? `<div class="faixa-indisponivel">Indisponível</div>` : "";

        // -- Preço -- //
        const precoFinal = calcularPrecoComDesconto(disco);
        let precoHTML = `<span class="preco">R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;

        if (disco.oferta && disco.percentualDesconto) {
            precoHTML = `
                <span class="preco-normal">
                    R$ ${disco.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span class="preco-desconto">
                    R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                `;
        }

        ////   ---- Estrutura dos Cards Horizontais  ----   ////
        return `
        <div class="column is-12"> 
            <div class="card disco-card-horizontal ${cardReverso}"> 
                <div class="columns">
                    <div class="column is-4-tablet is-12-mobile">
                    
                        <div class="horizontal-capa ${cardReverso}">            
                            ${cardReverso ? `<div class="selo-lateral">${gerarSeloDesconto(disco)}</div>` : gerarSeloDesconto(disco)}
                            <figure class="image disco-imagem-horizontal">
                                ${faixaIndisponivel}
                                <img src="${disco.capa}" alt="${disco.album}">
                            </figure>
                        </div>
                        
                    </div>

                    <div class="column">
                        <div class="card-content">
                            <h4 class="title is-4 mb-1 has-text-link has-text-weight-bold">${disco.album}</h4>
                            <p class="subtitle is-6 mb-2 has-text-danger has-text-weight-bold">${disco.artista}</p>
                            <div class="tags mb-2">${criarTags}</div>
                            <p class="disco-descricao">
                                ${disco.edicao} · ${disco.pais.toUpperCase()} <span class="fi fi-${disco.pais.toLowerCase()}"></span>
                            </p>
                            <div class="disco-footer mt-1">
                                ${precoHTML}
                                <div class="buttons has-addons">
                                  <button class="button is-link is-small" onclick="abrirModalCarrinho(${disco.id})" ${indisponivel ? "disabled" : ""}>Comprar</button>
                                    <button class="button is-small is-info is-inverted" data-id="${disco.id}">Detalhes</button>

                                    <button id="fav-btn-${disco.id}" class="button is-small is-danger ${estaFavoritado ? "" : "is-light"} is-inverted" onclick="alternarFavorito(${disco.id})">
                                     
                                     <span class="icon is-small"><i class="${estaFavoritado ? "fa-solid" : "fa-regular"} fa-heart"></i></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join("");
}

////     CARDS VERTICAIS     ////
window.renderizarVertical = function (discos, containerAlvo = null) {

    const container = containerAlvo || document.getElementById("lista-vertical");

    if (!container) return;

    if (discos.length === 0) {
        container.innerHTML = `<div class="column is-12 has-text-centered py-5"><p>Nenhum disco encontrado.</p></div>`;
        return;
    }

    ///   --- Estrutura Verticais ---   ///
    container.innerHTML = discos.map(disco => {

        // -- Tags/Badges --  //
        const criarTags = disco.tags.map(t => `<span class="tag ${t.cor} is-small">${t.nome}</span>`).join(" ");

        // --  Status Favoritado  --  //
        const estaFavoritado = favoritos.includes(Number(disco.id));

        // --  Estoque Indisponível - Tarja  --  //
        const indisponivel = Number(disco.estoque) === 0;
        const faixaIndisponivel = indisponivel ? `<div class="faixa-indisponivel">Indisponível</div>` : "";

        // --  Preço --  //
        const precoFinal = calcularPrecoComDesconto(disco);
        let precoHTML = `<span class="preco">R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;

        if (disco.oferta && disco.percentualDesconto) {
            precoHTML = `
                <div class="precos-verticais">
                    <span class="preco-normal">R$ ${disco.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span class="preco-desconto">R$ ${precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>`;
        }

        ////   ---- Cards Verticais  ----   ////
        return `
        <div class="column disco-card-container is-3-desktop is-4-tablet is-12-mobile">
        
        <div class="card disco-card">
              <a href="./detalhes.html?id=${disco.id}" target="_blank">

                <div class="card-image">
                    <figure class="image disco-imagem">
                        ${gerarSeloDesconto(disco)}
                        ${faixaIndisponivel}
                        <img src="${disco.capa}" alt="${disco.album}">
                    </figure>
                </div> 
              </a>
               
              <div class="card-content">
                    <h4 class="title is-5 has-text-link">${disco.album}</h4>
                    <p class="subtitle is-6 has-text-danger has-text-weight-bold">${disco.artista}</p>
                    <div class="disco-tags mb-4">${criarTags}</div>
                    <p class="disco-descricao">
                        ${disco.edicao} · ${disco.pais.toUpperCase()} <span class="fi fi-${disco.pais.toLowerCase()}"></span>
                    </p>
                   
                    <div class="disco-footer">
                       ${precoHTML}
                        <div class="buttons has-addons">
                            <button class="button is-link is-small" onclick="abrirModalCarrinho(${disco.id})" ${indisponivel ? "disabled" : ""}>Comprar</button>
                            <button class="button is-small is-info is-inverted" data-id="${disco.id}">Detalhes</button>
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

////     BOTÃO DETALHES    ////
document.addEventListener("click", function (e) {
    const botao = e.target.closest(".button.is-small");

    if (botao && botao.textContent.trim() === "Detalhes") {
        const id = botao.dataset.id;

        /// --- Cria a URL com base no id do JSON externo - Abre pág de detalhes do disco --- ///
        if (id) window.open(`./detalhes.html?id=${id}`, "_blank");
    }
});

////    FORM DA NEWSLETTER    ////
/// --- Validações --- ///
window.validarNewsletter = function () {
    const nome = document.getElementById("nomeNewsletter");
    const email = document.getElementById("emailNewsletter");
    const checkbox = document.getElementById("checkNewsletter");

    const nomeErro = document.getElementById("nomeErro");
    const emailErro = document.getElementById("emailErro");
    const checkboxError = document.getElementById("checkboxError");

    const validarCampo = (input, erro, regex) => {
        input.addEventListener("input", () => {
            const valido = regex ? regex.test(input.value) : input.value.trim() !== "";

            if (valido) {
                input.classList.remove("is-danger");
                input.classList.add("is-success");

                if (erro) erro.classList.add("is-hidden");
            } else {
                input.classList.remove("is-success");
            }
        });
    };

    validarCampo(nome, nomeErro);
    validarCampo(email, emailErro, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    let isValid = true;

    // -- Validar Nome -- //
    if (nome.value.trim() === "") {
        nome.classList.add("is-danger");
        nomeErro.classList.remove("is-hidden");
        isValid = false;
    }

    // -- Validar Email -- //
    const validarEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validarEmail.test(email.value)) {
        email.classList.add("is-danger");
        emailErro.classList.remove("is-hidden");
        isValid = false;
    }

    // -- Validar Checkbox -- //
    if (!checkbox.checked) {
        checkboxError.classList.remove("is-hidden");
        isValid = false;
    } else {
        checkboxError.classList.add("is-hidden");
    }

    if (isValid) {
        abrirModalNewsletterSucesso();
        limparFormulario();
    }
};

function limparFormulario() {
    ["nomeNewsletter", "emailNewsletter"].forEach(id => {
        const inputNL = document.getElementById(id);
        if (inputNL) {
            inputNL.value = "";
            inputNL.classList.remove("is-success", "is-danger");
        }
    });

    const check = document.getElementById("checkNewsletter");
    if (check) check.checked = false;

    ["nomeErro", "emailErro", "checkboxError"].forEach(id => {
        const inputNL = document.getElementById(id);
        if (inputNL) inputNL.classList.add("is-hidden");
    });
}

////    ADICIONAR AO CARRINHO    ////
///   --- Abrir modal do carrinho ---   ///
window.abrirModalCarrinho = function (id) {

    if (!todosOsDiscos || todosOsDiscos.length === 0) return;

    itemAtualCarrinho = todosOsDiscos.find(d => Number(d.id) === Number(id));

    if (!itemAtualCarrinho) return;

    const qtdInput = document.getElementById("carrinho-qtd");

    if (qtdInput) {
        qtdInput.value = 1;
        qtdInput.max = Number(itemAtualCarrinho.estoque);
    }

    ///   --- Card disco no Modal Carrinho ---   ///
    document.getElementById("carrinho-capa").src = itemAtualCarrinho.capa;
    document.getElementById("carrinho-album").innerText = itemAtualCarrinho.album;
    document.getElementById("carrinho-artista").innerText = itemAtualCarrinho.artista;

    const dadosPreco = calcularDadosPreco(itemAtualCarrinho);

    let precoHTML = `
            <span class="preco-modal">
                R$ ${dadosPreco.precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
`;

    if (dadosPreco.temDesconto) {
        precoHTML = `
                <div class="precos-verticais">
                    <span class="preco-normal">
                        R$ ${dadosPreco.precoNormal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span class="preco-desconto">
                        R$ ${dadosPreco.precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                </div>
    `;
    }

    document.getElementById("carrinho-preco").innerHTML = precoHTML;
    document.getElementById("modal-carrinho").classList.add("is-active");
};

window.fecharModalCarrinho = function () {
    document.getElementById("modal-carrinho").classList.remove("is-active");
};

///   --- Input de Quantidade ---   ///
window.alterarQtd = function (valor) {
    const input = document.getElementById("carrinho-qtd");

    let novoValor = parseInt(input.value) + valor;

    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max);

    if (novoValor >= min && novoValor <= max) input.value = novoValor;
}

///   ---  ADICIONAR AO CARRINHO  ---   ///
window.confirmarAdicao = function () {

    if (!itemAtualCarrinho) return;

    //  -- Input Qtde --  //
    const qtdInput = document.getElementById("cart-qtd");

    let qtdDesejada = qtdInput ? parseInt(qtdInput.value) : 1;
    const estoqueLimite = Number(itemAtualCarrinho.estoque);

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const indexExistente = carrinho.findIndex(item => Number(item.id) === Number(itemAtualCarrinho.id));
    const qtdJaNoCarrinho = indexExistente !== -1 ? Number(carrinho[indexExistente].quantidade) : 0;

    //  -- Total Final --  //
    const totalFinal = qtdJaNoCarrinho + qtdDesejada;

    //  -- Modais --  //
    if (totalFinal > estoqueLimite) {
        fecharModalCarrinho();
        abrirModalErroEstoque();  // - Modal Erro - Se qtde desejada é > que qtde em estoque - //
        return;
    }

    if (indexExistente !== -1) {
        carrinho[indexExistente].quantidade = totalFinal;

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
    abrirModalSucesso();
}

////    ABRIR SEÇÃO TODOS OS DESTAQUES    ////
const toggle = document.getElementById("toggle-destaques");
const section = document.querySelector(".toggle-todos-destaques");

///   --- Inicia Oculta ---   ///                     
///   --- Transição ao Abrir ---   ///
section.style.transition = "max-height 0.7s ease, opacity 0.4s ease";

///   --- Abre/Oculta ---   ///
toggle.addEventListener("change", () => {
    if (toggle.checked) {
        section.style.maxHeight = section.scrollHeight + "px";
        section.style.opacity = "1";
    } else {
        section.style.maxHeight = "0";
        section.style.opacity = "0";
    }
})

////     SELO DESCONTO     ////
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

    //  -- Estrutura do selo --  //
    return `
      <div class="selo-porcentagem selo-desconto ${classe}">
        <span class="porcentagem">${disco.percentualDesconto}%</span>
        <span class="texto-off">OFF</span>
      </div>
    `;
};

///   --- CÁLCULO DE DESCONTO ---   ///
function calcularPrecoComDesconto(disco) {
    if (!disco.oferta || !disco.percentualDesconto) {
        return disco.preco;
    }

    const desconto = disco.preco * (disco.percentualDesconto / 100);
    return +(disco.preco - desconto).toFixed(2);
}

/////           BUSCA              //////
window.executarBuscaHome = function (termo) {

    //  -- Seção e container em que aparece o reultado da busca --  //
    const sectionResultados = document.getElementById("section-resultados");
    const containerResultados = document.getElementById("lista-resultados");

    if (!sectionResultados || !containerResultados) return;

    if (!termo || termo.trim() === "") {
        sectionResultados.classList.add("is-hidden");
        return;
    }

    const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();  //
    const termoNormalizado = normalizar(termo.trim());

    const resultados = [];
    for (let i = 0; i < todosOsDiscos.length; i++) {
        const disco = todosOsDiscos[i];

        const album = normalizar(disco.album || "");
        const artista = normalizar(disco.artista || "");
        const estilos = Array.isArray(disco.estilo) ? normalizar(disco.estilo.join(" ")) : normalizar(disco.estilo || "");

        if (album.includes(termoNormalizado) || artista.includes(termoNormalizado) || estilos.includes(termoNormalizado)) {
            resultados.push(disco);
        }
    }

    sectionResultados.classList.remove("is-hidden");

    renderizarVertical(resultados, containerResultados);

    // -- Rola apág para a seção Resiltados -- //
    sectionResultados.scrollIntoView({ behavior: "smooth" });
};

//  -- Limpar Busca - Input vazio --  //
window.limparBusca = function () {
    const input = document.getElementById("busca-home");
    if (input) input.value = "";
    document.getElementById("section-resultados").classList.add("is-hidden");
};

///   ---  BUSCAS  ---   ///
document.addEventListener("DOMContentLoaded", () => {
    const inputBusca = document.getElementById("busca-home");
    const botaoBusca = document.querySelector(".fa-magnifying-glass")?.closest("button");

    if (inputBusca) {
        //  -- Ao Digitar --  //
        inputBusca.addEventListener("input", () => {
            executarBuscaHome(inputBusca.value);
        });

        //  -- Tecla Enter --  //
        inputBusca.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                executarBuscaHome(inputBusca.value);
            }
        });
    }

    if (botaoBusca) {
        // -- Ao Clicar no Botão --  //
        botaoBusca.addEventListener("click", () => {
            executarBuscaHome(inputBusca.value);
        });
    }
});

////    CARREGAR DADOS   ////
document.addEventListener("DOMContentLoaded", () => {

    carregarDados();
    atualizarContadorCarrinho();
});