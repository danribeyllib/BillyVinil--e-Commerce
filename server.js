const express = require("express");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Logs
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const caminhoArquivo = path.join(__dirname, "data", "catalogo_discos.json");

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });


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

function montarDisco(req, id, antigo = {}) {
    return {
        id: id,

        album: req.body.album || "",
        artista: req.body.artista || "",

        preco: paraNumero(req.body.preco),
        estoque: paraNumero(req.body.estoque),
        lancamento: paraNumero(req.body.lancamento),
        desconto: paraNumero(req.body.desconto),

        temDesconto: paraBoolean(req.body.temDesconto),

        peso: req.body.peso || "",
        qtdDiscos: req.body.qtdDiscos || "",
        tipo: req.body.tipo || "",

        paisOrigem: req.body.paisOrigem || "",
        paisFab: req.body.paisFab || "",

        edicao: req.body.edicao || "",
        resumo: req.body.resumo || "",

        musicas: paraArrayJSON(req.body.musicas),
        estilo: paraArrayJSON(req.body.estilo),

        tags: paraArrayJSON(req.body.tags)
            .filter(tag => tag.nome)
            .map(tag => ({
                nome: tag.nome,
                classe: mapaTags[tag.nome] || ""
            })),

        capa: req.files?.capa
            ? req.files.capa[0].path.replace(/\\/g, "/")
            : antigo.capa || null,

        galeria: req.files?.galeria
            ? req.files.galeria.map(img => img.path.replace(/\\/g, "/"))
            : antigo.galeria || []
    };
}

// Buscar todos os Discos

app.get("/discos", (req, res) => {
    try {
        res.json(lerBanco());
    } catch {
        res.status(500).send("Erro ao carregar discos.");
    }
});

// Buscar disco por ID

app.get("/discos/:id", (req, res) => {
    const discos = lerBanco();

    const disco = discos.find(d =>
        String(d.id) === String(req.params.id)
    );

    if (!disco) {
        return res.status(404).send("Disco não encontrado.");
    }

    res.json(disco);
});

// Salvar Novo Disco

app.post("/discos",
    upload.fields([
        { name: "capa", maxCount: 1 },
        { name: "galeria", maxCount: 10 }
    ]),
    (req, res) => {
        try {
            const discos = lerBanco();

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

            const novoDisco = montarDisco(
                req,
                Date.now().toString()
            );

            discos.push(novoDisco);

            salvarBanco(discos);

            res.json({
                mensagem: "Disco salvo com sucesso!",
                disco: novoDisco
            });

        } catch {
            res.status(500).send("Erro ao salvar disco.");
        }
    });

// Atualizar disco

app.put("/discos/:id",
    upload.fields([
        { name: "capa", maxCount: 1 },
        { name: "galeria", maxCount: 10 }
    ]),
    (req, res) => {
        try {
            const discos = lerBanco();

            const index = discos.findIndex(d =>
                String(d.id) === String(req.params.id)
            );

            if (index === -1) {
                return res.status(404).send("Disco não encontrado.");
            }

            discos[index] = montarDisco(
                req,
                req.params.id,
                discos[index]
            );

            salvarBanco(discos);

            res.json({
                mensagem: "Disco atualizado com sucesso!"
            });

        } catch {
            res.status(500).send("Erro ao atualizar disco.");
        }
    });

// Excluir disco

app.delete("/discos/:id", (req, res) => {
    try {
        const discos = lerBanco();

        const novaLista = discos.filter(d =>
            String(d.id) !== String(req.params.id)
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