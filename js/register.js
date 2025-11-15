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


document.addEventListener('DOMContentLoaded', async function() {
    const dadosCSV = await carregarDadosCSV();
    const formulario = document.getElementById('formulario');
    const matriculaInput = document.getElementById('mf');
    const senhaInput = document.getElementById('senha');
    const cpfInput = document.getElementById('cpf');
    const mensagemElement = document.getElementById('mensagem');

    const MIN_MF_LENGTH = 8;
    const MAX_MF_LENGTH = 14;
    const CPF_LENGTH = 11; 
    const MIN_PASSWORD_LENGTH = 8;
    const regexSenha = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{${MIN_PASSWORD_LENGTH},}$`);
    
    const toggleIconContainers = document.querySelectorAll('.toggle-password-icons');
    function togglePasswordVisibility(event) {
        const container = event.currentTarget; 
        const targetId = container.getAttribute('data-target'); 
        const passwordInput = document.getElementById(targetId);
        if (!passwordInput) return;
        const iconShow = container.querySelector('[data-action="show"]');
        const iconHide = container.querySelector('[data-action="hide"]');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            iconShow.classList.replace('visible', 'hidden');
            iconHide.classList.replace('hidden', 'visible');
        } else {
            passwordInput.type = 'password';
            iconShow.classList.replace('hidden', 'visible');
            iconHide.classList.replace('visible', 'hidden');
        }
    }
    toggleIconContainers.forEach(container => {
        container.addEventListener('click', togglePasswordVisibility);
        container.querySelector('[data-action="hide"]').classList.add('hidden');
    });
    
    
    if (formulario) {
        formulario.addEventListener('submit', function(evento) {
            evento.preventDefault(); 
            
            mensagemElement.textContent = '';
            mensagemElement.style.color = 'black';

            const matricula = matriculaInput.value.trim();
            const senha = senhaInput.value;
            const cpf = cpfInput.value.replace(/[^0-9]/g, '');

            if (!cpf || !matricula || !senha) {
                mensagemElement.textContent = 'Por favor, preencha o CPF, matrícula e a senha.';
                mensagemElement.style.color = 'orange';
                return;
            }
            if (cpf.length !== CPF_LENGTH) {
                mensagemElement.textContent = `O CPF deve conter exatamente ${CPF_LENGTH} dígitos numéricos.`;
                mensagemElement.style.color = 'red';
                return;
            }
            if (matricula.length < MIN_MF_LENGTH || matricula.length > MAX_MF_LENGTH) {
                mensagemElement.textContent = `A Matrícula deve ter entre ${MIN_MF_LENGTH} e ${MAX_MF_LENGTH} dígitos.`;
                mensagemElement.style.color = 'red';
                return;
            }
            if (!regexSenha.test(senha)) {
                mensagemElement.textContent = `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres, incluindo letra maiúscula, minúscula e um número.`;
                mensagemElement.style.color = 'red';
                return;
            }

            const funcionarioCSV = dadosCSV.find(f => 
                f.CPF === cpf && f['ID-FUNCIONARIO'] === matricula
            );

            if (!funcionarioCSV) {
                mensagemElement.textContent = '❌ Erro: Dados não encontrados na base da empresa. Verifique CPF e Matrícula.';
                mensagemElement.style.color = 'red';
                return;
            }
            
            const cadastrosExistentes = JSON.parse(localStorage.getItem(CHAVE_CADASTROS) || '[]');
            const jaRegistrado = cadastrosExistentes.some(f => f.cpf === cpf);

            if (jaRegistrado) {
                 mensagemElement.textContent = '⚠️ Este funcionário já possui um cadastro local. Redirecionando para Login...';
                 mensagemElement.style.color = 'orange';
                 setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                 return;
            }

            const novoRegistro = prepararNovoRegistro(funcionarioCSV, senha);

            cadastrosExistentes.push(novoRegistro);
            localStorage.setItem(CHAVE_CADASTROS, JSON.stringify(cadastrosExistentes));
            
            mensagemElement.textContent = '✅ Cadastro concluído! Redirecionando para Acessar Conta...';
            mensagemElement.style.color = 'green';
            
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 1500);
        });
    }
});