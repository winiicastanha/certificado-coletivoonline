const express = require('express');
const path = require('path');
const fs = require('fs');
const certificadoController = require('../controllers/certificadoController');
const curriculoController = require('../controllers/curriculoController');
const uploadFotoPerfil = require('../controllers/uploadFotoController');

const router = express.Router();

router.post('/upload/foto/:cpf', uploadFotoPerfil.uploadFotoPerfil);

router.post('/gerar-certificado_v2', certificadoController.gerarPDFCertificado);

router.post('/gerar-curriculo_v2', curriculoController.gerarPDFCurriculo);

router.get('/certificado/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  const filePath = path.join(
    __dirname,
    '../../documentos',
    cpf,
    'certificado',
    `${cpf}-certificado.pdf`
  );
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Certificado não encontrado');
  }
});

router.get('/curriculo/:cpf', (req, res) => {
  const cpf = req.params.cpf;
  const filePath = path.join(
    __dirname,
    '../../documentos',
    cpf,
    'curriculo',
    `${cpf}-curriculo.pdf`
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Currículo não encontrado');
  }
});

module.exports = router;
