const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const cpf = req.params.cpf;
    const dir = path.resolve('documentos', cpf, 'perfil');

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir); 
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const cpf = req.params.cpf;
    const ext = path.extname(file.originalname);
    const filename = `${cpf}_foto_perfil${ext}`;
    cb(null, filename);
  }
});

// Configurações do upload com limite de tamanho de 5MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Somente arquivos de imagem são permitidos (PNG, JPG, JPEG).'));
    }
    cb(null, true);
  }
});

// Função para o upload da foto de perfil
const uploadFotoPerfil = (req, res) => {
  upload.single('foto')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Verificando se o arquivo foi recebido corretamente
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const cpf = req.params.cpf;
    const ext = path.extname(req.file.originalname);
    const filePath = path.join(__dirname, 'documentos', cpf, 'perfil', `${cpf}_foto_perfil${ext}`);

    const url = `${req.protocol}://${req.get('host')}/documentos/${cpf}/perfil/${cpf}_foto_perfil${ext}`;

    res.status(200).json({
      message: 'Upload realizado com sucesso!',
      url: url
    });
  });
};

module.exports = { upload, uploadFotoPerfil };