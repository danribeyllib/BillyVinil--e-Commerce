const express = require("express");
const fs = require("fs"); // file system //
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//logs//
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} para ${req.url}`);
    next();
});

// Tornar a pasta de uploads acessível //
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const caminhoArquivo = path.join(__dirname, "data", "catalogo_discos.json");

console.log("Local JSON:", caminhoArquivo);

// Configuração do Multer (salvar as imagens) //
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
       
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Criar pasta se não existir //
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Nome único para o arquivo //
    }
});

const upload = multer({ storage: storage });

// Rota para buscar todos os discos (GET) //
app.get('/discos', (req, res) => {
    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
       
        if (err) {
            console.error("Erro ao abrir o arquivo na pasta data:", err.message);
            return res.send([]);
        }
        try {
            res.send(JSON.parse(data || "[]"));
        } catch (parseErr) {
            console.error("Erro de sintaxe no JSON dentro de /data/ (verifique vírgulas):", parseErr.message);
            res.status(500).send("Erro no formato do arquivo JSON.");
        }
    });
});

// Salvar um novo disco ou atualizar (POST) //
app.post('/discos', upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), (req, res) => {

    console.log("Novo upload");
    console.log("Dados do formulário:", req.body.album, "por", req.body.artista);
    console.log("Capa recebida:", req.files['capa'] ? "Sim" : "Não");
    console.log("Total fotos na galeria:", req.files['galeria'] ? req.files['galeria'].length : 0);
    
    fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
       
        let discos = [];
        try {
            discos = JSON.parse(data || "[]");
        } catch (e) {
            discos = [];
        }
        
        // Objeto do disco + imgs //
        const novoDisco = {
            id: req.body.id || Date.now().toString(), // Gerar ID novo //
            album: req.body.album,
            artista: req.body.artista,
            lancamento: req.body.lancamento,
            estoque: req.body.estoque,
            desconto: req.body.desconto,
            descricao: req.body.descricao,
            tipo: req.body.tipo,
            paisOrigem: req.body.paisOrigem,
            paisFab: req.body.paisFab,
            preco: req.body.preco,
            edicao: req.body.edicao,
            musicas: req.body.musicas,
            resumo: req.body.resumo,
            capa: req.files['capa'] ? req.files['capa'][0].path.replace(/\\/g, '/') : null,
            galeria: req.files['galeria'] ? req.files['galeria'].map(f => f.path.replace(/\\/g, '/')) : []
        };

        const index = discos.findIndex(d => d.id === novoDisco.id);
      
        if (index !== -1) {
            discos[index] = novoDisco; // Atualizar //
        } else {
            discos.push(novoDisco); // Adicionar novo //
        }

        fs.writeFile(caminhoArquivo, JSON.stringify(discos, null, 2), (err) => {
            if (err) return res.status(500).send("Erro ao salvar.");
            res.send({ mensagem: "Estoque atualizado com sucesso!", disco: novoDisco });
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

// Servidor - port //
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});