/*
  Servidor mínimo em Node.js + Express para o Portal Acadêmico

  Funcionalidades:
  - Servir os arquivos estáticos do frontend (index.html, CSS, JS)
  - Fornecer endpoint GET /api/alunos para retornar o conteúdo de JSON/alunos.json
  - Fornecer endpoint POST /api/salvar-alunos para gravar o array de alunos no arquivo JSON

  Observações importantes:
  - Este servidor é apenas para uso local/educacional. Em produção, adicionar autenticação
    e validação de entrada para evitar corrupção de dados.
  - A gravação utiliza fs.writeFileSync para simplicidade; em produção prefira operações assíncronas
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// --- Middleware ---
// Habilita CORS para permitir chamadas do frontend local
app.use(cors());
// Habilita parsing de JSON no body das requisições
app.use(express.json());
// Servir arquivos estáticos (HTML/CSS/JS) a partir do diretório do projeto
app.use(express.static(path.join(__dirname)));

// Caminho do arquivo JSON que armazena os alunos
const alunosPath = path.join(__dirname, 'JSON', 'alunos.json');

// --- Endpoints ---
// GET /api/alunos
// Lê o arquivo JSON e retorna o array de alunos. Em caso de erro, retorna 500.
app.get('/api/alunos', (req, res) => {
    try {
        const dados = fs.readFileSync(alunosPath, 'utf-8');
        const alunos = JSON.parse(dados);
        res.json(alunos);
    } catch (erro) {
        // Erro ao ler/parsear o arquivo
        res.status(500).json({ erro: 'Não foi possível carregar os alunos.' });
    }
});

// POST /api/salvar-alunos
// Substitui o conteúdo de alunos.json pelo array recebido no body.
// Retorna sucesso ou erro dependendo do resultado da gravação.
app.post('/api/salvar-alunos', (req, res) => {
    try {
        const alunos = req.body;
        // Grava com identação para fácil leitura
        fs.writeFileSync(alunosPath, JSON.stringify(alunos, null, 4));
        res.json({ sucesso: true, mensagem: 'Alunos salvos com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, erro: 'Erro ao salvar alunos.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
    console.log('✓ Portal Acadêmico disponível em http://localhost:3000');
});
