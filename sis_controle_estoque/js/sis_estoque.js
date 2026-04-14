// URL do servidor - Express //
const API_URL = "http://localhost:3000/discos";

// Atualizar nome do arquivo de capa ao selecionar //
document.getElementById("id-arquivo-capa").onchange = function () {
    const nomeArquivo = this.files[0] ? this.files[0].name : "Nenhum arquivo...";
    document.getElementById("id-nome-arq-capa").innerText = nomeArquivo;
};

// Galeria para (máx. 10 fotos) //
document.getElementById("id-arquivo-galeria").onchange = function (e) {
    const limiteMaximo = 10;
    const arquivos = e.target.files;
    const campoNome = document.getElementById("id-nome-arq-galeria");

    if (arquivos.length > limiteMaximo) {
        exibirModal("aviso", "Envio máximo de 10 fotos para a galeria.");
        this.value = "";
        campoNome.innerText = "0 fotos";
    } else {
        campoNome.innerText = arquivos.length + " fotos selecionadas";
    }
};

const nomesPaises = { 
    "br": "Brasil", 
    "us": "EUA", 
    "gb": "Reino Unido", 
    "gb-eng": "Inglaterra",
    "eu": "Europa", 
    "jp": "Japão", 
    "fr": "França", 
    "de": "Alemanha", 
    "it": "Itália",
    "at": "Áustria",
    "se": "Suécia",
    "ru": "Rússia",
    "ot": "Outro"
};

// Salvar o disco e enviar para o Express //
document.getElementById("form-cadastro-completo").onsubmit = async function (e) {
    e.preventDefault();

    const formData = new FormData();

    // Pega valores pela id //
    formData.append("album", document.getElementById("id-album").value);
    formData.append("artista", document.getElementById("id-artista").value);
    formData.append("lancamento", document.getElementById("id-lancamento").value);
    formData.append("estoque", document.getElementById("id-estoque").value);
    formData.append("desconto", document.getElementById("id-desconto").value);
    formData.append("peso", document.getElementById("id-peso").value);
    formData.append("qtdDiscos", document.getElementById("id-qtd-discos").value);
    formData.append("tipo", document.getElementById("id-tipo").value);
    formData.append("paisOrigem", document.getElementById("id-pais-origem").value);
    formData.append("paisFab", document.getElementById("id-pais-fabricacao").value);
    formData.append("preco", document.getElementById("id-preco").value);
    formData.append("edicao", document.getElementById("id-edicao").value);
    formData.append("musicas", document.getElementById("id-musicas").value);
    formData.append("resumo", document.getElementById("id-resumo").value);

    // tags //
    const tagsAtivas = [];
    document.querySelectorAll(".toggle-tag.is-active").forEach(tag => {
        tagsAtivas.push({
            nome: tag.getAttribute("data-value"),
            classe: tag.getAttribute("data-class")
        });
    });

    formData.append("tags", JSON.stringify(tagsAtivas));

    document.querySelectorAll(".toggle-tag").forEach(tag => {
        tag.classList.remove("is-active", tag.getAttribute("data-class"));
    });

    const arquivoCapa = document.getElementById("id-arquivo-capa").files[0];
    if (arquivoCapa) formData.append("capa", arquivoCapa);

    const arquivosGaleria = document.getElementById("id-arquivo-galeria").files;
    for (let i = 0; i < arquivosGaleria.length; i++) {
        formData.append("galeria", arquivosGaleria[i]);
    }

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (resposta.ok) {
            exibirModal("sucesso", "Disco salvo com sucesso!");

            this.reset();

            document.getElementById("id-nome-arq-capa").innerText = "Nenhum arquivo...";
            document.getElementById("id-nome-arq-galeria").innerText = "0 fotos";

            carregarTabela();
        } else {
            exibirModal("erro", "Erro ao salvar o disco.");
        }
    } catch (erro) {
        exibirModal("erro", "Não foi possível conectar ao servidor Express.");
    }
};

// Excluir disco no servidor - chamar //
async function excluirDisco(id) {
    confirmarExclusao(id);
}

// Confirmação da exclusão - modal //
function confirmarExclusao(id) {
    const container = document.getElementById("id-container-modais");

    container.innerHTML = `
        <div class="modal-alerta is-active">
            <div id="modal-fundo" class="modal-fundo" onclick="fecharModal()"></div>
            
            <div class="alerta-cartao">
                <div class="alerta-topo">
                    <span style="font-weight: 500;">Confirmar exclusão</span>
                    <button class="delete" onclick="fecharModal()"></button>
                </div>

                <div class="alerta-corpo has-text-centered">
                    <p class="subtitle is-5" style="color: white !important;">
                        Essa ação irá excluir completamente esse disco do catálogo. Deseja continuar?
                    </p>
                    <div class="buttons is-centered mt-5">
                        <button class="button is-danger" onclick="excluirDiscos('${id}')">Sim, excluir</button>
                        <button class="button is-info" onclick="fecharModal()">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Excluir discos //
async function excluirDiscos(id) {
    fecharModal();
    try {
        const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            exibirModal("sucesso", "Item excluído do estoque!");
            carregarTabela();
        }
    } catch (erro) {
        exibirModal("erro", "Erro ao tentar excluir o item.");
    }
}

// Carregar tabela JSON //
async function carregarTabela() {
    try {
        const resposta = await fetch(API_URL);
        const discos = await resposta.json();
        const bodyTabela = document.getElementById("id-lista-estoque");

        if (!bodyTabela) return;
        bodyTabela.innerHTML = "";

        discos.forEach(disco => {
            const detalheId = `detalhe-${disco.id}`;
            
            const tagsHtml = disco.tags ? disco.tags.map(t => 
                `<span class="tag is-small ${t.classe || t.cor}">${t.nome}</span>`
            ).join(" ") : "";

            const linhaPrincipal = `
                <tr onclick="toggleDetalhes('${detalheId}', this)" class="linha-disco has-text-white">
                    <td>${disco.id}</td>
                    <td><strong>${disco.album}</strong></td>
                    <td>${disco.artista}</td>
                    <td>R$ ${parseFloat(disco.preco).toFixed(2)}</td>
                    <td>${disco.desconto}%</td>
                    <td>${disco.estoque}</td>
                    <td>
                        <button class="button is-small is-danger" onclick="event.stopPropagation(); excluirDisco('${disco.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
                <tr id="${detalheId}" class="is-hidden has-background-dark">
                    <td colspan="7">
                        <div class="p-4 content is-small has-text-white">
                            <div class="columns is-variable is-4">
                                <div class="column is-2 has-text-centered">
                                    <img src="${disco.capa}" class="detalhe-capa">
                                    <div class="mt-3 tags is-centered">${tagsHtml}</div>
                                </div>
                                <div class="column is-4 coluna-info">
                                    <p class="mb-1 has-text-info"><strong>Lançamento:</strong> ${disco.lancamento} | <strong>Edição:</strong> ${disco.edicao}</p>
                                    <p class="mb-1 has-text-info"><strong>Especificações:</strong> ${disco.peso} - ${disco.tipo}</p>
                                    <p class="mb-1 has-text-info"><strong>Origem:</strong> ${nomePais(disco.paisOrigem || disco.pais)} | <strong>Fabricação:</strong> ${nomePais(disco.paisFab)}</p>
                                    <p class="mb-2 has-text-info"><strong>Estilos:</strong> ${Array.isArray(disco.estilo) ? disco.estilo.join(", ") : (disco.estilo || "-")}</p>
                                    <hr class="divisor-detalhe">
                                    <p><strong>Resumo:</strong><br><span class="texto-resumo">${disco.resumo || "Sem descrição."}</span></p>
                                </div>
                                <div class="column is-6">
                                    <p class="has-text-weight-bold is-size-6 mb-2">Lista de Faixas</p>
                                    <div class="container-tracklist">
                                        ${gerarTracklist(disco.musicas)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            bodyTabela.innerHTML += linhaPrincipal;
        });
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

// Aplicar ccor de seleção //
function toggleDetalhes(id, linha) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    
    elemento.classList.toggle("is-hidden");
    if (linha) {
        linha.classList.toggle("is-selected");
    }
}

// Gerar tracklist por Lado //
function gerarTracklist(musicas) {
    if (!musicas || musicas.length === 0) return "Nenhuma música cadastrada.";
    if (typeof musicas === 'string') return musicas.replace(/\n/g, '<br>');

    const grupos = musicas.reduce((acc, m) => {
        const lado = m.lado || "Único";
        if (!acc[lado]) acc[lado] = [];
        acc[lado].push(m);
        return acc;
    }, {});

    return Object.keys(grupos).map(lado => `
        <div class="mb-3">
            <div class="has-text-weight-bold has-text-warning track-header-lado">
                LADO ${lado}
            </div>
            ${grupos[lado].map(m => `
                <div class="track-item">
                    <small class="has-text-white">${m.faixa}.</small> ${m.nome}
                </div>
            `).join("")}
        </div>
    `).join("");
}

//códigos de país //
function nomePais(codigo) {
    if (!codigo) return "-";
    return nomesPaises[codigo.toLowerCase()] || codigo;
}

// Modal //
function exibirModal(tipo, mensagem) {
    const container = document.getElementById("id-container-modais");
    if (!container) return;

    const titulo = tipo === "sucesso" ? "Sucesso" : (tipo === "aviso" ? "Aviso" : "Erro");
    const corTexto = tipo === "sucesso" ? "has-text-success" : (tipo === "aviso" ? "has-text-warning" : "has-text-danger");

    container.innerHTML = `
            <div class="modal-alerta is-active">
                <div id="modal-fundo" class="modal-fundo" onclick="fecharModal()"></div>
                
                <div class="alerta-cartao">
                    <div class="alerta-topo">
                        <span style="font-weight: 500;">${titulo}</span>
                        <button class="delete" onclick="fecharModal()"></button>
                    </div>

                    <div class="alerta-corpo">
                        <div class="modal-mensagem ${corTexto}" style="background: transparent; font-weight: 500;">
                            ${mensagem}
                        </div>
                    </div>
                </div>
            </div>
    `;

    setTimeout(fecharModal, 3000);
}

// limpar container de modais //
function fecharModal() {
    const container = document.getElementById("id-container-modais");
    if (container) container.innerHTML = "";
}

///   Logout   ///
(function verificarAcesso() {
    const sessao = sessionStorage.getItem("billyvinil_sessao");
    const persistente = localStorage.getItem("billyvinil_login_persistente");

    if (!sessao && persistente) {
        sessionStorage.setItem("billyvinil_sessao", persistente);
    }
    else if (!sessao && !persistente) {
        console.warn("Acesso negado. Redirecionando para login...");
        window.location.href = "login_estoque.html";
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const btnAbrir = document.getElementById("btn-abrir-formulario");
    const btnCancelar = document.getElementById("btn-cancelar");
    const containerForm = document.getElementById("container-formulario");
    const formCadastro = document.getElementById("form-cadastro-completo");

    const inputEstilo = document.getElementById("id-input-estilo");
const btnAddEstilo = document.getElementById("btn-add-estilo");
const containerEstilos = document.getElementById("container-estilos-adicionados");
let listaEstilos = [];

// Função para renderizar as tags na tela
function renderizarEstilos() {
    containerEstilos.innerHTML = "";
    listaEstilos.forEach((estilo, index) => {
        containerEstilos.innerHTML += `
            <span class="tag is-dark">
                ${estilo}
                <button type="button" class="delete is-small" onclick="removerEstilo(${index})"></button>
            </span>
        `;
    });
}

// Função para adicionar estilo
const adicionarEstilo = () => {
    const valor = inputEstilo.value.trim();
    if (valor && !listaEstilos.includes(valor)) {
        listaEstilos.push(valor);
        inputEstilo.value = "";
        renderizarEstilos();
    }
};

btnAddEstilo.addEventListener("click", adicionarEstilo);
inputEstilo.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        adicionarEstilo();
    }
});

window.removerEstilo = (index) => {
    listaEstilos.splice(index, 1);
    renderizarEstilos();
};

    // Toggle Formulário //
    if (btnAbrir && containerForm) {
        const toggleForm = () => {
            const estaEscondido = containerForm.classList.toggle("is-hidden");

            if (!estaEscondido) {
                btnAbrir.innerHTML = '<span class="icon"><i class="fas fa-times"></i></span><span>Fechar formulário</span>';
                btnAbrir.classList.replace("is-link", "is-danger");
            } else {
                btnAbrir.innerHTML = '<span class="icon"><i class="fas fa-plus"></i></span><span>Adicionar novo disco</span>';
                btnAbrir.classList.replace("is-danger", "is-link");
            }
        };

        btnAbrir.addEventListener("click", toggleForm);

        if (btnCancelar) {
            btnCancelar.addEventListener("click", toggleForm);
        }
    }

    // Logout //
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            console.log("Encerrando sessao do usuario...");
            sessionStorage.removeItem("billyvinil_sessao");
            localStorage.removeItem("billyvinil_login_persistente");
            window.location.href = "login_estoque.html";
        });
    }

    // Toggles de Tags no formulário //
    const toggles = document.querySelectorAll(".toggle-tag");
    toggles.forEach(tag => {
        tag.addEventListener("click", () => {
            tag.classList.toggle("is-active");
            const classeCor = tag.getAttribute("data-class");
            if (tag.classList.contains("is-active")) {
                tag.classList.add(classeCor);
            } else {
                tag.classList.remove(classeCor);
            }
        });
    });

    carregarTabela();
});

// Inicialização //
window.onload = carregarTabela;