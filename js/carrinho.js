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

////    CARREGAR DADOS E RENDERIZAR CARRINHO   ////
document.addEventListener("DOMContentLoaded", () => {
    renderizarCarrinho();
});

////     VERIFICAÇÃO DO LOCALSTORAGE    ///
window.addEventListener("storage", (event) => {
   
    if (event.key === "carrinho") {
        renderizarFavoritos();
    }
});

let confirmacao = null;

////    DADOS   ////
async function renderizarCarrinho() {
    const container = document.getElementById("lista-carrinho");
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    //  -- Mensagem de erro se vazio --  //
    if (carrinho.length === 0) {
        container.innerHTML = `<h2 class="has-text-white is-size-4 mb-6">Ainda não há itens no carrinho.</h2>
               <a class="has-text-info-15" href="./index.html"> 
                    <button class="button is-info is-dark is-inverted concluir-compra-btn mb-4">
                        <span>Voltar ao Início</span>
                    </button>
               </a>`;

        atualizarResumo(0, 0, 0);
        return;
    }

    //  --  Dados  --  //
    const response = await fetch("../data/catalogo_discos.json");
    const produtosJSON = await response.json();

    let subtotalSemDesconto = 0;
    let subtotalComDesconto = 0;

    ////        INNER HTML - Estrutura do Carrinho      ////
    container.innerHTML = carrinho.map(item => {
        if (!item || typeof item !== "object") return "";

        console.log("Itens do carrinho:", item);

        const dadosJSON = produtosJSON.find(p => Number(p.id) === Number(item.id)) || {};

        //  --  Cálculos de desconto  --  //
        const precoNormal = Number(dadosJSON.preco || item.preco || 0);
        const precoFinal = calcularPrecoComDesconto(dadosJSON);

        const totalSemDesconto = precoNormal * (item.quantidade || 1);
        const totalComDesconto = precoFinal * (item.quantidade || 1);

        subtotalSemDesconto += totalSemDesconto;
        subtotalComDesconto += totalComDesconto;

        //  --  País e Edição  --  //
        const paisCodigo = (dadosJSON.pais || item.paisFab || "").toLowerCase();
        const paisNome = (dadosJSON.pais || item.paisFab || "").toUpperCase();
        const anoEdicao = dadosJSON.edicao || item.edicao || "";

        //    --  Card  --   //
        return `
        <div class="mb-5 p-5 card-disco-carinho">
            <div class="is-flex is-align-items-center is-flex-wrap-wrap">
                <div class="mr-5 mb-3">
                    <img src="${item.capa}" alt="${item.album}" class="album-img" />
                </div>
                <div class="is-flex-grow-1 mb-3">
                    <h2 class="has-text-primary-60 has-text-weight-bold is-size-5 mb-1">${item.album}</h2>
                    <p class="has-text-danger-80 has-text-weight-bold mb-2">${item.artista}</p>
                    <p class="has-text-white">
                       ${paisCodigo ? `<span class="fi fi-${paisCodigo}"></span>` : ""}
                       ${paisNome} ${anoEdicao ? `· ${anoEdicao}` : ""}
                    </p>
                </div>

                <div class="is-flex is-align-items-center mb-3">
                    <div class="is-flex is-align-items-center mr-6">
                        <div class="quantity-control-vertical">
                            <input class="input has-text-centered is-small" type="number"
                                value="${item.quantidade}" min="1" readonly>
                            <div class="spin-buttons">
                                <button type="button" class="qtde-btn up is-small" onclick="alterarQtdeCarrinho(${item.id}, 1)">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button type="button" class="qtde-btn down is-small" onclick="alterarQtdeCarrinho(${item.id}, -1)">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                        <p class="has-text-primary has-text-weight-bold is-size-5 mr-5">
                            ${dadosJSON.oferta ? `
                                <span class="preco-normal-carrinho">
                                    R$ ${totalSemDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span><br>
                                <span class="preco-desconto-carrinho">
                                    R$ ${totalComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                            ` : `
                                R$ ${totalSemDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            `}
                        </p>

                    <button class="button is-danger is-dark is-inverted is-small cart-remove remove-button" 
                            onclick="confirmarRemocaoItem(${item.id}, '${item.album.replace(/'/g, "\\'")}')">
                        <span><i class="fa-solid fa-trash-can"></i></span>
                    </button>
                </div>
            </div>
        </div>`;
    }).join("");

    if (carrinho.length === 0) {
        container.innerHTML = `
        <h2 class="has-text-white is-size-4 mb-6">Ainda não há discos no carrinho.</h2>
        <a class="has-text-info-15" href="./index.html"> 
            <button class="button is-info is-dark is-inverted concluir-compra-btn mb-4">
                <span>Voltar ao Início</span>
            </button>
        </a>
    `;

        atualizarResumo(0, 0, 0);
        return;
    }


    const descontoFinal = subtotalSemDesconto - subtotalComDesconto;

    atualizarResumo(subtotalSemDesconto, subtotalComDesconto, descontoFinal);
};

///   ---   Resumo da Compra   ---    ///
function atualizarResumo(subtotalSem, subtotalCom, desconto) {
    const resSubtotal = document.getElementById("resumo-subtotal");
    const resDesconto = document.getElementById("resumo-desconto");
    const resTotalCompra = document.getElementById("resumo-total");

    //  --  Subtotal sem Desconto  --  //
    if (resSubtotal)
        resSubtotal.innerText = `R$ ${subtotalSem.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    //  --  Desconto  --  //
    if (resDesconto)
        resDesconto.innerText = `- R$ ${desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    //  --  Subtotal com Desconto  --  //
    if (resTotalCompra)
        resTotalCompra.innerText = `R$ ${subtotalCom.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    if (typeof atualizarContadorCarrinho === "function") atualizarContadorCarrinho();
}

///      MODAIS     ///
function fecharModalCarrinhoSucesso() {
    document.getElementById("modal-carrinho-add-sucesso").classList.remove("is-active");
};

function fecharModalErroEstoque() {
    document.getElementById("modal-carrinho-erro").classList.remove("is-active");
};

function fecharModalConfirmacao() {
    document.getElementById("modal-carrinho-confirmacao").classList.remove("is-active");
    confirmacao = null;
};

//  --  Exluir Itens Carrinho  --  //
window.confirmarRemocaoItem = function (id, nomeAlbum) {
    const modal = document.getElementById("modal-carrinho-confirmacao");

    modal.querySelector("#cart-preco").innerHTML =
        `Tem certeza que deseja excluir <span class="has-text-weight-bold has-text-info-50 is-6">${nomeAlbum}</span> do carrinho?`;


    const btnExcluir = modal.querySelector(".button.is-danger");
    btnExcluir.onclick = () => {
        removerItemCarrinho(id);
        fecharModalConfirmacao();
    };

    modal.classList.add("is-active");
}

//  --  Limpar Carrinho  --  //
window.limparCarrinhoCompleto = function () {
    const modal = document.getElementById("modal-carrinho-confirmacao");
    modal.querySelector("#cart-preco").innerText = "Tem certeza que deseja excluir TODOS os discos do carrinho?";

    const btnExcluir = modal.querySelector(".button.is-danger");
    btnExcluir.onclick = () => {
        localStorage.removeItem("carrinho");
        renderizarCarrinho();
        fecharModalConfirmacao();
    };

    modal.classList.add("is-active");
}

////   ALTERAR A QTDE DE ITENS    ////
window.alterarQtdeCarrinho = async function (id, alteracao) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const index = carrinho.findIndex(i => Number(i.id) === Number(id));

    //  --  Cálculo Estoque  --  //
    if (index !== -1) {
        const item = carrinho[index];
        const novaQtde = Number(item.quantidade) + alteracao;

        if (novaQtde < 1) return;

        const response = await fetch("../data/catalogo_discos.json");
        const produtosJSON = await response.json();

        const produtoOriginal = produtosJSON.find(p => Number(p.id) === Number(id));
        const limiteEstoque = Number(produtoOriginal?.estoque || 99);

        if (novaQtde > limiteEstoque) {
            const modalErro = document.getElementById("modal-carrinho-erro");
            modalErro.querySelector("#cart-preco").innerText = `Estoque insuficiente.`;
            modalErro.classList.add("is-active");
            return;
        }

        item.quantidade = novaQtde;
        localStorage.setItem("carrinho", JSON.stringify(carrinho));

        renderizarCarrinho();
    }
}

///   REMOVER ITEM   ///
window.removerItemCarrinho = function (id) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    carrinho = carrinho.filter(i => Number(i.id) !== Number(id));
    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    renderizarCarrinho();
}

///      CÁLCULO FRETE      ///
// Obs: sempre será R$ 0,00 e data aleatória - Somente demonstração  //
document.getElementById("btnFrete").addEventListener("click", function (e) {
    e.preventDefault();

    const prazo = document.getElementById("prazo-entrega");
    const valor = document.getElementById("valor-entrega");
    const resumoEntrega = document.getElementById("resumo-entrega");

    //  --  CEP  --  //
    const cep = document.getElementById("cepInput");
    const erroCep = document.getElementById("erro-cep");

    cep.classList.remove("is-danger");
    erroCep.classList.add("is-hidden");

    const cepValor = cep.value.trim();
    const cepNumeros = cepValor.replace(/\D/g, "");

    if (cepNumeros === "" || cepNumeros.length < 8) {
        cep.classList.add("is-danger");
        erroCep.textContent = "Digite um CEP válido.";
        erroCep.classList.remove("is-hidden");
        return;
    }

    prazo.textContent = "Calculando...";
    valor.textContent = "Calculando...";
    if (resumoEntrega) resumoEntrega.textContent = "Calculando Frete...";

    setTimeout(() => {
        const min = 5;
        const max = 14;
        const dias = Math.floor(Math.random() * (max - min + 1)) + min;

        const frete = "R$ 0,00";

        prazo.textContent = dias + " dias";
        valor.textContent = "*" + frete;

        if (resumoEntrega) {
            resumoEntrega.textContent = frete;
        }
    }, 1200);
});

//  --  CEP  --  //
cepInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        btnFrete.click();
    }
});

//  --  CEP Validação  --  //
document.getElementById("cepInput").addEventListener("input", function () {
    this.classList.remove("is-danger");
    document.getElementById("erro-cep").classList.add("is-hidden");
});

////       CALCULAR DESCONTO       ////
function calcularPrecoComDesconto(produto) {
    if (!produto.oferta || !produto.percentualDesconto) {
        return produto.preco;
    }

    const desconto = produto.preco * (produto.percentualDesconto / 100);
    return produto.preco - desconto;
}

//   Botão Concluir Compra (erro -  somente para demonstração)
const botao = document.getElementById("btn-concluir-compra");
const textoOriginal = botao.textContent;

botao.addEventListener("click", () => {
    botao.textContent = "Aguarde...";
    botao.disabled = true;

    setTimeout(() => {
        const erroSistema = true;

        if (erroSistema) {
            botao.textContent = "Erro";

            setTimeout(() => {
                abrirModalErroCompra();
            }, 300);
        }

        setTimeout(() => {
            botao.textContent = textoOriginal;
            botao.disabled = false;
        }, 2000);

    }, 1500);
});

//  --  Modais Erro  --  //
function abrirModalErroCompra() {
    const modal = document.getElementById("modal-compra-erro");
    modal.classList.add("is-active");
};

function fecharModalErroCompra() {
    const modal = document.getElementById("modal-compra-erro");
    modal.classList.remove("is-active");
}