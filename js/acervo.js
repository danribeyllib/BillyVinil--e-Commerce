///   MENÚ SANDUÍCHE - Bulma CSS   ///
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

///   CARROSSEL    ///
const montarCarrossel = {};

////     CARREGAMENTO DE DADOS    ////
async function renderizarCarrosselPorTag(categoria, containerId) {

    if (typeof window.todosDiscos === "undefined" || window.todosDiscos.length === 0) {
        try {
            const resposta = await fetch("../data/catalogo_discos.json");
            window.todosDiscos = await resposta.json();
        } catch (e) {
            console.error("Erro ao carregar catálogo discos");
            return;
        }
    };

    const termos = Array.isArray(categoria)
        ? categoria.map(v => String(v).toLowerCase())
        : [String(categoria).toLowerCase()];

    const discos = window.todosDiscos.filter(d => {
        return termos.some(valor => {
            const noEstilo = d.estilo && d.estilo.some(e => e.toLowerCase() === valor);
            const noArtista = d.artista && d.artista.toLowerCase() === valor;
            const noAlbum = d.album && d.album.toLowerCase() === valor;
            const noId = String(d.id) === valor;
            const naTag = d.tags && d.tags.some(t => t.nome.toLowerCase() === valor);

            return noEstilo || noArtista || noAlbum || noId || naTag;
        });
    });

    if (discos.length === 0) return;

    montarCarrossel[containerId] = {
        activeIndex: 0,
        discos: discos,
        total: discos.length
    };

    const container = document.getElementById(containerId);
    if (!container) return;

    ///   Estrutura do painel de navegação   ///
    container.innerHTML = `
        <div class="carousel-container">
            <div class="carousel-stage" id="stage-${containerId}"></div>
            <div class="carousel-controls">
                <button class="nav-btn" onclick="navegarCarrossel('${containerId}', -1)">
                    <i class="fa-solid fa-angle-left"></i>
                </button>
                <div class="pagination-indicators" id="dots-${containerId}"></div>
                <button class="nav-btn" onclick="navegarCarrossel('${containerId}', 1)">
                    <i class="fa-solid fa-angle-right"></i>
                </button>
            </div>
        </div>
    `;

    renderizarCardsCarrossel(containerId);
}

///   Renderização dos Cards  ///
function renderizarCardsCarrossel(id) {
    const inst = montarCarrossel[id];
    const stage = document.getElementById(`stage-${id}`);
    const dots = document.getElementById(`dots-${id}`);

    inst.discos.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "carousel-card";

        card.onclick = () => {
            if (inst.activeIndex === index) {
                window.open(`./detalhes.html?id=${item.id}`, "_blank");
            } else {
                inst.activeIndex = index;
                updateInstancia(id);
            }
        };

        const preco = item.preco.toFixed(2).replace(".", ",");

        /// --- Estrutura do card  --- ///
        card.innerHTML = `
            <div class="card-img-carrossel" style="background-image: url('${item.capa}')">
                ${item.estoque === 0 ? `<span class="faixa-indisponivel">Indisponível</span>` : ""}
            </div>
            <div class="card-content-carrossel">
                <div class="card-header-carrossel">
                    <h3 title="${item.album}">${item.album}</h3>
                    <span class="has-text-weight-bold has-text-primary">R$ ${preco}</span>
                </div>
                <div class="card-footer-carrossel">
                    <p class="has-text-white">${item.artista}</p>
                </div>
            </div>`;

        stage.appendChild(card);

        const dot = document.createElement("div");
        dot.className = "dot";
        dot.onclick = (e) => {
            e.stopPropagation();
            inst.activeIndex = index;
            updateInstancia(id);
        };
        dots.appendChild(dot);
    });

    updateInstancia(id);
}

///     Lógica de transição do carrossel     ///
function updateInstancia(id) {
    const inst = montarCarrossel[id];
    const stage = document.getElementById(`stage-${id}`);
    const dotsContainer = document.getElementById(`dots-${id}`);

    if (!stage || !dotsContainer) return;

    const cards = stage.children;
    const dots = dotsContainer.children;

    inst.discos.forEach((_, index) => {
        let offset = index - inst.activeIndex;

        if (offset > Math.floor(inst.total / 2)) offset -= inst.total;
        if (offset < -Math.floor(inst.total / 2)) offset += inst.total;

        let pos = "hidden";

        if (offset === 0) pos = "active";
        else if (offset === -1) pos = "left";
        else if (offset === 1) pos = "right";
        else if (offset < -1) pos = "far-left";
        else if (offset > 1) pos = "far-right";

        if (cards[index]) cards[index].className = `carousel-card ${pos}`;
        if (dots[index]) dots[index].className = `dot ${index === inst.activeIndex ? "active" : ""}`;
    });
}

///  NAVEGAÇÃO ENTRE SLIDES   ///
window.navegarCarrossel = (id, direcao) => {
    const inst = montarCarrossel[id];
    if (!inst) return;
    inst.activeIndex = (inst.activeIndex + direcao + inst.total) % inst.total;
    updateInstancia(id);
};

/// Tags para montar os cards por seção   ///
document.addEventListener("DOMContentLoaded", () => {
    renderizarCarrosselPorTag("Destaque", "section-carrossel-destaques");
    renderizarCarrosselPorTag("Rock Nacional", "section-carrossel-rock-nacional");
    renderizarCarrosselPorTag("Rock Internacional", "section-carrossel-rock-internacional");
    renderizarCarrosselPorTag("Pop", "section-carrossel-pop");
    renderizarCarrosselPorTag("MPB", "section-carrossel-mpb");
    renderizarCarrosselPorTag("Disco Music", "section-carrossel-discoteca");
    renderizarCarrosselPorTag(["Ópera", "Musical", "Clássico", "Orquestra"], "section-carrossel-orquestra");
    renderizarCarrosselPorTag(["Games", "Trilha Sonora"], "section-carrossel-games");
});

