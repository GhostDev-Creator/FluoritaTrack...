const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPHK_St64pT8YZxO__CK571n6f2chr6ZoxHuK9zPlWcpDpeZW-KQzIhneJ8rBeQEprbxgAQ9ycFWXB/pub?output=csv'; 
let alunosCadastrados = []; 

const CSV_INDEX_NOME = 0;
const CSV_INDEX_SALA = 3;
const CSV_INDEX_MATRICULA = 8;
const CSV_INDEX_STATUS = 9;

const CSV_INDEX_TOTAL_AULAS = 1; 
const CSV_INDEX_FALTAS = 2; 

async function fetchCSVData() {
    if (!SHEET_CSV_URL || SHEET_CSV_URL === 'SUA_URL_AQUI') {
        console.warn("SHEET_CSV_URL não configurada. Usando dados de demonstração.");
        return ["Aluno,TotalAulas,Faltas,Sala,Justificadas,Sem Justificativas,Atrasos,Revisao,Matricula,Status", 
            "José da Silva,100,8,3A,5,3,1,0,100001,Ativo",
            "Maria Souza,100,20,3B,10,10,2,0,100002,Transferido",
            "Laura Gomes,100,50,2C,50,0,5,0,100003,Atestado",
            "Pedro Alvares,100,2,3A,1,1,0,0,100004,Ativo"
        ].join('\n');
    }

    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error(`Erro na busca: ${response.status}`);
        return await response.text(); 
    } catch (error) {
        console.error("Erro ao buscar CSV da web:", error);
        document.getElementById('alunos-table-body').innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-error);">Falha ao carregar dados.</td></tr>`;
        return null;
    }
}

function processCSV(csv) {
    const rows = csv.trim().split('\n');
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const columns = row.split(','); 
        if (columns.length < 10) continue; 

        const clean = (val) => val ? val.trim().replace(/"/g, '') : '';

        const totalAulas = parseFloat(clean(columns[CSV_INDEX_TOTAL_AULAS])) || 0;
        const faltas = parseFloat(clean(columns[CSV_INDEX_FALTAS])) || 0;

        let frequencia = 0;
        if (totalAulas > 0) {
            frequencia = ((totalAulas - faltas) / totalAulas) * 100;
        }

        data.push({ 
            nome: clean(columns[CSV_INDEX_NOME]), 
            matricula: clean(columns[CSV_INDEX_MATRICULA]) || 'N/A', 
            sala: clean(columns[CSV_INDEX_SALA]) || 'N/A', 
            status: clean(columns[CSV_INDEX_STATUS]) || 'Ativo', 
            frequencia: `${frequencia.toFixed(0)}%`,
            id: clean(columns[CSV_INDEX_MATRICULA])
        });
    }
    return data;
}

function getStatusTagClass(status) {
    switch (status) {
        case 'Ativo':
            return 'status-ativo';
        case 'Transferido':
            return 'status-transferido';
        case 'Atestado':
        case 'Afastado':
            return 'status-afastado';
        case 'Inativo':
            return 'status-inativo';
        default:
            return '';
    }
}

function populateTurmaFilter(data) {
    const turmaSelect = document.getElementById('turma-filter');
    const salas = [...new Set(data.map(item => item.sala))].sort(); 

    turmaSelect.innerHTML = '<option value="">Filtrar por Turma</option>';

    salas.forEach(sala => {
        if (sala !== 'N/A' && sala.trim() !== '') {
            const option = document.createElement('option');
            option.value = sala;
            option.textContent = sala;
            turmaSelect.appendChild(option);
        }
    });
}

function applyFiltersAndRender() {
    const nameFilter = document.getElementById('name-filter').value.toLowerCase().trim();
    const turmaFilter = document.getElementById('turma-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const tableBody = document.getElementById('alunos-table-body');
    const summary = document.getElementById('results-summary');

    tableBody.innerHTML = '';

    let filteredStudents = alunosCadastrados.filter(student => {
        const nameMatch = student.nome.toLowerCase().includes(nameFilter);
        const turmaMatch = !turmaFilter || student.sala === turmaFilter;

        const studentStatus = student.status === 'Atestado' ? 'Afastado' : student.status;
        const filterValue = statusFilter === 'Atestado' ? 'Afastado' : statusFilter; 

        const statusMatch = !statusFilter || studentStatus.toLowerCase() === filterValue.toLowerCase();

        return nameMatch && turmaMatch && statusMatch;
    });

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Nenhum aluno encontrado.</td></tr>`;
        summary.textContent = `0 resultados encontrados.`;
        return;
    }

    filteredStudents.forEach((student) => {
        const row = tableBody.insertRow();

        const displayStatus = student.status === 'Atestado' ? 'Afastado' : student.status;

        row.innerHTML = `
            <td>
                <span class="status-tag ${getStatusTagClass(student.status)}">${displayStatus}</span>
            </td>
            <td>${student.nome}</td>
            <td>${student.matricula}</td>
            <td>${student.sala}</td>
            <td>${student.frequencia}</td>
            `;
    });

    summary.textContent = `${filteredStudents.length} aluno(s) encontrado(s).`;
}

async function initManagement() {
    const csvText = await fetchCSVData();

    if (csvText) {
        alunosCadastrados = processCSV(csvText); 
        populateTurmaFilter(alunosCadastrados);

        document.getElementById('name-filter').addEventListener('input', applyFiltersAndRender);
        document.getElementById('turma-filter').addEventListener('change', applyFiltersAndRender);
        document.getElementById('status-filter').addEventListener('change', applyFiltersAndRender);

        applyFiltersAndRender();
    }
}

document.addEventListener('DOMContentLoaded', initManagement);