const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const { salvarPDF } = require('../utils');

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
        const html = await ejs.renderFile(path.join(__dirname, '../views/conteudoCurriculo.ejs'), dadosCurriculo);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { bottom: "20px", top: "60px", right: "20px", left: "60px" },
        });

        await browser.close();

        const filePath = salvarPDF(cpf, 'curriculo', pdfBuffer);
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