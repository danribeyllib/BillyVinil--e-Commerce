const express = require("express");
const fs = require("fs"); 
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Logs //
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} para ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const caminhoArquivo = path.join(__dirname, "data", "catalogo_discos.json");

// Configuração do Multer //
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });


// Buscar todos os discos //
app.get('/discos', (req, res) => {
    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        if (err) return res.send([]);
        try {
            res.send(JSON.parse(data || "[]"));
        } catch (e) { res.status(500).send("Erro no JSON."); }
    });
});

// Buscar por ID //
app.get('/discos/:id', (req, res) => {
    const idBuscado = req.params.id;
    console.log(`[DEBUG] Tentando encontrar o disco com ID: ${idBuscado}`);

    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        if (err) {
            console.error("[ERRO] Não foi possível ler o arquivo:", err.message);
            return res.status(500).send("Erro ao ler banco de dados.");
        }

        try {
            const discos = JSON.parse(data || "[]");
            
            const disco = discos.find(d => String(d.id) === String(idBuscado));

            if (disco) {
                console.log(`[SUCESSO] Disco encontrado: ${disco.album}`);
                res.json(disco);
            } else {
                console.warn(`[AVISO] Disco ID ${idBuscado} não existe no JSON.`);

                console.log("IDs disponíveis no banco:", discos.map(d => d.id));
                res.status(404).send("Disco não encontrado.");
            }
        } catch (e) {
            console.error("[ERRO] Falha no parse do JSON:", e.message);
            res.status(500).send("Erro interno no servidor.");
        }
    });
});

// Salvar novo disco (POST) //
app.post('/discos', upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), (req, res) => {
    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        let discos = JSON.parse(data || "[]");
        
        const novoDisco = {
            ...req.body,
            id: Date.now().toString(),
            musicas: req.body.musicas ? JSON.parse(req.body.musicas) : [],
            estilo: req.body.estilo ? JSON.parse(req.body.estilo) : [],
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            capa: req.files['capa'] ? req.files['capa'][0].path.replace(/\\/g, '/') : null,
            galeria: req.files['galeria'] ? req.files['galeria'].map(f => f.path.replace(/\\/g, '/')) : []
        };

        discos.push(novoDisco);
        fs.writeFile(caminhoArquivo, JSON.stringify(discos, null, 2), (err) => {
            if (err) return res.status(500).send("Erro ao salvar.");
            res.send({ mensagem: "Disco cadastrado!", disco: novoDisco });
        });
    });
});

// Atualizar disco existente (PUT) //
app.put('/discos/:id', upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), (req, res) => {
    const idParaEditar = req.params.id;

    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        let discos = JSON.parse(data || "[]");
        const index = discos.findIndex(d => d.id.toString() === idParaEditar.toString());

        if (index === -1) return res.status(404).send("Disco não encontrado para edição.");

        // Mantém as imagens antigas  //
        const capaAtual = req.files['capa'] ? req.files['capa'][0].path.replace(/\\/g, '/') : discos[index].capa;
        const galeriaAtual = req.files['galeria'] ? req.files['galeria'].map(f => f.path.replace(/\\/g, '/')) : discos[index].galeria;

        discos[index] = {
            ...req.body,
            id: idParaEditar,
            musicas: req.body.musicas ? JSON.parse(req.body.musicas) : discos[index].musicas,
            estilo: req.body.estilo ? JSON.parse(req.body.estilo) : discos[index].estilo,
            tags: req.body.tags ? JSON.parse(req.body.tags) : discos[index].tags,
            capa: capaAtual,
            galeria: galeriaAtual
        };

        fs.writeFile(caminhoArquivo, JSON.stringify(discos, null, 2), (err) => {
            if (err) return res.status(500).send("Erro ao atualizar.");
            res.send({ mensagem: "Disco atualizado com sucesso!" });
        });
    });
});

// Deletar discos //
app.delete('/discos/:id', (req, res) => {
    const idParaExcluir = req.params.id;
    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erro ao ler arquivo.");
        let discos = JSON.parse(data || "[]");
        const listaFiltrada = discos.filter(d => d.id.toString() !== idParaExcluir.toString());
        
        fs.writeFile(caminhoArquivo, JSON.stringify(listaFiltrada, null, 2), (err) => {
            if (err) return res.status(500).send("Erro ao excluir.");
            res.send({ mensagem: "Excluído com sucesso!" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});