const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { salvarPDF } = require('../utils');

function salvarDadosCurriculo(dados) {
    const dirPath = path.join(__dirname, '../solicitacoes');
    const filePath = path.join(dirPath, 'curriculos.json');
    
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    
    let curriculos = [];
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        curriculos = JSON.parse(data);
    }

    curriculos.push(dados);

    fs.writeFileSync(filePath, JSON.stringify(curriculos, null, 2), 'utf-8');
}

async function gerarPDFCurriculo(req, res) {
    const {
        nomeAluno, dataNascimento, rua, numero, cidade, uf, complemento,
        telefone, telefoneRecado, email, objetivos, caracteristicas, escolaridade,
        experienciaProfissional, formacaoComplementar, trabalhoVoluntario, idiomas, cpf, dataConclusao
    } = req.body;

    if (!nomeAluno || !cpf) {
        return res.status(400).json({ error: "Parâmetros obrigatórios ausentes" });
    }

    function formatArrayToString(array, fields) {
        if (!Array.isArray(array)) return "Sem informações";
        
        return array.map(item => {
            return fields
                .map(field => item[field] || '')
                .filter(value => value && value !== 'null')
                .join(' - ');
        }).join('\n');
    }

    const parsedObjetivos = objetivos.length ? formatArrayToString(objetivos, ['objetivo']) : "Sem informações";
    const parsedCaracteristicas = caracteristicas.length ? formatArrayToString(caracteristicas, ['caracteristica']) : "Sem informações";
    const parsedEscolaridade = escolaridade.length ? formatArrayToString(escolaridade, [
        'nome_escola', 'nome_curso','nivel_escolaridade', 'situacao', 'ano_inicio_escolaridade', 'ano_fim_escolaridade'
    ]) : "Sem informações";
    const parsedExperienciaProfissional = experienciaProfissional.length ? formatArrayToString(experienciaProfissional, [
        'nome_empresa', 'nome_cargo', 'atividade_realizada', 'periodo_inicio', 'periodo_fim'
    ]) : "Sem informações";
    const parsedFormacaoComplementar = formacaoComplementar.length ? formatArrayToString(formacaoComplementar, [
        'nome_instituicao', 'nome_curso', 'data_conclusao'
    ]) : "Sem informações";
    const parsedTrabalhoVoluntario = trabalhoVoluntario.length ? formatArrayToString(trabalhoVoluntario, [
        'nome_empresa_instituicao', 'atividade_realizada', 'periodo'
    ]) : "Sem informações";
    const parsedIdiomas = idiomas.length ? formatArrayToString(idiomas, [
        'idioma', 'fluencia'
    ]) : "Sem informações";

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
        dataConclusao,
        criado_em: new Date().toISOString()
    };

    console.log(dadosCurriculo);
    salvarDadosCurriculo(dadosCurriculo);

    let browser;
    try {
        const html = await ejs.renderFile(path.join(__dirname, '../views/conteudoCurriculo.ejs'), dadosCurriculo);

        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { bottom: "20px", top: "60px", right: "20px", left: "60px" },
        });

        const filePath = salvarPDF(cpf, 'curriculo', pdfBuffer);
        const normalizedPath = path.normalize(filePath);
        const fileUrl = `https://${req.get('host')}/documentos/${cpf}/curriculo/${path.basename(filePath)}`;

        console.log(`Caminho do arquivo salvo: ${normalizedPath}`);
        console.log(`URL do arquivo gerado: ${fileUrl}`);

        return res.json({ url: fileUrl });
    } catch (error) {
        console.error('Erro ao gerar o PDF do currículo:', error);
        return res.status(500).json({ error: 'Erro ao gerar o PDF do currículo' });
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = {
    gerarPDFCurriculo
};