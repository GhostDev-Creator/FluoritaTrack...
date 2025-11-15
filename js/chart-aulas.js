const AULAS_STORAGE_KEY = 'aulas_registradas_v1'; 
const DADOS_USUARIO_KEY = 'usuarioRegistrado'; 
const AVAILABLE_TURMAS = ['1IDS-SEDUC-A', '1IDS-SEDUC-B']; 

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

function getAulas() {
    const aulasJson = localStorage.getItem(AULAS_STORAGE_KEY);
    return aulasJson ? JSON.parse(aulasJson) : [];
}

function saveAulas(aulas) {
    localStorage.setItem(AULAS_STORAGE_KEY, JSON.stringify(aulas));
}

function populateTurmaFiltersAndSelects() {
    const turmaFilter = document.getElementById('turma-filter-aulas');
    const editTurma = document.getElementById('edit-turma');

    if (turmaFilter) turmaFilter.innerHTML = '<option value="">Filtrar por Turma</option>';
    if (editTurma) editTurma.innerHTML = '';

    AVAILABLE_TURMAS.forEach(turma => {
        if (turmaFilter) {
            const filterOption = document.createElement('option');
            filterOption.value = turma;
            filterOption.textContent = turma;
            turmaFilter.appendChild(filterOption);
        }

        if (editTurma) {
            const editOption = document.createElement('option');
            editOption.value = turma;
            editOption.textContent = turma;
            editTurma.appendChild(editOption);
        }
    });
}

function getStatusTagClass(status) {
    switch (status) {
        case 'Concluída':
            return 'status-concluida';
        case 'Agendada':
            return 'status-agendada';
        case 'Cancelada':
            return 'status-cancelada';
        default:
            return 'status-concluida'; 
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function applyFiltersAndRender() {
    const aulas = getAulas(); 
    const tableBody = document.getElementById('aulas-table-body');
    tableBody.innerHTML = ''; 

    const filterTextElement = document.getElementById('filter-text');
    const filterTurmaElement = document.getElementById('turma-filter-aulas');

    const filterText = filterTextElement ? filterTextElement.value.toLowerCase().trim() : '';
    const filterTurma = filterTurmaElement ? filterTurmaElement.value : '';

    let filteredAulas = aulas.filter(aula => {
        const aulaProfessor = aula.professor || 'n/a'; 

        const textMatch = 
            aula.disciplina.toLowerCase().includes(filterText) ||
            aulaProfessor.toLowerCase().includes(filterText);

        const turmaMatch = !filterTurma || aula.turma === filterTurma;

        return textMatch && turmaMatch;
    });

    if (filteredAulas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">Nenhuma aula registrada encontrada.</td></tr>`;
        return;
    }

    filteredAulas.sort((a, b) => new Date(b.data) - new Date(a.data));

    filteredAulas.forEach(aula => {
        const row = tableBody.insertRow();
        const statusClass = getStatusTagClass(aula.status || 'Concluída');
        const professorNome = aula.professor || 'N/A'; 

        row.innerHTML = `
            <td>${aula.turma}</td>
            <td>${aula.data}</td>
            <td>${aula.disciplina} (${aula.numAulas} aula(s))</td>
            <td>${professorNome}</td>
            <td>
                <span class="status-tag ${statusClass}">${aula.status || 'Concluída'}</span>
            </td>
            <td class="action-btns">
                <button class="btn-icon" onclick="viewAula('${aula.aulaId}')" title="Visualizar Frequência"><i class="ri-eye-line"></i></button>
                <button class="btn-icon" onclick="openEditModal('${aula.aulaId}')" title="Editar Aula"><i class="ri-pencil-line"></i></button>
                <button class="btn-icon" onclick="confirmDeleteAula('${aula.aulaId}')" title="Excluir Aula"><i class="ri-delete-bin-line"></i></button>
            </td>
        `;
    });
}

window.openEditModal = function(id) {
    const aulas = getAulas();
    const aula = aulas.find(a => a.aulaId === id); 

    if (aula) {
        document.getElementById('edit-aula-id').value = aula.aulaId;
        document.getElementById('edit-turma').value = aula.turma;
        document.getElementById('edit-disciplina').value = aula.disciplina;
        document.getElementById('edit-professor').value = aula.professor || getProfessorLogadoNome(); 
        document.getElementById('edit-data').value = aula.data; 
        document.getElementById('edit-status').value = aula.status || 'Concluída'; 
        openModal('editModal');
    } else {
        alert("Aula não encontrada!");
    }
}

window.saveAula = function() {
    const id = document.getElementById('edit-aula-id').value;

    const turma = document.getElementById('edit-turma').value;
    const disciplina = document.getElementById('edit-disciplina').value.trim();
    const professor = document.getElementById('edit-professor').value.trim();
    const data = document.getElementById('edit-data').value;
    const status = document.getElementById('edit-status').value;

    if (!turma || !disciplina || !data || !status) {
        alert("Preencha Turma, Disciplina, Data e Status!");
        return;
    }

    let aulas = getAulas();
    const index = aulas.findIndex(a => a.aulaId === id); 

    if (index !== -1) {
        aulas[index] = { 
            ...aulas[index], 
            turma, 
            disciplina, 
            professor, 
            data, 
            status 
        };
        saveAulas(aulas);
        closeModal('editModal');
        applyFiltersAndRender();
        alert("Aula atualizada com sucesso!");
    }
}

window.confirmDeleteAula = function(id) {
    if (confirm("Tem certeza que deseja excluir esta aula?")) {
        deleteAula(id);
    }
}

function deleteAula(id) {
    let aulas = getAulas();
    aulas = aulas.filter(aula => aula.aulaId !== id); 
    saveAulas(aulas);
    applyFiltersAndRender();
    alert("Aula excluída com sucesso!");
}

window.viewAula = function(id) {
    const aulas = getAulas();
    const aula = aulas.find(a => a.aulaId === id); 
    const frequenciaListBody = document.getElementById('frequencia-list');
    frequenciaListBody.innerHTML = '';

    if (!aula) {
        alert("Aula não encontrada!");
        return;
    }

    document.getElementById('view-turma').textContent = aula.turma;
    document.getElementById('view-disciplina').textContent = aula.disciplina;
    document.getElementById('view-data').textContent = aula.data;
    document.getElementById('view-professor').textContent = aula.professor || 'N/A'; 

    const registroDetalhado = aula.detalhes || []; 

    if (registroDetalhado.length === 0) {
        frequenciaListBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #6b7280;">Nenhum detalhe de frequência registrado para esta aula.</td></tr>`;
    } else {
        registroDetalhado.forEach(alunoDetalhe => {
            const isPresente = alunoDetalhe.presenca === 'PRESENTE';
            const statusText = isPresente ? 'PRESENTE' : 'FALTA';
            const statusClass = isPresente ? 'presente' : 'falta'; 

            const row = frequenciaListBody.insertRow();
            row.innerHTML = `
                <td>${alunoDetalhe.alunoMatricula}</td> 
                <td>${alunoDetalhe.nome}</td>
                <td>
                    <span class="status-frequencia ${statusClass}">${statusText}</span>
                </td>
            `;
        });
    }

    openModal('viewModal');
}

function initPage() {
    populateTurmaFiltersAndSelects();

    const filterTextElement = document.getElementById('filter-text');
    const filterTurmaElement = document.getElementById('turma-filter-aulas');

    if (filterTextElement) filterTextElement.addEventListener('input', applyFiltersAndRender);
    if (filterTurmaElement) filterTurmaElement.addEventListener('change', applyFiltersAndRender);

    applyFiltersAndRender();
}

document.addEventListener('DOMContentLoaded', initPage);

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}