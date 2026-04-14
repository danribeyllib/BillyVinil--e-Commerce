///   --  Dados  --   //
let todosOsDiscos = [];

async function carregarRelatorio() {
    try {
        const resposta = await fetch("catalogo_discos.json");
        const discos = await resposta.json();

        discos.sort((a, b) => a.id - b.id);
        todosOsDiscos = discos;

        const container = document.getElementById("tabela-discos-teste");

        configurarFiltrosDinamicos(discos);
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
                    <th class="has-text-white">Selo</th>
                    <th class="has-text-white">Especificações</th>
                    <th class="has-text-white">Estilo Musical</th>
                    <th class="has-text-white">Preço</th>
                </tr>
            </thead>
            <tbody>
    `;

    discos.forEach(disco => {
        const linhaPrincipal = `
    <tr onclick="toggleDetalhes('${detalheId}', this)" class="linha-disco">
        <td>${disco.id}</td>
        ...
`;
        const numeroEstq = disco.estoque > 0 ? "estoque-positivo" : "estoque-zerado";
        const precoVirgula = disco.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const seloHtml = disco.tags ? disco.tags.map(tag => `
            <span class="tag ${tag.cor} is-weight-bold">${tag.nome}</span>
        `).join("") : "-";
     
        html += `
            <tr>
                <td class="is-vcentered is-dark is-inverted">${disco.id}</td>
                <td class="is-vcentered has-text-centered ${numeroEstq} is-size-6 has-text-weight-bold">${disco.estoque}</td>
                <td class="is-vcentered has-text-weight-bold has-text-link">${disco.album}</td>
                <td class="is-vcentered has-text-danger">${disco.artista}</td>
                <td class="is-vcentered">${disco.lancamento}</td>
                <td class="is-vcentered">${disco.edicao}</td>
                <td class="is-vcentered">
                    <span class="is-uppercase mr-2">${disco.pais}</span> 
                    <span class="fi fi-${disco.pais ? disco.pais.toLowerCase() : ""}"></span>
                </td>
                <td class="is-vcentered">
                    <span class="is-uppercase mr-2">${disco.paisFab}</span> 
                    <span class="fi fi-${disco.paisFab ? disco.paisFab.toLowerCase() : ""}"></span>
                </td>
                <td class="is-vcentered has-text-centered"><div class="tags is-centered">${seloHtml}</div></td>
                <td class="is-vcentered is-size-6">
                    <span class="destacar">${disco.peso || "-"}</span><br>
                    <span>${disco.tipo || "-"}</span>
                </td>
                <td class="is-vcentered is-size-6">${Array.isArray(disco.estilo) ? disco.estilo.join(", ") : (disco.estilo || "-")}</td>
                <td class="is-vcentered has-text-right has-text-weight-bold" style="white-space: nowrap;">R$ ${precoVirgula}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

const nomesPaises = { "br": "Brasil", "us": "EUA", "gb": "Reino Unido", "eu": "Europa", "jp": "Japão", "fr": "França", "de": "Alemanha", "it": "Itália" };

function nomePais(codigo) {
    if (!codigo) return "";
    return nomesPaises[codigo.toLowerCase()] || codigo.toUpperCase();
}

function configurarFiltrosDinamicos(discos) {
    const filtros = {
        "filtro-artista": new Set(),
        "filtro-pais-origem": new Set(),
        "filtro-pais-fab": new Set(),
        "filtro-selo": new Set(), 
        "filtro-estilo": new Set(),
        "filtro-tamanho": new Set(),
        "filtro-peso": new Set(),
        "filtro-quantidade": new Set()
    };

    const mapaQtd = {
        "Duplo": "2- Duplo",
        "Triplo": "3- Triplo",
        "Quádruplo": "4- Quádruplo",
        "Quíntuplo": "5- Quíntuplo",
        "Box": "6- Box",
        "Set": "7- Set"
    };

    discos.forEach(d => {
        if (d.artista) filtros["filtro-artista"].add(d.artista);
        if (d.pais) filtros["filtro-pais-origem"].add(d.pais);
        if (d.paisFab) filtros["filtro-pais-fab"].add(d.paisFab);
        
        if (d.tags) {
            d.tags.forEach(t => filtros["filtro-selo"].add(t.nome));
        }

        if (d.estilo) d.estilo.forEach(e => filtros["filtro-estilo"].add(e));
        
        if (d.peso) {
            const matchPeso = d.peso.match(/\d+g/i);
            if (matchPeso) filtros["filtro-peso"].add(matchPeso[0]);
        }

        if (d.tipo) {
            const matchTam = d.tipo.match(/\d+"/);
            if (matchTam) filtros["filtro-tamanho"].add(matchTam[0]);
        }

        const stringBusca = `${d.peso || ""} ${d.tipo || ""}`;
        let encontrouEspecial = false;
        
        for (const chave in mapaQtd) {
            if (stringBusca.toLowerCase().includes(chave.toLowerCase())) {
                filtros["filtro-quantidade"].add(mapaQtd[chave]);
                encontrouEspecial = true;
                break;
            }
        }

        if (!encontrouEspecial) {
            filtros["filtro-quantidade"].add("1- Simples");
        }

        
    });

    for (const id in filtros) {
        // Tenta encontrar o ID 'selo' ou o ID 'estado' se o primeiro falhar
        let select = document.getElementById(id);
        if (!select && id === "filtro-selo") select = document.getElementById("filtro-estado");
        
        if (!select) continue;

        select.innerHTML = `<option value="">Todos</option>`;
        
        const itensOrdenados = Array.from(filtros[id]).sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        itensOrdenados.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = id.includes("pais") ? nomePais(v) : v;
            select.appendChild(opt);
        });
    }
}

function filtrarRelatorio() {
    const texto = document.getElementById("busca-tabela-estoque").value.toLowerCase();
    const fArt = document.getElementById("filtro-artista").value;
    const fOri = document.getElementById("filtro-pais-origem").value;
    const fFab = document.getElementById("filtro-pais-fab").value;
    
    // Captura o valor de Selo ou Estado
    const campoSelo = document.getElementById("filtro-selo") || document.getElementById("filtro-estado");
    const fSelo = campoSelo ? campoSelo.value : "";

    const fStyle = document.getElementById("filtro-estilo").value;
    const fTam = document.getElementById("filtro-tamanho").value;
    const fPeso = document.getElementById("filtro-peso").value;
    const fQtd = document.getElementById("filtro-quantidade").value;

    const lDe = parseInt(document.getElementById("lanc-de").value) || 0;
    const lAte = parseInt(document.getElementById("lanc-ate").value) || 9999;
    const eDe = parseInt(document.getElementById("edic-de").value) || 0;
    const eAte = parseInt(document.getElementById("edic-ate").value) || 9999;

    const filtrados = todosOsDiscos.filter(d => {
        const mTexto = !texto || d.album.toLowerCase().includes(texto) || d.artista.toLowerCase().includes(texto);
        const mArt = !fArt || d.artista === fArt;
        const mOri = !fOri || d.pais === fOri;
        const mFab = !fFab || d.paisFab === fFab;
        const mSelo = !fSelo || (d.tags && d.tags.some(t => t.nome === fSelo));
        const mStyle = !fStyle || (d.estilo && d.estilo.includes(fStyle));
        
        const stringBuscaTotal = `${d.peso || ""} ${d.tipo || ""}`;
        const mTam = !fTam || (d.tipo && d.tipo.includes(fTam));
        const mPeso = !fPeso || (d.peso && d.peso.includes(fPeso));

        let mQtd = true;
        if (fQtd) {
            if (fQtd === "1- Simples") {
                const especiais = ["Duplo", "Triplo", "Quádruplo", "Quíntuplo", "Box", "Set"];
                mQtd = !especiais.some(p => stringBuscaTotal.toLowerCase().includes(p.toLowerCase()));
            } else {
                const termoBusca = fQtd.split("- ")[1].toLowerCase();
                mQtd = stringBuscaTotal.toLowerCase().includes(termoBusca);
            }
        }

        const aLanc = parseInt(d.lancamento) || 0;
        const aEdic = parseInt(d.edicao) || 0;
        const mLanc = aLanc >= lDe && aLanc <= lAte;
        const mEdic = aEdic >= eDe && aEdic <= eAte;

        return mTexto && mArt && mOri && mFab && mSelo && mStyle && mTam && mPeso && mQtd && mLanc && mEdic;
    });

    gerarTabela(filtrados, document.getElementById("tabela-discos-teste"));
}

window.limparTodosFiltros = function() {
    document.getElementById("busca-tabela-estoque").value = "";
    ["lanc-de", "lanc-ate", "edic-de", "edic-ate"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    
    const selects = ["filtro-artista", "filtro-pais-origem", "filtro-pais-fab", "filtro-selo", "filtro-estado", "filtro-estilo", "filtro-tamanho", "filtro-peso", "filtro-quantidade"];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    gerarTabela(todosOsDiscos, document.getElementById("tabela-discos-teste"));
}

document.addEventListener("DOMContentLoaded", () => {
    carregarRelatorio();
    document.getElementById("busca-tabela-estoque").addEventListener("input", filtrarRelatorio);
    const idsInputs = ["lanc-de", "lanc-ate", "edic-de", "edic-ate", "filtro-artista", "filtro-pais-origem", "filtro-pais-fab", "filtro-selo", "filtro-estado", "filtro-estilo", "filtro-tamanho", "filtro-peso", "filtro-quantidade"];
    idsInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const evento = el.tagName === "SELECT" ? "change" : "input";
            el.addEventListener(evento, filtrarRelatorio);
        }
    });

    // Lógica dos Toggles de Tag
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
});