///   --  Dados  --   //
async function carregarRelatorio() {
    try {
        const resposta = await fetch("catalogo_discos.json");
        const discos = await resposta.json();

        discos.sort((a, b) => a.id - b.id);
        todosOsDiscos = discos;

        const container = document.getElementById("tabela-discos-teste");

        gerarTabela(discos, container);
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

///   ---  Tabela   ---   ///   
function gerarTabela(discos, container) {
    let html = `
    <div class="table-container">
        <table class="table is-striped is-hoverable is-fullwidth is-bordered">
            <thead>
                <tr class="has-background-dark">
                    <th class="has-text-white">ID</th>
                    <th class="has-text-white">Estoque</th>
                    <th class="has-text-white">Álbum</th>
                    <th class="has-text-white">Artista</th>
                    <th class="has-text-white">Lançamento</th>
                    <th class="has-text-white">Edição</th>
                    <th class="has-text-white">Origem</th>
                    <th class="has-text-white">Fabricação</th>
                    <th class="has-text-white">Estado</th>
                    <th class="has-text-white">Especificações</th>
                    <th class="has-text-white">Estilo Musical</th>
                    <th class="has-text-white">Preço</th>
                </tr>
            </thead>
            <tbody>
    `;

    discos.forEach(disco => {
        const numeroEstq = disco.estoque > 0 ? "estoque-positivo" : "estoque-zerado";
        const precoVirgula = disco.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const tagsHtml = disco.tags.map(tag => `
            <span class="tag ${tag.cor} is-weight-bold">
                ${tag.nome}
            </span>
        `).join("");
     
        html += `
       
            <tr>
                <td class="is-vcentered is-dark is-inverted">${disco.id}</td>
                 <td class="is-vcentered has-text-centered ${numeroEstq} is-size-6 has-text-weight-bold">
                    ${disco.estoque}
                </td>
                <td class="is-vcentered has-text-weight-bold has-text-link">${disco.album}</td>
                <td class="is-vcentered has-text-danger">${disco.artista}</td>
                <td class="is-vcentered">${disco.lancamento}</td>
                <td class="is-vcentered">${disco.edicao}</td>
                <td class="is-vcentered">
                    <span class="is-uppercase mr-2">${disco.pais}</span> 
                    <span class="fi fi-${disco.pais}"></span>
                </td>
                 <td class="is-vcentered">
                    <span class="is-uppercase mr-2">${disco.paisFab}</span> 
                    <span class="fi fi-${disco.paisFab}"></span>
                </td>

                <td class="is-vcentered has-text-centered">
                    <div class="tags is-centered">
                        ${tagsHtml}
                    </div>
                </td>

                  <td class="is-vcentered is-size-6">
                   <span class="destacar"> ${Array.isArray(disco.peso) ? disco.peso.join(", ") : (disco.peso || "-")} </span>
                    <span> ${Array.isArray(disco.tipo) ? disco.tipo.join(", ") : (disco.tipo || "-")} </span>
                </td>
                
                <td class="is-vcentered is-size-6">
                    ${Array.isArray(disco.estilo) ? disco.estilo.join(", ") : (disco.estilo || "-")}
                </td>

                <td class="is-vcentered has-text-right has-text-weight-bold" style="white-space: nowrap;">
                    R$ ${precoVirgula}
                </td>
            </tr>

        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}
 //  -- Nomes dos Países p/ filtrar  --  //
const nomesPaises = {
    "br": "Brasil",
    "us": "Estados Unidos (EUA)",
    "gb": "Reino Unido",
    "eu": "Europa",
    "jp": "Japão",
    "fr": "França",
    "de": "Alemanha",
    "it": "Itália",
    "at": "Áustria",
    "EU": "Europa",
    "se": "Suécia",
    "ru": "Rússia",
    "gb-eng": "Inglaterra"
};

function nomePais(codigo) {
    if (!codigo) return "";
    return nomesPaises[codigo.toLowerCase()] || "";
}

//  --  Filtro de Busca  --  //
let todosOsDiscos = [];

function filtrarDiscos(termo) {
    termo = termo.toLowerCase();
    const filtrados = todosOsDiscos.filter(disco => {

        const termoFiltrar = `
      ${disco.id}
            ${disco.album}
            ${disco.artista}
            ${disco.lancamento}
            ${disco.edicao}
            ${disco.peso}
            ${disco.tipo}
            ${nomePais(disco.pais)}
            ${nomePais(disco.paisFab)}
            ${Array.isArray(disco.estilo) ? disco.estilo.join(" ") : ""}
            ${Array.isArray(disco.tags) ? disco.tags.map(t => t.nome).join(" ") : ""}
        `.toLowerCase();

        return termoFiltrar.includes(termo);
    });

    const container = document.getElementById("tabela-discos-teste");
    gerarTabela(filtrados, container);
};

document.addEventListener("DOMContentLoaded", () => {
    const inputBusca = document.getElementById("busca-tabela-estoque")

    if (!inputBusca) return;

    inputBusca.addEventListener("input", (e) => {
        filtrarDiscos(e.target.value);
    })
});


carregarRelatorio();