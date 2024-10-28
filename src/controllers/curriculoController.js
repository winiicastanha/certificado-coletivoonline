const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs'); // Módulo para manipular arquivos
const { salvarPDF } = require('../utils');

// Função para salvar os dados do currículo em um arquivo JSON
function salvarDadosCurriculo(dados) {
    const dirPath = path.join(__dirname, '../solicitacoes');
    const filePath = path.join(dirPath, 'curriculos.json');
    
    // Verifica se o diretório 'data' existe, caso contrário, cria o diretório
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Carrega os dados atuais do arquivo, caso ele exista
    let curriculos = [];
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        curriculos = JSON.parse(data);
    }

    // Adiciona o novo currículo aos dados
    curriculos.push(dados);

    // Salva o arquivo atualizado
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

    function manualParseArrayString(arrayString) {
        if (typeof arrayString !== 'string') return "Sem informações";

        try {
            const items = arrayString
                .replace(/^\[|\]$/g, '')
                .split(/},\s*{/)
                .map(item => {
                    const obj = {};
                    item.replace(/(\w+):\s*([^,}]+)/g, (match, key, value) => {
                        obj[key.trim()] = value.replace(/null/g, "").trim();
                    });
                    return obj;
                });
            return items;
        } catch (error) {
            console.error("Erro ao converter manualmente a string para array:", error);
            return "Sem informações";
        }
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

    // Processando os dados do currículo
    const parsedObjetivos = objetivos && objetivos !== "[]" ? formatArrayToString(manualParseArrayString(objetivos), ['objetivo']) : "Sem informações";
    const parsedCaracteristicas = caracteristicas && caracteristicas !== "[]" ? formatArrayToString(manualParseArrayString(caracteristicas), ['caracteristica']) : "Sem informações";
    const parsedEscolaridade = escolaridade && escolaridade !== "[]" ? formatArrayToString(manualParseArrayString(escolaridade), [
        'nome_escola', 'nome_curso','nivel_escolaridade', 'situacao', 'ano_inicio_escolaridade', 'ano_fim_escolaridade'
    ]) : "Sem informações";
    const parsedExperienciaProfissional = experienciaProfissional && experienciaProfissional !== "[]" ? formatArrayToString(manualParseArrayString(experienciaProfissional), [
        'nome_empresa', 'nome_cargo', 'atividade_realizada', 'periodo_inicio', 'periodo_fim'
    ]) : "Sem informações";
    const parsedFormacaoComplementar = formacaoComplementar && formacaoComplementar !== "[]" ? formatArrayToString(manualParseArrayString(formacaoComplementar), [
        'nome_instituicao', 'nome_curso', 'data_conclusao'
    ]) : "Sem informações";
    const parsedTrabalhoVoluntario = trabalhoVoluntario && trabalhoVoluntario !== "[]" ? formatArrayToString(manualParseArrayString(trabalhoVoluntario), [
        'nome_empresa_instituicao', 'atividade_realizada', 'periodo'
    ]) : "Sem informações";
    const parsedIdiomas = idiomas && idiomas !== "[]" ? formatArrayToString(manualParseArrayString(idiomas), [
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
        objetivos: Array.isArray(parsedObjetivos) ? parsedObjetivos.join('<br>') : parsedObjetivos,  
        caracteristicas: Array.isArray(parsedCaracteristicas) ? parsedCaracteristicas.join('<br>') : parsedCaracteristicas,  
        escolaridade: Array.isArray(parsedEscolaridade) ? parsedEscolaridade.join('<br>') : parsedEscolaridade, 
        experienciaProfissional: Array.isArray(parsedExperienciaProfissional) ? parsedExperienciaProfissional.join('<br>') : parsedExperienciaProfissional,
        formacaoComplementar: Array.isArray(parsedFormacaoComplementar) ? parsedFormacaoComplementar.join('<br>') : parsedFormacaoComplementar,
        trabalhoVoluntario: Array.isArray(parsedTrabalhoVoluntario) ? parsedTrabalhoVoluntario.join('<br>') : parsedTrabalhoVoluntario,
        idiomas: Array.isArray(parsedIdiomas) ? parsedIdiomas.join('<br>') : parsedIdiomas,
        dataConclusao,
        criado_em: new Date().toISOString()
    };    

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