const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPHK_St64pT8YZxO__CK571n6f2chr6ZoxHuK9zPlWcpDpeZW-KQzIhneJ8rBeQEprbxgAQ9ycFWXB/pub?output=csv'; 
const AULAS_STORAGE_KEY = 'aulas_registradas_v1';
const DADOS_USUARIO_KEY = 'usuarioRegistrado'; 

const MOCK_DATA = [
    "Ana Carolina Santos,100,2,3A,1,1,5,0,M2023ANA,Concluido",
    "Bruno Lima Oliveira,100,5,3A,2,3,1,1,M2023BRUNO,Pendente",
    "Carla Pereira Silva,100,1,3B,0,1,2,0,M2023CARLA,Concluido",
    "Daniel Rocha Almeida,100,0,3B,0,0,0,0,M2023DANI,Concluido",
    "Helena Torres Lima,120,6,3A,2,4,0,0,M2023HELE,Pendente",
    "Igor Alves Melo,120,0,3A,0,0,0,0,M2023IGOR,Concluido",
    "Julia Nogueira Cruz,120,10,3B,5,5,1,0,M2023JULIA,Pendente",
    "Kaio Santana Reis,120,1,3B,0,1,0,0,M2023KAIO,Concluido",
];

let alunosCadastrados = []; 
let aulasRegistradas = []; 
let chartInstance = null; 

function loadRegistros() {
    try {
        const json = localStorage.getItem(AULAS_STORAGE_KEY);
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
        localStorage.setItem(AULAS_STORAGE_KEY, json);
    } catch (error) {
        console.error("Erro ao salvar registro no localStorage:", error);
        showMessage("ERRO: Falha ao salvar o registro no armazenamento local.", 'error');
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function showMessage(message, type = 'success') {
    const messageAlert = document.getElementById('registro-feedback') || document.getElementById('dashboard-feedback');
    if (!messageAlert) return;
    
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

async function fetchCSVData() {
    const header = "Aluno,Total Aulas,Faltas,Sala,Justificadas,Sem Justificativas,Atrasos,Revisao,Matricula,Status";

    if (SHEET_CSV_URL) {
        try {
            const response = await fetch(SHEET_CSV_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvContent = await response.text();
            
            return csvContent; 

        } catch (error) {
            console.error("Erro ao carregar CSV externo, usando dados mockados.", error);
            showMessage(`AVISO: Falha ao carregar dados de ${SHEET_CSV_URL}. Usando dados de demonstração.`, 'warning');
            return [header, ...MOCK_DATA].join('\n');
        }
    } else {
        return [header, ...MOCK_DATA].join('\n');
    }
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
        const cleanInt = (val) => parseInt(clean(val)) || 0;

        const aluno = clean(columns[0]); 
        const alunoMatricula = clean(columns[8]); 
        const sala = clean(columns[3]) || 'N/A'; 
        
        const totalAulasCSV = cleanInt(columns[1]); 
        const faltasCSV = cleanInt(columns[2]); 
        const justificadas = cleanInt(columns[4]); 
        const semJustificativas = cleanInt(columns[5]); 
        const atrasados = cleanInt(columns[6]); 
        const emRevisao = cleanInt(columns[7]); 

        if (aluno && alunoMatricula) { 
            data.push({ 
                aluno: aluno, 
                sala: sala,
                id: generateUniqueId(), 
                matricula: alunoMatricula,
                totalAulasCSV: totalAulasCSV,
                faltasCSV: faltasCSV,
                faltasJustificadas: justificadas,
                semJustificativas: semJustificativas,
                atrasados: atrasados,
                emRevisao: emRevisao,
                totalFaltas: faltasCSV, 
                totalAulas: totalAulasCSV,
            }); 
        }
    }
    return data;
}

if (document.getElementById('registro-table')) {
    
    function getProfessorLogadoNome() {
        const dadosSalvosJSON = localStorage.getItem(DADOS_USUARIO_KEY);
        if (!dadosSalvosJSON) return "N/A"; 
        try {
            const usuario = JSON.parse(dadosSalvosJSON);
            const nomeCompleto = usuario.nome ? usuario.nome.trim() : '';
            return `Prof(a) ${nomeCompleto}` || "N/A";
        } catch (e) {
            return "N/A";
        }
    }

    function populateSelects(data) {
        const salaSelect = document.getElementById('turma-filter-alunos');
        const salas = [...new Set(data.map(item => item.sala))].sort(); 
        
        if (salaSelect) {
            salaSelect.innerHTML = '<option value="">Todas as Turmas</option>'; 
            salas.forEach(sala => {
                const option = document.createElement('option');
                option.value = sala;
                option.textContent = sala;
                salaSelect.appendChild(option);
            });
        }

        const dateFromInput = document.getElementById('date-from');
        if (dateFromInput) dateFromInput.valueAsDate = new Date();
        
        const classesCountInput = document.getElementById('classes-count');
        if (classesCountInput) classesCountInput.value = 1;
    }

    function marcarTodosComoFalta(markAsPresent = true) {
        const checkboxes = document.querySelectorAll('#registro-table-body input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = !markAsPresent;
        });
        updateFaltasSummary();
    }
    
    function clearFiltersAndTable() {
        const turmaFilter = document.getElementById('turma-filter-alunos');
        if (turmaFilter) turmaFilter.value = '';
        
        const disciplinaInput = document.getElementById('disciplina');
        if (disciplinaInput) disciplinaInput.value = '';
        
        const classesCountInput = document.getElementById('classes-count');
        if (classesCountInput) classesCountInput.value = 1;
        
        renderStudentList('');
    }
    
    function renderStudentList(filterValue) {
        const tableBody = document.getElementById('registro-table-body');
        const markAllButton = document.getElementById('mark-all-button');

        if (!tableBody) return;

        tableBody.innerHTML = '';
        if (markAllButton) markAllButton.style.display = 'none';

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

        if (markAllButton) markAllButton.style.display = 'inline-block';
        updateFaltasSummary();
    }
    
    function updateFaltasSummary() {
        const checkboxes = document.querySelectorAll('#registro-table-body input[type="checkbox"]');
        let faltas = 0;

        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) faltas++;
        });

        const total = checkboxes.length;
        const presentes = total - faltas;
        const markAllButton = document.getElementById('mark-all-button');

        if (markAllButton && total > 0) { 
            markAllButton.textContent = `Marcar ${presentes} Presente(s) como FALTA`;
            markAllButton.style.display = 'inline-block';
        } else if (markAllButton) {
            markAllButton.style.display = 'none';
        }
    }

    window.updateFaltasSummary = updateFaltasSummary;
    
    function registrarAula() {
        const dataAulaInput = document.getElementById('date-from');
        const turmaSelect = document.getElementById('turma-filter-alunos');
        const disciplinaInput = document.getElementById('disciplina');
        const classesCountInput = document.getElementById('classes-count');
        const registerButton = document.getElementById('save-frequency-btn');

        if (!dataAulaInput || !turmaSelect || !disciplinaInput || !classesCountInput || !registerButton) {
             console.error("Elementos do formulário de registro não encontrados.");
             return;
        }

        const dataAula = dataAulaInput.value;
        const turma = turmaSelect.value;
        const disciplina = disciplinaInput.value.trim();
        const numAulas = parseInt(classesCountInput.value); 

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
                registerButton.textContent = "Registrar Aula(s)";
            }, 500); 
        }, 1000);
    }

    window.updateFaltasSummary = updateFaltasSummary;

    async function initRegistro() {
        aulasRegistradas = loadRegistros();
        
        const csvText = await fetchCSVData();
        alunosCadastrados = processCSV(csvText); 

        if (alunosCadastrados.length === 0) {
            console.error("ERRO: O processamento do CSV não retornou alunos.");
            return; 
        }

        populateSelects(alunosCadastrados);

        const turmaFilterAlunos = document.getElementById('turma-filter-alunos');
        const saveFrequencyBtn = document.getElementById('save-frequency-btn');
        
        if (turmaFilterAlunos) {
            turmaFilterAlunos.addEventListener('change', (e) => {
                renderStudentList(e.target.value);
            });
        }
        
        if (saveFrequencyBtn) {
            saveFrequencyBtn.addEventListener('click', registrarAula);
        }

        const markAllBtn = document.createElement('button');
        markAllBtn.id = "mark-all-button";
        markAllBtn.textContent = "Marcar Todos como FALTA";
        markAllBtn.className = "action-button secondary-btn"; 
        const registroHeader = document.querySelector('.registro-header');
        if (registroHeader) {
            registroHeader.appendChild(markAllBtn);
            markAllBtn.addEventListener('click', () => marcarTodosComoFalta(true));
        }

        renderStudentList('');
    }
    
    document.addEventListener('DOMContentLoaded', initRegistro);
}

if (document.getElementById('frequenciaChart')) {
    
    function getFaltasRegistradasDoLocalStorage(startDateStr, endDateStr) {
        const aulasJson = localStorage.getItem(AULAS_STORAGE_KEY);
        const aulas = aulasJson ? JSON.parse(aulasJson) : [];

        const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
        const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

        const faltasMap = new Map();
        
        const aulasNoPeriodo = aulas.filter(aula => {
            const aulaDate = new Date(aula.data + 'T00:00:00'); 
            
            const isAfterStart = !startDate || aulaDate >= startDate;
            const isBeforeEnd = !endDate || aulaDate <= endDate;
            
            return isAfterStart && isBeforeEnd;
        });

        aulasNoPeriodo.forEach(aula => {
            const numAulas = aula.numAulas || 1;

            if (aula.detalhes && Array.isArray(aula.detalhes)) {
                aula.detalhes.forEach(detalhe => {
                    const matricula = detalhe.alunoMatricula;

                    if (matricula) {
                        if (!faltasMap.has(matricula)) {
                            faltasMap.set(matricula, { 
                                totalFaltas: 0, 
                                totalAulasContabilizadas: 0,
                                faltasDetalhe: []
                            });
                        }

                        const alunoData = faltasMap.get(matricula);

                        if (detalhe.presenca === 'FALTA') {
                            alunoData.totalFaltas += numAulas;
                        }
                        alunoData.totalAulasContabilizadas += numAulas;
                    }
                });
            }
        });

        return { faltasMap, aulasFiltradas: aulasNoPeriodo }; 
    }

    function populateSalaFilter(data) {
        const select = document.getElementById('turma-filter-dashboard');
        if (!select) return;
        
        const salas = [...new Set(data.map(item => item.sala))].sort(); 

        select.innerHTML = '<option value="">Filtrar por Turma</option>'; 
        salas.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala;
            option.textContent = sala;
            select.appendChild(option);
        });
    }

    function mergeDataAndCalculateMetrics(data, faltasMapCompleto) {
        return data.map(aluno => {
            const matriculaData = faltasMapCompleto.get(aluno.matricula);

            if (matriculaData) {
                const totalFaltas = aluno.faltasCSV + matriculaData.totalFaltas;
                const totalAulas = aluno.totalAulasCSV + matriculaData.totalAulasContabilizadas;

                return {
                    ...aluno,
                    totalFaltas: totalFaltas,
                    totalAulas: totalAulas
                };
            }
            return aluno;
        });
    }
    
    function applyFilters() {
        const turmaSelect = document.getElementById('turma-filter-dashboard');
        const searchInput = document.getElementById('search-aluno');
        const dateStartInput = document.getElementById('date-start-dashboard');
        const dateEndInput = document.getElementById('date-end-dashboard');

        if (!turmaSelect || !searchInput || !dateStartInput || !dateEndInput) {
            console.error("Elementos do dashboard não encontrados para aplicar filtros.");
            return;
        }

        const selectedTurma = turmaSelect.value;
        const searchText = searchInput.value.toLowerCase();
        
        const dateStartStr = dateStartInput.value;
        const dateEndStr = dateEndInput.value;
        
        const { faltasMap: faltasPeriodoMap, aulasFiltradas } = getFaltasRegistradasDoLocalStorage(dateStartStr, dateEndStr);

        let alunosComMetricas = alunosCadastrados.map(aluno => {
            const matriculaData = faltasPeriodoMap.get(aluno.matricula);
            
            const totalFaltasPeriodo = matriculaData ? matriculaData.totalFaltas : 0;
            const totalAulasPeriodo = matriculaData ? matriculaData.totalAulasContabilizadas : 0;
            
            return {
                ...aluno,
                totalFaltasPeriodo: totalFaltasPeriodo,
                totalAulasPeriodo: totalAulasPeriodo,
            };
        });
        
        let filteredData = alunosComMetricas;

        if (selectedTurma) {
            filteredData = filteredData.filter(aluno => aluno.sala === selectedTurma);
        }

        if (searchText) {
            filteredData = filteredData.filter(aluno => 
                aluno.aluno.toLowerCase().includes(searchText)
            );
        }

        if (dateStartStr || dateEndStr) {
            filteredData = filteredData.filter(aluno => aluno.totalAulasPeriodo > 0);
        }

        updateDashboard(filteredData);
    }
    
    function clearFiltersDashboard() {
        const turmaSelect = document.getElementById('turma-filter-dashboard');
        const searchInput = document.getElementById('search-aluno');
        const dateStartInput = document.getElementById('date-start-dashboard');
        const dateEndInput = document.getElementById('date-end-dashboard');

        if (turmaSelect) turmaSelect.value = '';
        if (searchInput) searchInput.value = '';
        if (dateStartInput) dateStartInput.value = '';
        if (dateEndInput) dateEndInput.value = '';

        applyFilters();
    }

    function updateChart(presencas, faltas) {
        if (typeof Chart === 'undefined') {
            console.error("ERRO: A biblioteca Chart.js não está carregada.");
            return; 
        }

        const ctx = document.getElementById('frequenciaChart').getContext('2d');

        if (chartInstance) {
            chartInstance.destroy();
        }

        const dataToChart = [presencas, faltas];

        const data = {
            labels: ['Presenças', 'Faltas'],
            datasets: [{
                data: dataToChart,
                backgroundColor: ['#10b981', '#ef4444'], 
                hoverBackgroundColor: ['#059669', '#dc2626'],
                borderWidth: 0,
            }]
        };

        chartInstance = new Chart(ctx, {
            type: 'doughnut', 
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%', 
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                         callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateDashboard(data) {

        const stats = data.reduce((acc, student) => {
            acc.totalFaltas += student.totalFaltasPeriodo; 
            acc.totalAulas += student.totalAulasPeriodo; 
            return acc;
        }, { 
            totalFaltas: 0, totalAulas: 0, justificadas: 0, 
            semJustificativas: 0, atrasados: 0, emRevisao: 0 
        });

        const totalFaltasGeral = stats.totalFaltas;
        const totalAulasDisponiveis = stats.totalAulas; 
        const totalPresencas = totalAulasDisponiveis - totalFaltasGeral;

        let frequenciaPercent = 0;
        if (totalAulasDisponiveis > 0) {
            frequenciaPercent = (totalPresencas / totalAulasDisponiveis) * 100;
        }

        const percentElement = document.getElementById('chart-center-percent');
        const faltasElement = document.getElementById('chart-center-faltas');
        
        if (percentElement) percentElement.textContent = `${frequenciaPercent.toFixed(1)}%`;
        if (faltasElement) faltasElement.textContent = `(${totalFaltasGeral} ${totalFaltasGeral === 1 ? 'Falta' : 'Faltas'})`;
        
        updateChart(totalPresencas, totalFaltasGeral); 
        
        const dadosAlunoOriginal = alunosCadastrados.reduce((acc, aluno) => {
            acc.totalFaltas += aluno.totalFaltas; 
            acc.justificadas += aluno.faltasJustificadas;
            acc.semJustificativas += aluno.semJustificativas;
            acc.atrasados += aluno.atrasados;
            acc.emRevisao += aluno.emRevisao;
            return acc;
        }, {totalFaltas: 0, justificadas: 0, semJustificativas: 0, atrasados: 0, emRevisao: 0 });

        const totalFaults = document.getElementById('totalFaults');
        const justifiedAbsencesCount = document.getElementById('justifiedAbsencesCount');
        const unjustifiedAbsencesCount = document.getElementById('unjustifiedAbsencesCount');
        const lateCount = document.getElementById('lateCount');
        const emRevisaoCount = document.getElementById('emRevisaoCount');

        if (totalFaults) totalFaults.textContent = dadosAlunoOriginal.totalFaltas; 
        if (justifiedAbsencesCount) justifiedAbsencesCount.textContent = dadosAlunoOriginal.justificadas;
        if (unjustifiedAbsencesCount) unjustifiedAbsencesCount.textContent = dadosAlunoOriginal.semJustificativas;
        if (lateCount) lateCount.textContent = dadosAlunoOriginal.atrasados;
        if (emRevisaoCount) emRevisaoCount.textContent = dadosAlunoOriginal.emRevisao;

        renderTable(data);
    }


    function renderTable(data) {
        const tableBody = document.getElementById('alunos-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = ''; 

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Nenhum aluno encontrado no período/filtro.</td></tr>`;
            return;
        }

        data.forEach((student, index) => {
            const presencaIndividual = student.totalAulasPeriodo - student.totalFaltasPeriodo; 
            let frequenciaIndividual = 0;

            if (student.totalAulasPeriodo > 0) {
                frequenciaIndividual = (presencaIndividual / student.totalAulasPeriodo) * 100;
            } else if (student.totalFaltasPeriodo === 0 && student.totalAulasPeriodo === 0) {
                frequenciaIndividual = 0; 
            } else if (student.totalFaltasPeriodo === 0) {
                frequenciaIndividual = 100; 
            }

            let freqColor = 'var(--color-success)';
            if (frequenciaIndividual < 75) {
                freqColor = 'var(--color-danger)';
            } else if (frequenciaIndividual < 90) {
                freqColor = 'var(--color-warning)';
            }

            const row = tableBody.insertRow();
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${student.aluno}</td>
                <td class="text-center">${student.sala}</td>
                <td class="text-center">${student.totalAulasPeriodo}</td>
                <td class="text-center" style="color: var(--color-danger); font-weight: 600;">${student.totalFaltasPeriodo}</td>
                <td class="text-center" style="color: ${freqColor}; font-weight: 600;">${frequenciaIndividual.toFixed(1)}%</td>
            `;
        });
    }

    async function initDashboard() {
        const csvText = await fetchCSVData();
        let alunosFromCSV = processCSV(csvText); 
        
        const { faltasMap: faltasMapCompleto } = getFaltasRegistradasDoLocalStorage(null, null); 
        
        alunosCadastrados = mergeDataAndCalculateMetrics(alunosFromCSV, faltasMapCompleto); 

        if (alunosCadastrados.length === 0) {
            console.error("Nenhum dado de aluno válido encontrado.");
            return; 
        }

        populateSalaFilter(alunosCadastrados); 
        
        const applyBtn = document.getElementById('apply-filters-btn');
        const clearBtn = document.getElementById('clear-filters-btn'); 
        const turmaSelect = document.getElementById('turma-filter-dashboard');
        const searchInput = document.getElementById('search-aluno');
        const dateStartInput = document.getElementById('date-start-dashboard');
        const dateEndInput = document.getElementById('date-end-dashboard');

        if(applyBtn) applyBtn.addEventListener('click', applyFilters); 
        if(clearBtn) clearBtn.addEventListener('click', clearFiltersDashboard); 

        if(turmaSelect) turmaSelect.addEventListener('change', applyFilters);
        if(searchInput) searchInput.addEventListener('input', applyFilters);
        
        applyFilters(); 
    }

    document.addEventListener('DOMContentLoaded', initDashboard);
}