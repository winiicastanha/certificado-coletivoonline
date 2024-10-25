const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./src/routes/routes');
const cors = require('cors');

const app = express();

// Permite CORS para todas as origens
app.use(cors());

app.use(bodyParser.json());

// Servir arquivos estáticos da pasta 'documentos'
app.use('/documentos', express.static(path.join(__dirname, 'documentos')));

// Usar as rotas configuradas no arquivo routes.js
app.use('/', routes);

// Iniciar o servidor na porta 3500
app.listen(3500, () => {
    console.log('Servidor rodando na porta 3500');
});