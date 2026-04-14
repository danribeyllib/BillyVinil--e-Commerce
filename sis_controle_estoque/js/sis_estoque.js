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

        bodyTabela.innerHTML = "";

        discos.forEach(disco => {
            const linha = `
                <tr>
                    <td>${disco.id}</td>
                    <td>${disco.album}</td>
                    <td>${disco.artista}</td>
                    <td>R$ ${parseFloat(disco.preco).toFixed(2)}</td>
                    <td>${disco.desconto}%</td>
                    <td>${disco.estoque}</td>
                    <td>
                        <button class="button is-small is-danger" onclick="excluirDisco('${disco.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            bodyTabela.innerHTML += linha;
        });
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
};

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

    // Toggle //
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

        // Esconder formulário após submit //
        formCadastro.addEventListener("submit", async (e) => {
        });
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

    // Lógica dos Toggles de Tag
    const toggles = document.querySelectorAll(".toggle-tag");

    toggles.forEach(tag => {
        tag.addEventListener("click", () => {
            // Alterna a classe ativa
            tag.classList.toggle("is-active");

            // Aplica a classe de cor original apenas se estiver ativa
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