const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const { salvarPDF } = require('../utils');

async function gerarPDFCertificado(req, res) {
    const { nomeAluno, mes, ano, cpf } = req.body;

    if (!nomeAluno || !mes || !ano || !cpf) {
        return res.status(400).send("Parâmetros ausentes");
    }

    try {
        const html = await ejs.renderFile(path.join(__dirname, '../views/conteudoCertificado.ejs'), {
            nomeAluno, mes, ano
        });

        browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            pageRanges: '1',
        });

        await browser.close();

        // Defina o caminho do arquivo corretamente
        const filePath = salvarPDF(cpf, 'certificado', pdfBuffer);
        const fileUrl = `https://${req.get('host')}/documentos/${cpf}/certificado/${path.basename(filePath)}`;
        
        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        res.status(500).send('Erro ao gerar o PDF');
    }
}

module.exports = {
    gerarPDFCertificado
};