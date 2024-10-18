const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');

const app = express();
app.use(bodyParser.json());

app.use('/certificados', express.static(path.join(__dirname, 'certificados')));
app.use('/curriculos', express.static(path.join(__dirname, 'curriculos')));

app.use('/', routes);

app.listen(3500, () => {
    console.log('Servidor rodando na porta 3500');
});