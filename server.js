const express = require("express");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Configurações

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));
app.use("/imagens", express.static(path.join(__dirname, "imagens")));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const caminhoArquivo = path.join(__dirname, "data", "catalogo_discos.json");

// Funções auxiliares
function limparNome(nome) {
    return nome
        .trim()
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/\s+/g, "_");
}

function lerBanco() {
    if (!fs.existsSync(caminhoArquivo)) return [];

    const data = fs.readFileSync(caminhoArquivo, "utf8");
    return JSON.parse(data || "[]");
}

function salvarBanco(lista) {
    fs.writeFileSync(caminhoArquivo, JSON.stringify(lista, null, 2));
}

function paraNumero(valor, padrao = 0) {
    const n = Number(valor);
    return isNaN(n) ? padrao : n;
}

function paraBoolean(valor) {
    return valor === true || valor === "true";
}

function paraArrayJSON(valor) {
    try {
        return valor ? JSON.parse(valor) : [];
    } catch {
        return [];
    }
}

function caminhoPublico(caminhoArquivo) {
    return caminhoArquivo
        .replace(__dirname, "")
        .replace(/\\/g, "/");
}

// Upload imagens
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const album = limparNome(req.body.album || "sem_album");

        let pastaDestino;

        if (file.fieldname === "capa") {
            pastaDestino = path.join(__dirname, "imagens", "capas");
        } else {
            pastaDestino = path.join(__dirname, "imagens", "galeria", album);
        }

        fs.mkdirSync(pastaDestino, { recursive: true });

        cb(null, pastaDestino);
    },

    filename: (req, file, cb) => {

        const album = limparNome(req.body.album || "album");
        const artista = limparNome(req.body.artista || "artista");
        const ano = limparNome(req.body.lancamento || "0000");
        const id = req.params.id || Date.now();

        const extensao = path.extname(file.originalname);

        const baseNome = `${album}_${artista}_${ano}_${id}`;

        if (file.fieldname === "capa") {
            return cb(null, `${baseNome}_capa${extensao}`);
        }

        if (!req.contadorGaleria) req.contadorGaleria = 1;

        const numero = req.contadorGaleria++;
        cb(null, `${baseNome}_${numero}${extensao}`);
    }
});

const upload = multer({ storage });

// Tags

const mapaTags = {
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

// Montar disco

function montarDisco(req, id, antigo = {}) {

    return {
        id: id,

        album: req.body.album || "",
        artista: req.body.artista || "",

        lancamento: paraNumero(req.body.lancamento),
        edicao: req.body.edicao || "",

        peso: req.body.peso || "",
        tipo: req.body.tipo || "",

        musicas: paraArrayJSON(req.body.musicas),

        pais: req.body.pais || antigo.pais || "",
        paisFab: req.body.paisFab || antigo.paisFab || "",

        preco: paraNumero(req.body.preco),

        estilo: paraArrayJSON(req.body.estilo),

        resumo: [req.body.resumo || ""],

        capa: req.files?.capa
            ? caminhoPublico(req.files.capa[0].path)
            : (req.body.removerCapa === "true"
                ? null
                : antigo.capa || null),

        galeria: (() => {

            let galeriaAtual = antigo.galeria || [];

            const removidas = paraArrayJSON(req.body.galeriaRemovida);

            if (removidas.length > 0) {
                galeriaAtual = galeriaAtual.filter((img, index) =>
                    !removidas.includes(index)
                );
            }

            if (req.files?.galeria) {
                const novas = req.files.galeria.map(img =>
                    caminhoPublico(img.path)
                );

                galeriaAtual = [...galeriaAtual, ...novas];
            }

            return galeriaAtual;

        })(),

        tags: paraArrayJSON(req.body.tags).map(tag => ({
            nome: tag.nome,
            cor: mapaTags[tag.nome] || ""
        })),

        estoque: paraNumero(req.body.estoque),

        oferta: paraBoolean(req.body.oferta),
        percentualDesconto: paraNumero(req.body.percentualDesconto)
    };
}

// Listar discos

app.get("/discos", (req, res) => {
    try {
        res.json(lerBanco());
    } catch {
        res.status(500).send("Erro ao carregar discos.");
    }
});

// Buscar por ID

app.get("/discos/:id", (req, res) => {

    const discos = lerBanco();

    const disco = discos.find(d =>
        Number(d.id) === Number(req.params.id)
    );

    if (!disco) {
        return res.status(404).send("Disco não encontrado.");
    }

    res.json(disco);
});

// Criar disco

app.post("/discos",

    upload.fields([
        { name: "capa", maxCount: 1 },
        { name: "galeria", maxCount: 10 }
    ]),

    (req, res) => {
        try {

            const discos = lerBanco();

            const novoDisco = montarDisco(
                req,
                Number(req.body.id) || Date.now()
            );

            discos.push(novoDisco);

            salvarBanco(discos);

            res.json({
                mensagem: "Disco salvo com sucesso!",
                disco: novoDisco
            });

        } catch (erro) {
            console.log(erro);
            res.status(500).send("Erro ao salvar disco.");
        }
    }
);

// Editar disco
app.put("/discos/:id",

    upload.fields([
        { name: "capa", maxCount: 1 },
        { name: "galeria", maxCount: 10 }
    ]),

    (req, res) => {
        try {

            const discos = lerBanco();

            const index = discos.findIndex(d =>
                Number(d.id) === Number(req.params.id)
            );

            if (index === -1) {
                return res.status(404).send("Disco não encontrado.");
            }

            discos[index] = montarDisco(
                req,
                Number(req.params.id),
                discos[index]
            );

            salvarBanco(discos);

            res.json({
                mensagem: "Disco atualizado com sucesso!"
            });

        } catch (erro) {
            console.log(erro);
            res.status(500).send("Erro ao atualizar disco.");
        }
    }
);

// Baixar somente estoque após compra
app.patch("/discos/:id/estoque", (req, res) => {
    try {

        const discos = lerBanco();

        const index = discos.findIndex(d =>
            Number(d.id) === Number(req.params.id)
        );

        if (index === -1) {
            return res.status(404).send("Disco não encontrado.");
        }

        const quantidadeVendida = paraNumero(req.body.quantidadeVendida);

        const estoqueAtual = paraNumero(discos[index].estoque);

        discos[index].estoque =
            Math.max(0, estoqueAtual - quantidadeVendida);

        salvarBanco(discos);

        res.json({
            mensagem: "Estoque atualizado com sucesso!",
            estoque: discos[index].estoque
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).send("Erro ao atualizar estoque.");
    }
});

// Excluir disco
app.delete("/discos/:id", (req, res) => {
    try {

        const discos = lerBanco();

        const novaLista = discos.filter(d =>
            Number(d.id) !== Number(req.params.id)
        );

        salvarBanco(novaLista);

        res.json({
            mensagem: "Disco excluído com sucesso!"
        });

    } catch {
        res.status(500).send("Erro ao excluir disco.");
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});