const path = require('path');
const fs = require('fs');

function salvarPDF(cpf, tipo, pdfBuffer) {
  const dirBasePath = path.join(__dirname, `../documentos/${cpf}`);
  const dirPath = path.join(__dirname, `../documentos/${cpf}/${tipo}`);
  console.log(dirBasePath);
  if (!fs.existsSync(dirBasePath)) {
    fs.mkdirSync(dirBasePath, { recursive: true });
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${cpf}-${tipo}.pdf`);

  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Arquivo salvo em: ${filePath}`);
  return filePath;
}

module.exports = {
  salvarPDF,
};
