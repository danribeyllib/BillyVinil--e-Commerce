// URL do servidor - Express //
const API_URL = "http://localhost:3000/discos";

// Controle de edição //
let idDiscoEmEdicao = null;
let novaCapaSelecionada = false;
let novaGaleriaSelecionada = false;

function obterValor(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

// Atualizar nome do arquivo de capa ao selecionar //
document.getElementById("id-arquivo-capa").onchange = function () {
    novaCapaSelecionada = true;

    const nomeArquivo = this.files[0] ? this.files[0].name : "Nenhum arquivo...";
    document.getElementById("id-nome-arq-capa").innerText = nomeArquivo;
};

// Galeria para (máx. 10 fotos) //
document.getElementById("id-arquivo-galeria").onchange = function (e) {
    novaGaleriaSelecionada = true;

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

    const campoDesc = document.getElementById("id-desconto-valor");
    const isOferta = document.getElementById("id-switch-desconto")?.checked || false;
    const porcentagemDesc = (isOferta && campoDesc) ? campoDesc.value : 0;

    const formData = new FormData();
    formData.append("album", obterValor("id-album"));
    formData.append("artista", obterValor("id-artista"));
    formData.append("lancamento", Number(obterValor("id-lancamento")));
    formData.append("estoque", Number(obterValor("id-estoque")));
    formData.append("percentualDesconto", Number(porcentagemDesc));
    formData.append("oferta", isOferta);

    //  Peso e Qtd Unificados
    const pesoBase = obterValor("id-peso");
    const qtdTexto = obterValor("id-qtd-discos");
    const pesoFinal = (qtdTexto === "Simples" || !qtdTexto) ? pesoBase : `${pesoBase} ${qtdTexto}`;

    formData.append("peso", pesoFinal);
    formData.append("qtdDiscos", qtdTexto);

    formData.append("tipo", obterValor("id-tipo"));
    formData.append("pais", obterValor("id-pais-origem"));
    formData.append("paisFab", obterValor("id-pais-fabricacao"));

    formData.append("preco", Number(obterValor("id-preco")));

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
    if (novaCapaSelecionada && arquivoCapa) {
        formData.append("capa", arquivoCapa);
    }

    const arquivosGaleria = document.getElementById("id-arquivo-galeria").files;
    if (novaGaleriaSelecionada && arquivosGaleria.length > 0) {
        for (let i = 0; i < arquivosGaleria.length; i++) {
            formData.append("galeria", arquivosGaleria[i]);
        }
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

            novaCapaSelecionada = false;
            novaGaleriaSelecionada = false;

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
        exibirModal("erro", "Não foi possível conectar ao servidor.", erro);
    }
};


// Eclusão de Dicos
async function excluirDisco(id) {
    confirmarExclusao(id);
}

// Modal confimação exclusão
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

// Carregar a Tabela //
async function carregarTabela() {
    try {
        const resposta = await fetch(API_URL);
        const discos = await resposta.json();
        montarTabela(discos);
        return;
        const bodyTabela = document.getElementById("id-lista-estoque");


        if (!bodyTabela) return;
        bodyTabela.innerHTML = "";

        discos.forEach(disco => {
            const detalheId = `detalhe-${disco.id}`;
            const pDesconto = disco.percentualDesconto || 0;
            const descontoTabela = pDesconto > 0 ? `${pDesconto}%` : "Não";

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
                        "Bom Estado": "verde-tag", "Clássico": "azul-claro-tag", "Cult": "importado-tag",
                        "Destaque": "destaque-tag", "Edição Limitada": "azul-claro-tag", "Excelente Estado": "turquesa-tag",
                        "Importado": "importado-tag", "Lacrado": "prata-tag", "Novo": "verde-tag",
                        "Oferta": "oferta-tag", "Raro": "gold-tag", "Remaster": "vermelho-tag"
                    };
                    classeCor = mapaCores[t.nome] || "";
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
                   <td class="${Number(disco.estoque) === 0 ? 'has-text-danger has-text-weight-bold' : ''}">${disco.estoque}</td>
                    <td class="has-text-centered"><i class="fas fa-chevron-down is-size-7"></i></td>
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
                                            <span class="icon"><i class="fas fa-edit"></i></span><span>Editar Dados</span>
                                        </button>
                                        <button class="button is-danger is-small" onclick="event.stopPropagation(); excluirDisco('${disco.id}')">
                                            <span class="icon"><i class="fas fa-trash"></i></span><span>Excluir Disco</span>
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

// Filtro de Busca
async function aplicarFiltros() {
    try {
        const resposta = await fetch(API_URL);
        const discos = await resposta.json();

        const busca = document.getElementById("filtro-busca")?.value.toLowerCase().trim() || "";
        const artista = document.getElementById("filtro-artista")?.value || "";
        const estilo = document.getElementById("filtro-estilo")?.value || "";
        const paisFab = document.getElementById("filtro-pais-fab")?.value || "";
        const paisOrigem = document.getElementById("filtro-pais-origem")?.value || "";
        const tag = document.getElementById("filtro-tag")?.value || "";

        const lancDe = Number(document.getElementById("lanc-de")?.value || 0);
        const lancAte = Number(document.getElementById("lanc-ate")?.value || 9999);

        const edicDe = Number(document.getElementById("edic-de")?.value || 0);
        const edicAte = Number(document.getElementById("edic-ate")?.value || 9999);


        const oferta = document.getElementById("filtro-oferta")?.value || "";
        const desconto = document.getElementById("filtro-desconto")?.value || "";

        const filtrados = discos.filter(disco => {

            const textoBusca = `
                ${disco.album || ""}
                ${disco.artista || ""}
                ${disco.edicao || ""}`.toLowerCase();

            const passouBusca =
                busca === "" || textoBusca.includes(busca);

            const passouArtista =
                artista === "" || disco.artista === artista;

            // lançamento
            const anoLanc = Number(disco.lancamento || 0);

            const passouLancamento =
                anoLanc >= lancDe &&
                anoLanc <= lancAte;


            // edição
            const anoEdic = Number(disco.edicao || 0);

            const passouEdicao =
                anoEdic >= edicDe &&
                anoEdic <= edicAte;

            // estilos
            let estilos = [];

            if (Array.isArray(disco.estilo)) {
                estilos = disco.estilo;

            } else if (typeof disco.estilo === "string") {

                try {
                    const convertido = JSON.parse(disco.estilo);

                    estilos = Array.isArray(convertido)
                        ? convertido
                        : [convertido];

                } catch {
                    estilos = disco.estilo
                        .split(",")
                        .map(item => item.trim());
                }
            }

            const passouEstilo =
                estilo === "" ||
                estilos.some(item =>
                    item.toLowerCase().trim() === estilo.toLowerCase().trim()
                );

            // tags
            let tags = [];

            if (disco.tags) {
                try {
                    tags = typeof disco.tags === "string"
                        ? JSON.parse(disco.tags)
                        : disco.tags;
                } catch {
                    tags = [];
                }
            }

            const nomesTags = tags.map(t => t.nome);

            const passouTag =
                tag === "" || nomesTags.includes(tag);

            const passouPaisFab =
                paisFab === "" || disco.paisFab === paisFab;

            const passouPaisOrigem =
                paisOrigem === "" ||
                disco.pais === paisOrigem ||
                disco.paisOrigem === paisOrigem;

            // Oferta
            let passouOferta = true;

            if (oferta === "sim") {
                passouOferta = Number(disco.percentualDesconto) > 0;
            }

            if (oferta === "nao") {
                passouOferta = Number(disco.percentualDesconto) === 0;
            }

            // %
            const passouDesconto =
                desconto === "" ||
                Number(disco.percentualDesconto) === Number(desconto);

            return (
                passouBusca &&
                passouArtista &&
                passouEstilo &&
                passouPaisFab &&
                passouPaisOrigem &&
                passouTag &&
                passouOferta &&
                passouDesconto &&
                passouLancamento &&
                passouEdicao
            );
        });

        montarTabela(filtrados);

    } catch (erro) {
        console.error("Erro filtro:", erro);
    }
}

function montarTabela(discos) {
    const bodyTabela = document.getElementById("id-lista-estoque");
    if (!bodyTabela) return;

    bodyTabela.innerHTML = "";
    let totalEstoque = 0;

    discos.forEach(disco => {

        const detalheId = `detalhe-${disco.id}`;
        const pDesconto = disco.percentualDesconto || 0;
        const descontoTabela = pDesconto > 0 ? `${pDesconto}%` : "Não";
        totalEstoque += Number(disco.estoque || 0);

        let tagsArray = [];
        if (disco.tags) {
            try {
                tagsArray = typeof disco.tags === "string"
                    ? JSON.parse(disco.tags)
                    : disco.tags;
            } catch {
                tagsArray = [];
            }
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
                    "Excelente Estado": "turquesa-tag",
                    "Importado": "importado-tag",
                    "Lacrado": "prata-tag",
                    "Novo": "verde-tag",
                    "Oferta": "oferta-tag",
                    "Raro": "gold-tag",
                    "Remaster": "vermelho-tag"
                };

                classeCor = mapaCores[t.nome] || "";
            }

            return `<span class="tag is-small ${classeCor}">${t.nome}</span>`;
        }).join(" ");

        // Estilos/generos
        let estilosTexto = "-";

        if (Array.isArray(disco.estilo)) {
            estilosTexto = disco.estilo.join(", ");
        } else if (typeof disco.estilo === "string") {
            try {
                const estilosParse = JSON.parse(disco.estilo);
                estilosTexto = Array.isArray(estilosParse)
                    ? estilosParse.join(", ")
                    : disco.estilo;
            } catch {
                estilosTexto = disco.estilo;
            }
        }

        bodyTabela.innerHTML += `
        <tr onclick="toggleDetalhes('${detalheId}', this)" class="linha-disco has-text-white" style="cursor:pointer;">

            <td class="has-text-info-light">${disco.id}</td>
            <td><strong>${disco.album}</strong></td>
            <td>${disco.artista}</td>
            <td>R$ ${parseFloat(disco.preco).toFixed(2)}</td>
            <td>${descontoTabela}</td>
            <td class="${Number(disco.estoque) === 0 ? 'has-text-danger has-text-weight-bold' : 'has-text-success-light has-text-weight-semibold'}">${disco.estoque}</td>
            <td class="has-text-centered">
                <i class="fas fa-chevron-down is-size-7"></i>
            </td>
        </tr>

        <tr id="${detalheId}" class="is-hidden has-background-dark">
            <td colspan="7">

                <div class="p-4 content is-small has-text-white">

                    <div class="columns is-variable is-4">

                        <!-- CAPA -->
                        <div class="column is-2 has-text-centered">
                            <img src="${disco.capa}" class="detalhe-capa">

                            <div class="mt-3 tags is-centered">
                                ${tagsHtml}
                            </div>
                        </div>

                        <!-- INFO -->
                        <div class="column is-4 coluna-info">

                            <p class="mb-1 has-text-info">
                                <strong>Lançamento:</strong> ${disco.lancamento}
                                |
                                <strong>Edição:</strong> ${disco.edicao}
                            </p>

                            <p class="mb-1 has-text-info">
                                <strong>Especificações:</strong>
                                ${disco.peso} - ${disco.tipo}
                            </p>

                            <p class="mb-1 has-text-info">
                                <strong>Origem:</strong>
                                ${nomePais(disco.paisOrigem || disco.pais)}
                                |
                                <strong>Fabricação:</strong>
                                ${nomePais(disco.paisFab)}
                            </p>

                            <p class="mb-2 has-text-info">
                                <strong>Estilos:</strong>
                                ${estilosTexto}
                            </p>

                            <hr class="divisor-detalhe">

                            <p>
                                <strong>Resumo:</strong><br>
                                <span class="texto-resumo">
                                    ${disco.resumo || "Sem descrição."}
                                </span>
                            </p>

                            <div class="buttons mt-4">

                                <button class="button is-link is-small"
                                    onclick="event.stopPropagation(); prepararEdicao('${disco.id}')">

                                    <span class="icon">
                                        <i class="fas fa-edit"></i>
                                    </span>

                                    <span>Editar Dados</span>
                                </button>

                                <button class="button is-danger is-small"
                                    onclick="event.stopPropagation(); excluirDisco('${disco.id}')">

                                    <span class="icon">
                                        <i class="fas fa-trash"></i>
                                    </span>

                                    <span>Excluir Disco</span>
                                </button>

                            </div>

                        </div>

                        <!-- TRACKLIST -->
                        <div class="column is-6">

                            <p class="has-text-weight-bold is-size-6 mb-2">
                                Lista de Faixas
                            </p>

                            <div class="container-tracklist">
                                ${gerarTracklist(disco.musicas)}
                            </div>

                        </div>

                    </div>

                </div>

            </td>
        </tr>
        `;
    });

    atualizarDashboard(discos);
}

// Dash
async function atualizarDashboard(discosFiltrados) {

    const dashboard = document.getElementById("dashboard-estoque");
    if (!dashboard) return;

    // Total Fintro
    let totalFiltrado = 0;

    discosFiltrados.forEach(d => {
        totalFiltrado += Number(d.estoque || 0);
    });

    // Total em Estoque
    const resposta = await fetch(API_URL);
    const todos = await resposta.json();

    let totalGeral = 0;

    todos.forEach(d => {
        totalGeral += Number(d.estoque || 0);
    });

    dashboard.innerHTML = `
        <div class="columns is-mobile m-0">

            <div class="column is-6">
                <div class="has-text-white">
                    <p class="heading has-text-link-light has-text-centered">
                        Total de Discos em Estoque
                    </p>

                    <p class="is-size-4 has-text-info has-text-centered">
                        ${totalGeral}
                    </p>
                </div>
            </div>

            <div class="column is-6">
                <div class="has-text-white">
                    <p class="heading has-text-link-light has-text-centered">
                        Total em Estoque Conforme Filtro Aplicado
                    </p>

                    <p class="is-size-4 has-text-warning has-text-centered">
                        ${totalFiltrado}
                    </p>
                </div>
            </div>

        </div>
    `;
}

// Filtros
async function carregarFiltros() {
    try {
        const resposta = await fetch(API_URL);
        const discos = await resposta.json();

        preencherSelect("filtro-artista",
            [...new Set(discos.map(d => d.artista))]);

        preencherSelect("filtro-pais-fab",
            [...new Set(discos.map(d => d.paisFab))]);

        preencherSelect("filtro-pais-origem",
            [...new Set(discos.map(d => d.pais || d.paisOrigem))]);

        // estilos
        let estilos = [];

        discos.forEach(d => {
            if (Array.isArray(d.estilo)) {
                estilos.push(...d.estilo);
            }
        });

        preencherSelect("filtro-estilo",
            [...new Set(estilos)]);

        // tags
        let tags = [];

        discos.forEach(d => {
            if (d.tags) {
                let lista = typeof d.tags === "string"
                    ? JSON.parse(d.tags)
                    : d.tags;

                lista.forEach(t => tags.push(t.nome));
            }
        });

        preencherSelect("filtro-tag",
            [...new Set(tags)]);

        // Desconto
        preencherSelect("filtro-desconto",
            [...new Set(
                discos
                    .map(d => d.percentualDesconto)
                    .filter(v => Number(v) > 0)
            )]);

    } catch (erro) {
        console.error("Erro filtros:", erro);
    }
}

// Selects
function preencherSelect(id, lista) {

    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="">Todos</option>`;

    lista
        .filter(item => item)
        .sort()
        .forEach(item => {

            let texto = item;

            // Select de país
            if (
                id === "filtro-pais-fab" ||
                id === "filtro-pais-origem"
            ) {
                texto = nomesPaises[item.toLowerCase()] || item;
            }

            select.innerHTML += `
                <option value="${item}">
                    ${texto}
                </option>
            `;
        });
}

//Limpar Filtros
function limparTodosFiltros() {

    const ids = [
        "filtro-busca",
        "filtro-artista",
        "filtro-estilo",
        "filtro-pais-fab",
        "filtro-pais-origem",
        "filtro-tag",
        "filtro-oferta",
        "filtro-desconto",
        "lanc-de",
        "lanc-ate",
        "edic-de",
        "edic-ate"
    ];

    ids.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    carregarTabela();
}

document.addEventListener("DOMContentLoaded", () => {

    const filtros = [
        "filtro-busca",
        "filtro-artista",
        "filtro-estilo",
        "filtro-pais-fab",
        "filtro-pais-origem",
        "filtro-tag",
        "filtro-oferta",
        "filtro-desconto"
    ];

    filtros.forEach(id => {
        const campo = document.getElementById(id);

        if (campo) {
            campo.addEventListener("input", aplicarFiltros);
            campo.addEventListener("change", aplicarFiltros);
        }
    });

    const selectOferta = document.getElementById("filtro-oferta");
    const selectDesconto = document.getElementById("filtro-desconto");

    function controlarCampoDesconto() {
        if (selectOferta.value === "sim") {
            selectDesconto.disabled = false;
        } else {
            selectDesconto.disabled = true;
            selectDesconto.value = "";
        }
    }

    selectOferta.addEventListener("change", controlarCampoDesconto);

    controlarCampoDesconto();

});

// Preparar a Edição //
async function prepararEdicao(id) {

    console.log("ÁLBUM:", obterValor("id-album"));

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

        /// Selects (Peso e Qtd)
        const pesoBruto = String(disco.weight || disco.peso || "");
        let pesoDetectado = "";
        let qtdDetectada = "Simples";

        if (pesoBruto.includes("120g")) pesoDetectado = "120g";
        else if (pesoBruto.includes("140g")) pesoDetectado = "140g";
        else if (pesoBruto.includes("180g")) pesoDetectado = "180g";
        else if (pesoBruto.includes("200g")) pesoDetectado = "200g";

        if (pesoBruto.includes("Duplo")) qtdDetectada = "Duplo";
        else if (pesoBruto.includes("Triplo")) qtdDetectada = "Triplo";
        else if (pesoBruto.includes("Quádruplo")) qtdDetectada = "Quádruplo";
        else if (disco.qtdDiscos) qtdDetectada = disco.qtdDiscos;

        const campos = {
            "id-album": disco.album,
            "id-artista": disco.artista,
            "id-lancamento": disco.lancamento,
            "id-estoque": disco.estoque,
            "id-preco": disco.preco,
            "id-edicao": disco.edicao,
            "id-peso": pesoDetectado,
            "id-qtd-discos": qtdDetectada,
            "id-tipo": disco.tipo,
            "id-pais-origem": disco.pais || disco.paisOrigem,
            "id-pais-fabricacao": disco.paisFab,
            "id-resumo": Array.isArray(disco.resumo) ? disco.resumo[0] : disco.resumo
        };

        Object.entries(campos).forEach(([idCampo, valor]) => {
            const el = document.getElementById(idCampo);
            if (el) el.value = (valor !== undefined && valor !== null) ? valor : "";
        });

        // Lados e Faixas
        const containerLados = document.getElementById("container-lados-dinamicos");
        if (containerLados) {
            containerLados.innerHTML = "";
            if (disco.musicas && Array.isArray(disco.musicas)) {
                const musicasAgrupadas = disco.musicas.reduce((acc, m) => {
                    const lado = m.lado || "A";
                    if (!acc[lado]) acc[lado] = [];
                    acc[lado].push(m);
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

        let tagsSalvas = [];
        try {
            tagsSalvas = typeof disco.tags === 'string' ? JSON.parse(disco.tags) : (disco.tags || []);
        } catch (e) { tagsSalvas = []; }

        document.querySelectorAll(".toggle-tag").forEach(tag => {
            const valorTag = tag.getAttribute("data-value");
            const classeCor = tag.getAttribute("data-class");
            const temTag = tagsSalvas.find(t => t.nome === valorTag);
            tag.classList.remove("is-active");
            if (classeCor) tag.classList.remove(classeCor);
            if (temTag) {
                tag.classList.add("is-active");
                if (classeCor) tag.classList.add(classeCor);
            }
        });

        const switchDesc = document.getElementById("id-switch-desconto");
        const containerDesc = document.getElementById("container-select-desconto");
        const labelSwitch = document.querySelector('label[for="id-switch-desconto"]');
        const temDesc = disco.oferta === true || (disco.percentualDesconto > 0);

        if (switchDesc) {
            switchDesc.checked = temDesc;
            if (labelSwitch) labelSwitch.innerText = temDesc ? "Sim" : "Não";
            if (temDesc && containerDesc) {
                containerDesc.classList.remove("is-hidden");
                const campoValor = document.getElementById("id-desconto-valor");
                if (campoValor) campoValor.value = disco.percentualDesconto || "";
            } else if (containerDesc) {
                containerDesc.classList.add("is-hidden");
            }
        }

        if (containerForm) containerForm.scrollIntoView({ behavior: 'smooth' });

    } catch (erro) { console.error("Erro detalhado na edição:", erro); }
}

// Toggle detalhes tabela
function toggleDetalhes(id, linha) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    elemento.classList.toggle("is-hidden");
    if (linha) linha.classList.toggle("is-selected");
}

// Geração da lista de faixas
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

// Formatação do nome país
function nomePais(codigo) {
    if (!codigo) return "-";
    return nomesPaises[codigo.toLowerCase()] || codigo;
}

// Modal
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

// Login
(function verificarAcesso() {
    const sessao = sessionStorage.getItem("billyvinil_sessao");
    const persistente = localStorage.getItem("billyvinil_login_persistente");
    if (!sessao && persistente) sessionStorage.setItem("billyvinil_sessao", persistente);
    else if (!sessao && !persistente) window.location.href = "login_estoque.html";
})();

// Form
document.addEventListener("DOMContentLoaded", () => {
    const btnAbrir = document.getElementById("btn-abrir-formulario");
    const btnCancelar = document.getElementById("btn-cancelar");
    const containerForm = document.getElementById("container-formulario");
    const selectDesconto = document.getElementById("id-desconto-valor");

    const formulario = document.getElementById("form-cadastro-completo");


    if (formulario) {
        formulario.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                e.preventDefault();
            }
        });
    }

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
            valor = valor.toLowerCase().split(" ").map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1)).join(" ");
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

    // Tags
    document.querySelectorAll(".toggle-tag").forEach(tag => {
        const classeCor = tag.getAttribute("data-class");
        tag.addEventListener("click", () => {
            const ativa = tag.classList.toggle("is-active");
            if (classeCor) {
                if (ativa) tag.classList.add(classeCor);
                else tag.classList.remove(classeCor);
            }
        });
    });

    carregarTabela();
    carregarFiltros();
});

function renderizarEstilosVisual() {
    const container = document.getElementById("container-estilos-adicionados");
    if (!container) return;
    container.innerHTML = listaEstilos.map((est, index) => `
        <span class="tag is-dark">${est}<button type="button" class="delete is-small" onclick="removerEstilo(${index})"></button></span>
    `).join("");
}

// Lados das faixas
function criarEstruturaLado(letraLado) {
    const divLado = document.createElement("div");
    divLado.className = "box has-background-black-ter mb-4 div-lado-musical m-2";
    divLado.dataset.lado = letraLado;
    divLado.innerHTML = `
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
            <h6 class="subtitle is-5 has-text-warning mb-0">LADO ${letraLado}</h6>
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

// Campos para as faixas
function adicionarCampoFaixa(container, numero) {
    const divFaixa = document.createElement("div");
    divFaixa.className = "field has-addons mb-2";
    divFaixa.innerHTML = `
        <p class="control"><a class="button is-static is-small">${numero}</a></p>
       <p class="control is-expanded">
        <input class="input is-small input-nome-faixa" type="text" placeholder="Nome da música">
        </p>
        <p class="control"><button type="button" class="button is-danger is-small btn-remover-faixa"><i class="fas fa-trash"></i></button></p>`;

    const inputFaixa = divFaixa.querySelector(".input-nome-faixa");

    inputFaixa.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();

            adicionarCampoFaixa(container, container.children.length + 1);

            const inputs = container.querySelectorAll(".input-nome-faixa");
            inputs[inputs.length - 1].focus();
        }
    });

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

// Transformar faixas para json
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