const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

async function gerarPDFCurriculo(req, res) {
    const { nomeAluno, dataNascimento, rua, numero, cidade, uf, complemento, telefone, telefoneRecado, email, objetivos, caracteristicas, escolaridade, experienciaProfissional, formacaoComplementar, trabalhoVoluntario, idiomas, cpf, dataConclusao } = req.body;

    if (!nomeAluno || !cpf) {
        return res.status(400).send("Parâmetros obrigatórios ausentes");
    }

    const dadosCurriculo = {
        nomeAluno,
        dataNascimento,
        rua,
        numero,
        cidade,
        uf,
        complemento,
        telefone,
        telefoneRecado,
        email,
        objetivos,
        caracteristicas,
        escolaridade,
        experienciaProfissional,
        formacaoComplementar,
        trabalhoVoluntario,
        idiomas,
        dataConclusao
    };

    try {
        const html = await ejs.renderFile(path.join(__dirname, '../conteudoCurriculo.ejs'), dadosCurriculo);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {bottom: "20px", top: "60px", right: "20px", left: "60px"},
        });

        await browser.close();

        // Diretório do CPF
        const cpfDir = path.join(__dirname, '../curriculos', cpf);

        // Criar o diretório, se não existir
        if (!fs.existsSync(cpfDir)) {
            fs.mkdirSync(cpfDir, { recursive: true });
        }

        // Caminho completo para o arquivo PDF
        const filePath = path.join(cpfDir, `${cpf}-curriculo.pdf`);
        fs.writeFileSync(filePath, pdfBuffer);

        const fileUrl = `${req.protocol}://${req.get('host')}/curriculos/${cpf}/${path.basename(filePath)}`;
        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF do currículo:', error);
        res.status(500).send('Erro ao gerar o PDF do currículo');
    }
}

module.exports = {
    gerarPDFCurriculo
};