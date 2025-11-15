const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbh4Z8rKLCkrztmWujHf47RGBChoCmnNfQQc0SbABC8O6cr1GXEDTazjqMnpJIf3ZHtYcyHnFSXqcp/pub?output=csv';
const CHAVE_CADASTROS = 'funcionariosCadastrados';
const CHAVE_USUARIO_LOGADO = 'usuarioRegistrado'; 

const MOCK_CSV_DATA = [
    { 
        "CPF": "12345678900", 
        "ID-FUNCIONARIO": "A100",
        "NOME": "Ana Silva", 
        "DATA DE NASCIMENTO": "1990-05-15", 
        "CIDADE": "Sao_Paulo", 
        "ESTADO": "SP", 
        "EMAIL-EMPRESA": "ana.silva@empresa.com",
        "TELEFONE": "5511987654321"
    },
    { 
        "CPF": "98765432100", 
        "ID-FUNCIONARIO": "B200", 
        "NOME": "Bruno Costa", 
        "DATA DE NASCIMENTO": "1985-11-20", 
        "CIDADE": "Rio_de_Janeiro", 
        "ESTADO": "RJ", 
        "EMAIL-EMPRESA": "bruno.costa@empresa.com",
        "TELEFONE": ""
    }
];

function parseCSV(text) {
    const [headerLine, ...dataLines] = text.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = dataLines.map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
    return data.filter(obj => obj.CPF && obj['ID-FUNCIONARIO']);
}

async function carregarDadosCSV() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error("Erro ao buscar CSV.");
        const csvText = await response.text();
        const dadosWeb = parseCSV(csvText);
        
        if (dadosWeb.length > 0) return dadosWeb;
        throw new Error("CSV da web está vazio.");
    } catch (error) {
        console.warn("Falha ao carregar dados da web. Usando DADOS MOCK.", error);
        return MOCK_CSV_DATA;
    }
}

function prepararNovoRegistro(csvData, senha) {
    const novoObj = {
        cpf: csvData.CPF,
        matricula: csvData['ID-FUNCIONARIO'],
        senha: senha,
        nome: csvData.NOME?.replace(/_/g, ' ') || '',
        email: csvData['EMAIL-EMPRESA'] || '',
        localizacao: `${csvData.CIDADE?.replace(/_/g, ' ') || ''} - ${csvData.ESTADO || ''}`,
        nascimento: csvData['DATA DE NASCIMENTO'] || '',
        telefone: csvData.TELEFONE || '', 
        fotoPerfil: ''
    };
    return novoObj;
}

document.addEventListener('DOMContentLoaded', function(){
    const formRedefinir = document.getElementById('formulario');
    const mensagemAlerta = document.getElementById('mensagem');
    const CPF_LENGTH = 11; 

    if(formRedefinir) {
        formRedefinir.addEventListener('submit', function(event) {
            event.preventDefault();

            mensagemAlerta.textContent = '';

            const cpfDigitado = document.getElementById('cpf').value.trim().replace(/[^0-9]/g, '');

            if (cpfDigitado.length !== CPF_LENGTH) {
                mensagemAlerta.textContent = `O CPF deve conter exatamente ${CPF_LENGTH} dígitos numéricos.`;
                mensagemAlerta.style.color = 'red';
                return;
            }

            const cadastrosExistentes = JSON.parse(localStorage.getItem(CHAVE_CADASTROS) || '[]');
            
            const usuarioEncontrado = cadastrosExistentes.find(f => f.cpf === cpfDigitado);

            if(usuarioEncontrado){
                localStorage.setItem('cpfParaRedefinicao', cpfDigitado);
                
                mensagemAlerta.textContent = '✅ CPF verificado! Redirecionando para redefinir...';
                mensagemAlerta.style.color = 'green';
                
                setTimeout(() => {
                    window.location.href = 'redefinir-senha.html';
                }, 1000); 
            } else {
                mensagemAlerta.textContent = '❌ CPF não encontrado. Por favor, verifique e tente novamente.';
                mensagemAlerta.style.color = 'red';
            }
        })
    }
});