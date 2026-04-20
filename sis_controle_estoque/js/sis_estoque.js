// URL do servidor - Express //
const API_URL = "http://localhost:3000/discos";

// Controle de edição //
let idDiscoEmEdicao = null;

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
    "": "Selecione",
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
    "nl": "Holanda",
    "ca": "Canadá",
    "au": "Austrália",
    "ar": "Argentina",
    "cl": "Chile",
    "uy": "Uruguai",
    "ot": "Outro"
};

let listaEstilos = [];

// Salvar o disco e enviar para o Express //
document.getElementById("form-cadastro-completo").onsubmit = async function (e) {
    e.preventDefault();

    const obterValor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const campoDesc = document.getElementById("id-desconto-valor");
    const isOferta = document.getElementById("id-switch-desconto")?.checked || false;
    const porcentagemDesc = (isOferta && campoDesc) ? campoDesc.value : 0;

    const formData = new FormData();
    formData.append("album", obterValor("id-album"));
    formData.append("artista", obterValor("id-artista"));
    formData.append("lancamento", obterValor("id-lancamento"));
    formData.append("estoque", obterValor("id-estoque"));
    formData.append("desconto", porcentagemDesc);
    formData.append("temDesconto", isOferta);
    formData.append("peso", obterValor("id-peso"));
    formData.append("qtdDiscos", obterValor("id-qtd-discos"));
    formData.append("tipo", obterValor("id-tipo"));
    formData.append("paisOrigem", obterValor("id-pais-origem"));
    formData.append("paisFab", obterValor("id-pais-fabricacao"));
    formData.append("preco", obterValor("id-preco"));
    formData.append("edicao", obterValor("id-edicao"));
    formData.append("resumo", obterValor("id-resumo"));

    const musicasData = coletarMusicasParaJSON();
    formData.append("musicas", JSON.stringify(musicasData));
    formData.append("estilo", JSON.stringify(listaEstilos));

    const tagsAtivas = [];
    document.querySelectorAll(".toggle-tag.is-active").forEach(tag => {
        tagsAtivas.push({
            nome: tag.getAttribute("data-value"),
            classe: tag.getAttribute("data-class")
        });
    });
    formData.append("tags", JSON.stringify(tagsAtivas));

    const arquivoCapa = document.getElementById("id-arquivo-capa").files[0];
    if (arquivoCapa) formData.append("capa", arquivoCapa);

    const arquivosGaleria = document.getElementById("id-arquivo-galeria").files;
    for (let i = 0; i < arquivosGaleria.length; i++) {
        formData.append("galeria", arquivosGaleria[i]);
    }

    const urlFinal = idDiscoEmEdicao ? `${API_URL}/${idDiscoEmEdicao}` : API_URL;
    const metodo = idDiscoEmEdicao ? "PUT" : "POST";

    try {
        const resposta = await fetch(urlFinal, {
            method: metodo,
            body: formData
        });

        if (resposta.ok) {
            exibirModal("sucesso", idDiscoEmEdicao ? "Disco atualizado com sucesso!" : "Disco salvo com sucesso!");
            this.reset();
            idDiscoEmEdicao = null;
            listaEstilos = [];

            const containerEstilos = document.getElementById("container-estilos-adicionados");
            if (containerEstilos) containerEstilos.innerHTML = "";

            document.getElementById("container-lados-dinamicos").innerHTML = "";
            document.getElementById("container-select-desconto").classList.add("is-hidden");
            document.getElementById("id-nome-arq-capa").innerText = "Nenhum arquivo...";
            document.getElementById("id-nome-arq-galeria").innerText = "0 fotos";

            const labelSwitch = document.querySelector('label[for="id-switch-desconto"]');
            if (labelSwitch) labelSwitch.innerText = "Não";

            document.querySelectorAll(".toggle-tag").forEach(tag => {
                tag.classList.remove("is-active");
                const classeCor = tag.getAttribute("data-class");
                if (classeCor) tag.classList.remove(classeCor);
            });

            carregarTabela();
        } else {
            exibirModal("erro", "Erro ao processar.");
        }
    } catch (erro) {
        exibirModal("erro", "Não foi possível conectar ao servidor.");
    }
};

async function excluirDisco(id) {
    confirmarExclusao(id);
}

// Confirmar exclusão
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

// carregar a tabela //
async function carregarTabela() {
    try {
        const resposta = await fetch(API_URL);
        const discos = await resposta.json();
        const bodyTabela = document.getElementById("id-lista-estoque");

        if (!bodyTabela) return;
        bodyTabela.innerHTML = "";

        discos.forEach(disco => {
            const detalheId = `detalhe-${disco.id}`;
            const pDesconto = disco.desconto || 0;
            const descontoTabela = pDesconto > 0 ? `${pDesconto}%` : "Não";

            // Cores tags //
            let tagsArray = [];
            if (disco.tags) {
                try {
                    tagsArray = typeof disco.tags === 'string' ? JSON.parse(disco.tags) : disco.tags;
                } catch (e) { tagsArray = []; }
            }

            const tagsHtml = tagsArray.map(t => {
                let classeCor = t.classe || "";

                if (!classeCor) {
                    const mapaCores = {
                        "Bom Estado": "verde-tag",
                        "Clássico": "azul-claro-tag",
                        "Cult": "importado-tag",
                        "Destaque": "destaque-tag",
                        "Edição Limitada": "azul-claro-tag",
                        "Excelente estado": "turquesa-tag",
                        "Importado": "importado-tag",
                        "Lacrado": "prata-tag",
                        "Novo": "verde-tag",
                        "Oferta": "oferta-tag",
                        "Raro": "gold-tag",
                        "Remaster": "vermelho-tag"
                    };
                    classeCor = mapaCores[t.nome];
                }
                return `<span class="tag is-small ${classeCor}">${t.nome}</span>`;
            }).join(" ");

            const linhaPrincipal = `
                <tr onclick="toggleDetalhes('${detalheId}', this)" class="linha-disco has-text-white" style="cursor: pointer;">
                    <td>${disco.id}</td>
                    <td><strong>${disco.album}</strong></td>
                    <td>${disco.artista}</td>
                    <td>R$ ${parseFloat(disco.preco).toFixed(2)}</td>
                    <td>${descontoTabela}</td>
                    <td>${disco.estoque}</td>
                    <td class="has-text-centered">
                        <i class="fas fa-chevron-down is-size-7"></i>
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
                                    <div class="buttons mt-4">
                                        <button class="button is-link is-small" onclick="event.stopPropagation(); prepararEdicao('${disco.id}')">
                                            <span class="icon"><i class="fas fa-edit"></i></span>
                                            <span>Editar Dados</span>
                                        </button>
                                        <button class="button is-danger is-small" onclick="event.stopPropagation(); excluirDisco('${disco.id}')">
                                            <span class="icon"><i class="fas fa-trash"></i></span>
                                            <span>Excluir Disco</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="column is-6">
                                    <p class="has-text-weight-bold is-size-6 mb-2">Lista de Faixas</p>
                                    <div class="container-tracklist">${gerarTracklist(disco.musicas)}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>`;
            bodyTabela.innerHTML += linhaPrincipal;
        });
    } catch (erro) { console.error("Erro ao carregar dados:", erro); }
}

async function prepararEdicao(id) {
    try {
        const resposta = await fetch(`${API_URL}/${id}`);
        if (!resposta.ok) throw new Error("Disco não encontrado.");

        const disco = await resposta.json();
        idDiscoEmEdicao = disco.id;

        const containerForm = document.getElementById("container-formulario");
        if (containerForm && containerForm.classList.contains("is-hidden")) {
            const btnAbrir = document.getElementById("btn-abrir-formulario");
            if (btnAbrir) btnAbrir.click();
        }

        const campos = {
            "id-album": disco.album,
            "id-artista": disco.artista,
            "id-lancamento": disco.lancamento,
            "id-estoque": disco.estoque,
            "id-preco": disco.preco,
            "id-edicao": disco.edicao,
            "id-peso": disco.peso,
            "id-tipo": disco.tipo,
            "id-pais-origem": disco.paisOrigem || disco.pais,
            "id-pais-fabricacao": disco.paisFab,
            "id-resumo": disco.resumo,
            "id-qtd-discos": disco.qtdDiscos || 1
        };

        for (const [idCampo, valor] of Object.entries(campos)) {
            const el = document.getElementById(idCampo);
            if (el) el.value = valor || "";
        }

        const containerLados = document.getElementById("container-lados-dinamicos");
        if (containerLados) {
            containerLados.innerHTML = "";
            if (disco.musicas && Array.isArray(disco.musicas)) {
                const musicasAgrupadas = disco.musicas.reduce((acc, m) => {
                    if (!acc[m.lado]) acc[m.lado] = [];
                    acc[m.lado].push(m);
                    return acc;
                }, {});

                Object.keys(musicasAgrupadas).sort().forEach(lado => {
                    const divLado = criarEstruturaLado(lado);
                    containerLados.appendChild(divLado);
                    const containerFaixas = divLado.querySelector(".container-faixas");
                    musicasAgrupadas[lado].forEach(m => {
                        adicionarCampoFaixa(containerFaixas, m.faixa);
                        const inputs = containerFaixas.querySelectorAll(".input-nome-faixa");
                        if (inputs.length > 0) inputs[inputs.length - 1].value = m.nome || "";
                    });
                });
            }
        }

        listaEstilos = Array.isArray(disco.estilo) ? disco.estilo : [];
        renderizarEstilosVisual();

        document.querySelectorAll(".toggle-tag").forEach(tag => {
            const valorTag = tag.getAttribute("data-value");
            const classeCor = tag.getAttribute("data-class");
            let tagsSalvas = [];
            if (disco.tags) {
                try { tagsSalvas = typeof disco.tags === 'string' ? JSON.parse(disco.tags) : disco.tags; }
                catch (e) { tagsSalvas = []; }
            }
            const ativa = tagsSalvas.some(t => t.nome === valorTag);
            tag.classList.toggle("is-active", ativa);
            if (classeCor) {
                if (ativa) tag.classList.add(classeCor); else tag.classList.remove(classeCor);
            }
        });

        const switchEdicao = document.getElementById("id-switch-desconto");
        const containerEdicao = document.getElementById("container-select-desconto");
        const labelSwitch = document.querySelector('label[for="id-switch-desconto"]');
        const temDesc = disco.temDesconto === true || disco.temDesconto === "true" || (disco.desconto > 0);

        if (switchEdicao) {
            switchEdicao.checked = temDesc;
            if (labelSwitch) labelSwitch.innerText = temDesc ? "Sim" : "Não";
            if (temDesc && containerEdicao) {
                containerEdicao.classList.remove("is-hidden");
                const campoValorDesc = document.getElementById("id-desconto-valor");
                if (campoValorDesc) campoValorDesc.value = disco.desconto || "";
            } else if (containerEdicao) {
                containerEdicao.classList.add("is-hidden");
            }
        }

        if (containerForm) containerForm.scrollIntoView({ behavior: 'smooth' });
    } catch (erro) { console.error("Erro na edição:", erro); }
}

function toggleDetalhes(id, linha) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    elemento.classList.toggle("is-hidden");
    if (linha) linha.classList.toggle("is-selected");
}

function gerarTracklist(musicas) {
    if (!musicas || musicas.length === 0) return "Nenhuma música cadastrada.";
    if (typeof musicas === 'string') return musicas.replace(/\n/g, '<br>');
    const grupos = musicas.reduce((acc, m) => {
        const lado = m.lado || "Único";
        if (!acc[lado]) acc[lado] = [];
        acc[lado].push(m);
        return acc;
    }, {});
    return Object.keys(grupos).sort().map(lado => `
        <div class="mb-3">
            <div class="has-text-weight-bold has-text-warning track-header-lado">LADO ${lado}</div>
            ${grupos[lado].map(m => `<div class="track-item"><small class="has-text-white">${m.faixa}.</small> ${m.nome}</div>`).join("")}
        </div>`).join("");
}

function nomePais(codigo) {
    if (!codigo) return "-";
    return nomesPaises[codigo.toLowerCase()] || codigo;
}

function exibirModal(tipo, mensagem) {
    const container = document.getElementById("id-container-modais");
    if (!container) return;
    const titulo = tipo === "sucesso" ? "Sucesso" : (tipo === "aviso" ? "Aviso" : "Erro");
    const corTexto = tipo === "sucesso" ? "has-text-success" : (tipo === "aviso" ? "has-text-warning" : "has-text-danger");
    container.innerHTML = `
        <div class="modal-alerta is-active">
            <div id="modal-fundo" class="modal-fundo" onclick="fecharModal()"></div>
            <div class="alerta-cartao">
                <div class="alerta-topo"><span>${titulo}</span><button class="delete" onclick="fecharModal()"></button></div>
                <div class="alerta-corpo"><div class="modal-mensagem ${corTexto}">${mensagem}</div></div>
            </div>
        </div>`;
    setTimeout(fecharModal, 3000);
}

function fecharModal() {
    const container = document.getElementById("id-container-modais");
    if (container) container.innerHTML = "";
}

(function verificarAcesso() {
    const sessao = sessionStorage.getItem("billyvinil_sessao");
    const persistente = localStorage.getItem("billyvinil_login_persistente");
    if (!sessao && persistente) sessionStorage.setItem("billyvinil_sessao", persistente);
    else if (!sessao && !persistente) window.location.href = "login_estoque.html";
})();

document.addEventListener("DOMContentLoaded", () => {
    const btnAbrir = document.getElementById("btn-abrir-formulario");
    const btnCancelar = document.getElementById("btn-cancelar");
    const containerForm = document.getElementById("container-formulario");
    const selectDesconto = document.getElementById("id-desconto-valor");

    if (selectDesconto) {
        for (let i = 5; i <= 70; i += 5) {
            let opt = document.createElement("option");
            opt.value = i;
            opt.innerHTML = `${i}%`;
            selectDesconto.appendChild(opt);
        }
    }

    const switchDesconto = document.getElementById("id-switch-desconto");
    const containerSelect = document.getElementById("container-select-desconto");
    const labelSwitch = document.querySelector('label[for="id-switch-desconto"]');

    if (switchDesconto) {
        switchDesconto.addEventListener("change", function () {
            if (this.checked) {
                containerSelect.classList.remove("is-hidden");
                if (labelSwitch) labelSwitch.innerText = "Sim";
            } else {
                containerSelect.classList.add("is-hidden");
                if (labelSwitch) labelSwitch.innerText = "Não";
            }
        });
    }

    const inputEstilo = document.getElementById("id-input-estilo");
    const btnAddEstilo = document.getElementById("btn-add-estilo");

    const adicionarEstilo = () => {
        let valor = inputEstilo.value.trim();
        if (valor) {
            valor = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
            if (!listaEstilos.includes(valor)) {
                listaEstilos.push(valor);
                inputEstilo.value = "";
                renderizarEstilosVisual();
            }
        }
    };

    if (btnAddEstilo) btnAddEstilo.addEventListener("click", adicionarEstilo);
    if (inputEstilo) inputEstilo.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); adicionarEstilo(); } });

    window.removerEstilo = (index) => {
        listaEstilos.splice(index, 1);
        renderizarEstilosVisual();
    };

    if (btnAbrir && containerForm) {
        const toggleForm = () => {
            const estaEscondido = containerForm.classList.toggle("is-hidden");
            if (!estaEscondido) {
                btnAbrir.innerHTML = '<span class="icon"><i class="fas fa-times"></i></span><span>Fechar formulário</span>';
                btnAbrir.classList.replace("is-link", "is-danger");
            } else {
                btnAbrir.innerHTML = '<span class="icon"><i class="fas fa-plus"></i></span><span>Adicionar novo disco</span>';
                btnAbrir.classList.replace("is-danger", "is-link");
                idDiscoEmEdicao = null;
                document.getElementById("form-cadastro-completo").reset();
                document.getElementById("container-lados-dinamicos").innerHTML = "";
                document.getElementById("id-nome-arq-capa").innerText = "Nenhum arquivo...";
            }
        };
        btnAbrir.addEventListener("click", toggleForm);
        if (btnCancelar) btnCancelar.addEventListener("click", toggleForm);
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            sessionStorage.removeItem("billyvinil_sessao");
            localStorage.removeItem("billyvinil_login_persistente");
            window.location.href = "login_estoque.html";
        });
    }

    document.querySelectorAll(".toggle-tag").forEach(tag => {
        tag.addEventListener("click", () => {
            tag.classList.toggle("is-active");
            const classeCor = tag.getAttribute("data-class");
            if (tag.classList.contains("is-active")) {
                if (classeCor) tag.classList.add(classeCor);
            } else {
                if (classeCor) tag.classList.remove(classeCor);
            }
        });
    });

    carregarTabela();
});

function renderizarEstilosVisual() {
    const container = document.getElementById("container-estilos-adicionados");
    if (!container) return;
    container.innerHTML = listaEstilos.map((est, index) => `
        <span class="tag is-dark">${est}<button type="button" class="delete is-small" onclick="removerEstilo(${index})"></button></span>
    `).join("");
}

function criarEstruturaLado(letraLado) {
    const divLado = document.createElement("div");
    divLado.className = "box has-background-black-ter mb-4 div-lado-musical";
    divLado.dataset.lado = letraLado;
    divLado.innerHTML = `
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
            <h6 class="title is-6 has-text-warning mb-0">LADO ${letraLado}</h6>
            <button type="button" class="delete is-small btn-remover-lado"></button>
        </div>
        <div class="container-faixas"></div>
        <button type="button" class="button is-dark is-small is-fullwidth mt-2 btn-add-faixa">
            <span class="icon is-small"><i class="fas fa-plus"></i></span><span>Adicionar Faixa</span>
        </button>`;
    divLado.querySelector(".btn-remover-lado").onclick = () => divLado.remove();
    divLado.querySelector(".btn-add-faixa").onclick = () => {
        const container = divLado.querySelector(".container-faixas");
        adicionarCampoFaixa(container, container.children.length + 1);
    };
    return divLado;
}

function adicionarCampoFaixa(container, numero) {
    const divFaixa = document.createElement("div");
    divFaixa.className = "field has-addons mb-2";
    divFaixa.innerHTML = `
        <p class="control"><a class="button is-static is-small">${numero}</a></p>
        <p class="control is-expanded"><input class="input is-small input-nome-faixa" type="text" placeholder="Nome da música"></p>
        <p class="control"><button type="button" class="button is-danger is-small btn-remover-faixa"><i class="fas fa-trash"></i></button></p>`;
    divFaixa.querySelector(".btn-remover-faixa").onclick = () => { divFaixa.remove(); atualizarNumeracao(container); };
    container.appendChild(divFaixa);
}

function atualizarNumeracao(container) {
    container.querySelectorAll(".button.is-static").forEach((btn, index) => btn.innerText = index + 1);
}

document.getElementById("btn-add-lado").onclick = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const containerPrincipal = document.getElementById("container-lados-dinamicos");
    const proximoLado = alfabeto[containerPrincipal.children.length] || "?";
    containerPrincipal.appendChild(criarEstruturaLado(proximoLado));
};

function coletarMusicasParaJSON() {
    const listaFinal = [];
    document.querySelectorAll(".div-lado-musical").forEach(divLado => {
        const letraLado = divLado.dataset.lado;
        divLado.querySelectorAll(".field.has-addons").forEach((divFaixa, index) => {
            const nomeMusica = divFaixa.querySelector(".input-nome-faixa").value.trim();
            if (nomeMusica) listaFinal.push({ lado: letraLado, faixa: index + 1, nome: nomeMusica });
        });
    });
    return listaFinal;
}

window.onload = carregarTabela;