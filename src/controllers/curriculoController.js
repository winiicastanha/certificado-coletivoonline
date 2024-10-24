const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const { salvarPDF } = require('../utils');

async function gerarPDFCurriculo(req, res) {
    const {
        nomeAluno, dataNascimento, rua, numero, cidade, uf, complemento,
        telefone, telefoneRecado, email, objetivos, caracteristicas, escolaridade,
        experienciaProfissional, formacaoComplementar, trabalhoVoluntario, idiomas, cpf, dataConclusao
    } = req.body;

    // Validação de parâmetros obrigatórios
    if (!nomeAluno || !cpf) {
        return res.status(400).json({ error: "Parâmetros obrigatórios ausentes" });
    }

    // Função para converter strings JSON em arrays reais
    function parseStringToArray(str) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error(`Erro ao converter string para array: ${str}`, error);
            return [];
        }
    }

    // Convertendo strings para arrays
    const parsedObjetivos = parseStringToArray(objetivos);
    const parsedCaracteristicas = parseStringToArray(caracteristicas);
    const parsedEscolaridade = parseStringToArray(escolaridade);
    const parsedExperienciaProfissional = parseStringToArray(experienciaProfissional);
    const parsedFormacaoComplementar = parseStringToArray(formacaoComplementar);
    const parsedTrabalhoVoluntario = parseStringToArray(trabalhoVoluntario);
    const parsedIdiomas = parseStringToArray(idiomas);

    // Preparando dados para o PDF
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
        objetivos: parsedObjetivos,
        caracteristicas: parsedCaracteristicas,
        escolaridade: parsedEscolaridade,
        experienciaProfissional: parsedExperienciaProfissional,
        formacaoComplementar: parsedFormacaoComplementar,
        trabalhoVoluntario: parsedTrabalhoVoluntario,
        idiomas: parsedIdiomas,
        dataConclusao
    };

    try {
        // Renderizando o template EJS com os dados
        const html = await ejs.renderFile(path.join(__dirname, '../views/conteudoCurriculo.ejs'), dadosCurriculo);

        // Configurando Puppeteer para gerar o PDF
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Gerando o PDF com margens e fundo de página
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { bottom: "20px", top: "60px", right: "20px", left: "60px" },
        });

        await browser.close();

        // Salvando o PDF e retornando o caminho
        const filePath = salvarPDF(cpf, 'curriculo', pdfBuffer);
        const normalizedPath = path.normalize(filePath); // Normaliza o caminho
        // Ajuste para refletir o caminho correto com a subpasta curriculo
        const fileUrl = `${req.protocol === 'http' ? 'https' : req.protocol}://${req.get('host')}/documentos/${cpf}/curriculo/${path.basename(normalizedPath)}`;

        console.log(`Caminho do arquivo salvo: ${normalizedPath}`);
        console.log(`URL do arquivo gerado: ${fileUrl}`);

        return res.json({ url: fileUrl });

    } catch (error) {
        console.error('Erro ao gerar o PDF do currículo:', error);
        return res.status(500).json({ error: 'Erro ao gerar o PDF do currículo' });
    }
}

module.exports = {
    gerarPDFCurriculo
};