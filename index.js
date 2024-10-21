const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./src/routes/routes');

const app = express();
app.use(bodyParser.json());

app.use('/documentos', express.static(path.join(__dirname, 'documentos')));

app.use('/', routes);

app.listen(3500, () => {
    console.log('Servidor rodando na porta 3500');
});