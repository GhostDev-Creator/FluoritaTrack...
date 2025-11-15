const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPHK_St64pT8YZxO__CK571n6f2chr6ZoxHuK9zPlWcpDpeZW-KQzIhneJ8rBeQEprbxgAQ9ycFWXB/pub?output=csv'; 
const STORAGE_KEY = 'aulas_registradas_v1';
const DADOS_USUARIO_KEY = 'usuarioRegistrado'; 

const MOCK_DATA = [
    "Ana Carolina Santos,100,2,3A,1,1,5,0,M2023ANA,Concluido",
    "Bruno Lima Oliveira,100,5,3A,2,3,1,1,M2023BRUNO,Pendente",
    "Carla Pereira Silva,100,1,3B,0,1,2,0,M2023CARLA,Concluido",
    "Daniel Rocha Almeida,100,0,3B,0,0,0,0,M2023DANI,Concluido",
    "Elisa Gomes Ferreira,80,4,2C,3,1,3,0,M2023ELISA,Pendente",
    "Fernanda Costa,80,4,2C,3,1,3,0,M2023FE,Pendente",
    "Gabriel Vaz,80,4,2C,3,1,3,0,M2023GABRIEL,Concluido",
    "Helena Torres Lima,120,6,3A,2,4,0,0,M2023HELE,Pendente",
    "Igor Alves Melo,120,0,3A,0,0,0,0,M2023IGOR,Concluido",
    "Julia Nogueira Cruz,120,10,3B,5,5,1,0,M2023JULIA,Pendente",
    "Kaio Santana Reis,120,1,3B,0,1,0,0,M2023KAIO,Concluido",
    "Larissa Martins Souza,90,3,2C,1,2,2,0,M2023LARI,Pendente",
    "Marcelo Vieira Pires,90,0,2C,0,0,0,0,M2023MARC,Concluido",
];

let alunosCadastrados = []; 
let aulasRegistradas = []; 

function getProfessorLogadoNome() {
    const dadosSalvosJSON = localStorage.getItem(DADOS_USUARIO_KEY);

    if (!dadosSalvosJSON) {
        return "N/A"; 
    }

    try {
        const usuario = JSON.parse(dadosSalvosJSON);
        const nomeCompleto = usuario.nome ? usuario.nome.trim() : '';

        if (!nomeCompleto) {
            return "N/A";
        }

        return `Prof(a) ${nomeCompleto}`;

    } catch (e) {
        console.error("Erro ao analisar dados do usuário no localStorage:", e);
        return "N/A";
    }
}

function loadRegistros() {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error("Erro ao carregar registros do localStorage:", error);
        return [];
    }
}

function saveRegistro(newRegistro) {
    aulasRegistradas.push(newRegistro);
    try {
        const json = JSON.stringify(aulasRegistradas);
        localStorage.setItem(STORAGE_KEY, json);
        console.log(`Registro de aula ID ${newRegistro.aulaId} salvo no localStorage.`);
    } catch (error) {
        console.error("Erro ao salvar registro no localStorage:", error);
        showMessage("ERRO: Falha ao salvar o registro no armazenamento local.", 'error');
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function processCSV(csv) {
    const rows = csv.trim().split('\n');
    const data = [];

    const MIN_COLUMNS = 9; 

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const columns = row.match(/(?:[^,"]+|"[^"]*")+/g) || [];

        if (columns.length < MIN_COLUMNS) continue; 

        const clean = (val) => val ? val.trim().replace(/"/g, '') : '';

        const aluno = clean(columns[0]); 
        const alunoMatricula = clean(columns[8]); 
        const sala = clean(columns[3]) || 'N/A'; 

        if (aluno && alunoMatricula) { 
            data.push({ 
                aluno: aluno, 
                sala: sala,
                id: generateUniqueId(), 
                matricula: alunoMatricula 
            }); 
        }
    }
    return data;
}

function populateSelects(data) {
    const salaSelect = document.getElementById('turma-filter-alunos');

    const salas = [...new Set(data.map(item => item.sala))].sort(); 
    salaSelect.innerHTML = '<option value="">Todas as Turmas</option>'; 
    salas.forEach(sala => {
        const option = document.createElement('option');
        option.value = sala;
        option.textContent = sala;
        salaSelect.appendChild(option);
    });

    document.getElementById('date-from').valueAsDate = new Date();
    document.getElementById('classes-count').value = 1;
}

function marcarTodosComoFalta(markAsPresent = true) {
    const checkboxes = document.querySelectorAll('#registro-table-body input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.checked = !markAsPresent;
    });

    updateFaltasSummary();
}

function showMessage(message, type = 'success') {
    const messageAlert = document.getElementById('registro-feedback');
    messageAlert.textContent = message;

    messageAlert.className = '';

    if (type === 'success') {
        messageAlert.classList.add('alert-success');
    } else if (type === 'error') {
        messageAlert.classList.add('alert-error');
    } else if (type === 'warning') {
        messageAlert.classList.add('alert-warning');
    }

    messageAlert.style.display = 'block';

    setTimeout(() => {
        messageAlert.style.display = 'none';
        messageAlert.textContent = '';
    }, 5000);
}

function clearFiltersAndTable() {
    document.getElementById('turma-filter-alunos').value = '';
    document.getElementById('disciplina').value = '';
    document.getElementById('classes-count').value = 1;

    renderStudentList('');
}

function renderStudentList(filterValue) {
    const tableBody = document.getElementById('registro-table-body');
    const markAllButton = document.getElementById('mark-all-button');

    tableBody.innerHTML = '';

    if (markAllButton) {
        markAllButton.style.display = 'none';
    }

    if (!filterValue) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-medium);">Selecione uma turma no filtro acima.</td></tr>`;
        return;
    }

    const filteredStudents = alunosCadastrados.filter(a => a.sala === filterValue);

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-medium);">Nenhum aluno encontrado para a turma ${filterValue}.</td></tr>`;
        return;
    }

    filteredStudents.forEach((student, index) => {
        const row = tableBody.insertRow();
        row.dataset.studentId = student.id; 
        row.dataset.studentMatricula = student.matricula; 
        row.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td>${student.aluno}</td>
            <td style="text-align: center;">${student.sala}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" checked onchange="updateFaltasSummary()">
                </label>
            </td>
            <td><textarea rows="1" placeholder="Motivo da ausência ou observação..."></textarea></td>
        `;
    });

    if (markAllButton) {
        markAllButton.style.display = 'inline-block';
    }
    updateFaltasSummary();
}

function updateFaltasSummary() {
    const checkboxes = document.querySelectorAll('#registro-table-body input[type="checkbox"]');
    let faltas = 0;

    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            faltas++;
        }
    });

    const total = checkboxes.length;
    const presentes = total - faltas;

    const markAllButton = document.getElementById('mark-all-button');

    if (markAllButton) { 
        if (total > 0) {
            markAllButton.textContent = `Marcar ${presentes} Presente(s) como FALTA`;
            markAllButton.style.display = 'inline-block';
        } else {
            markAllButton.style.display = 'none';
        }
    }
}

function registrarAula() {
    const dataAula = document.getElementById('date-from').value;
    const turma = document.getElementById('turma-filter-alunos').value;
    const disciplina = document.getElementById('disciplina').value.trim();
    const numAulas = parseInt(document.getElementById('classes-count').value); 
    const registerButton = document.getElementById('save-frequency-btn');

    if (!dataAula || !turma || !disciplina || !numAulas || numAulas < 1) {
        showMessage("ERRO: Preencha Data, Turma, Disciplina e Nº de Aulas (mínimo 1).", 'error');
        return; 
    }
    if (document.querySelectorAll('#registro-table-body tr').length === 0 || 
        document.querySelectorAll('#registro-table-body tr td').length === 1) {
        showMessage("AVISO: Não há alunos para registrar. Selecione uma turma válida.", 'warning');
        return; 
    }

    registerButton.disabled = true;
    registerButton.textContent = "Registrando...";

    const nomeProfessor = getProfessorLogadoNome(); 

    const aulaId = generateUniqueId();
    let totalAlunos = 0;
    let totalPresentes = 0;
    let totalFaltas = 0;

    const registroDetalhado = [];
    const rows = document.querySelectorAll('#registro-table-body tr');

    rows.forEach(row => {
        totalAlunos++;
        const alunoId = row.dataset.studentId;
        const alunoMatricula = row.dataset.studentMatricula; 

        if (!alunoId) return;

        const nomeAluno = row.cells[1].textContent;
        const salaAluno = row.cells[2].textContent;
        const isPresente = row.querySelector('input[type="checkbox"]').checked;
        const observacao = row.querySelector('textarea').value.trim();

        const faltasContabilizadas = isPresente ? 0 : numAulas;

        if (isPresente) {
            totalPresentes++;
        } else {
            totalFaltas++; 
        }

        registroDetalhado.push({
            alunoId: alunoId,
            alunoMatricula: alunoMatricula, 
            nome: nomeAluno,
            presenca: isPresente ? "PRESENTE" : "FALTA",
            faltasContabilizadas: faltasContabilizadas, 
            observacao: observacao || ""
        });
    });

    const registroFinal = {
        aulaId: aulaId,
        data: dataAula,
        turma: turma,
        disciplina: disciplina,
        numAulas: numAulas, 
        professor: nomeProfessor, 
        resumo: {
            totalAlunos: totalAlunos,
            alunosPresentes: totalPresentes, 
            alunosFaltantes: totalFaltas 
        },
        detalhes: registroDetalhado
    };

    setTimeout(() => {
        saveRegistro(registroFinal);
        const successMessage = `Aula(s) de ${disciplina} (${turma}) registrada(s) e SALVA NO HISTÓRICO LOCAL! Total de ${totalFaltas} aluno(s) com falta.`;
        showMessage(successMessage, 'success');
        setTimeout(() => {
            marcarTodosComoFalta(false);
            document.querySelectorAll('#registro-table-body textarea').forEach(textarea => textarea.value = '');
            clearFiltersAndTable();
            registerButton.disabled = false;
            registerButton.textContent = "💾 Registrar Aulas e Atualizar Dados";
        }, 500); 
    }, 1000);
}

async function fetchInitialData() {
    let csvText = '';
    const header = "Aluno,Total Aulas,Faltas,Sala,Justificadas,Sem Justificativas,Atrasos,Revisao,Matricula,Status";

    aulasRegistradas = loadRegistros();

    if (SHEET_CSV_URL) {
        try {
            const response = await fetch(SHEET_CSV_URL);
            if (!response.ok) throw new Error(`Status HTTP: ${response.status}`);
            csvText = await response.text();
        } catch (error) {
            console.warn('Falha ao carregar dados remotos. Usando dados mockados.', error.message);
            csvText = [header, ...MOCK_DATA].join('\n');
        }
    } else {
        console.warn('URL CSV não configurada. Usando dados mockados.');
        csvText = [header, ...MOCK_DATA].join('\n');
    }

    alunosCadastrados = processCSV(csvText); 

    if (alunosCadastrados.length === 0) {
        console.error("ERRO: O processamento do CSV não retornou alunos. Verifique o formato.");
        return; 
    }

    populateSelects(alunosCadastrados);

    document.getElementById('turma-filter-alunos').addEventListener('change', (e) => {
        renderStudentList(e.target.value);
    });

    document.getElementById('save-frequency-btn').addEventListener('click', registrarAula);

    const markAllBtn = document.createElement('button');
    markAllBtn.id = "mark-all-button";
    markAllBtn.textContent = "Marcar Todos como FALTA";

    const registroHeader = document.querySelector('.registro-header');
    if (registroHeader) {
        registroHeader.appendChild(markAllBtn);
    }

    document.getElementById('mark-all-button').addEventListener('click', () => marcarTodosComoFalta(true));

    renderStudentList('');
}

document.addEventListener('DOMContentLoaded', fetchInitialData);