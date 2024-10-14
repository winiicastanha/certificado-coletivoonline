const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.use('/certificados', express.static(path.join(__dirname, 'certificados')));
app.use('/curriculos', express.static(path.join(__dirname, 'curriculos')));

async function gerarPDFCertificado(nomeAluno, mes, ano, cpf) {
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

async function gerarPDFCurriculo(dadosCurriculo, cpf) {
    try {
        const html = await ejs.renderFile(path.join(__dirname, 'conteudoCurriculo.ejs'), dadosCurriculo);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {bottom: "20px", top: "60px", right: "20px", left: "60px"},
        });

        await browser.close();


        const filePath = path.join(__dirname, 'curriculos', `${cpf}-curriculo.pdf`);

        if (!fs.existsSync(path.join(__dirname, 'curriculos'))) {
            fs.mkdirSync(path.join(__dirname, 'curriculos'));
        }

        fs.writeFileSync(filePath, pdfBuffer);

        return filePath;

    } catch (error) {
        console.error('Erro ao gerar o PDF do currículo:', error);
        throw error;
    }
}

app.post('/gerar-certificado_v2', async (req, res) => {
    const { nomeAluno, mes, ano, cpf } = req.body;

    if (!nomeAluno || !mes || !ano || !cpf) {
        return res.status(400).send("Parâmetros ausentes");
    }

    try {
        const filePath = await gerarPDFCertificado(nomeAluno, mes, ano, cpf);
        const fileUrl = `${req.protocol}://${req.get('host')}/certificados/${path.basename(filePath)}`;
        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
});


app.post('/gerar-curriculo_v2', async (req, res) => {
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
        const filePath = await gerarPDFCurriculo(dadosCurriculo, cpf);
        const fileUrl = `${req.protocol}://${req.get('host')}/curriculos/${path.basename(filePath)}`;
        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF do currículo:', error);
        res.status(500).send('Erro ao gerar o PDF do currículo');
    }
});

app.listen(3500, () => {
    console.log('Servidor rodando na porta 3500');
});
