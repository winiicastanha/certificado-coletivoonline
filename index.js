const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.use('/certificados', express.static(path.join(__dirname, 'certificados')));

async function gerarPDF(nomeAluno, mes, ano, cpf) {
    try {
        const html = await ejs.renderFile(path.join(__dirname, 'conteudoCertificado.ejs'), {
            nomeAluno, mes, ano
        });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            pageRanges: '1',
        });

        await browser.close();

        const filePath = path.join(__dirname, 'certificados', `${cpf}-certificado.pdf`);

        if (!fs.existsSync(path.join(__dirname, 'certificados'))) {
            fs.mkdirSync(path.join(__dirname, 'certificados'));
        }

        fs.writeFileSync(filePath, pdfBuffer);

        return filePath;

    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        throw error;
    }
}

app.post('/gerar-certificado', async (req, res) => {
    const { nomeAluno, mes, ano, cpf } = req.body;

    if (!nomeAluno || !mes || !ano || !cpf) {
        return res.status(400).send("Parâmetros ausentes");
    }

    try {
        const filePath = await gerarPDF(nomeAluno, mes, ano, cpf);

        const fileUrl = `${req.protocol}://${req.get('host')}/certificados/${path.basename(filePath)}`;

        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
});

app.listen(3500, () => {
    console.log('Servidor rodando na porta 3000');
});