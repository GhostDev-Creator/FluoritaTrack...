function aplicarFiltrosCombinados(tableBodyId, selectTurmaId, selectStatusId) {
    const selectTurma = selectTurmaId ? document.getElementById(selectTurmaId) : null;
    const selectStatus = selectStatusId ? document.getElementById(selectStatusId) : null;

    if (!selectTurma && !selectStatus) return;
    
    const turmaSelecionada = selectTurma ? selectTurma.value : 'todas';
    const statusSelecionado = selectStatus ? selectStatus.value : 'todas';

    const tableRows = document.querySelectorAll(`#${tableBodyId} tr`);

    tableRows.forEach(row => {
        const rowTurma = row.getAttribute('data-turma');
        const rowStatus = row.getAttribute('data-status');

        const passaNoFiltroTurma = (turmaSelecionada === 'todas' || turmaSelecionada === rowTurma);

        const passaNoFiltroStatus = (statusSelecionado === 'todas' || statusSelecionado === rowStatus);

        if (passaNoFiltroTurma && passaNoFiltroStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function configurarFiltros(selectTurmaId, selectStatusId, tableBodyId) {
    const selectTurma = document.getElementById(selectTurmaId);
    const selectStatus = document.getElementById(selectStatusId);

    const handler = () => aplicarFiltrosCombinados(tableBodyId, selectTurmaId, selectStatusId);

    if (selectTurma) {
        selectTurma.addEventListener('change', handler);
    }

    if (selectStatus) {
        selectStatus.addEventListener('change', handler);
    }
    handler();
}

document.addEventListener('DOMContentLoaded', () => {
    configurarFiltros('turma-filter-aulas', null, 'aulas-table-body');
    configurarFiltros('turma-filter-alunos', 'status-bar', 'alunos-table-body');
    configurarFiltros('turma-filter-dashboard', null, 'dashboard-table-body');
});

const dadosUsuario = 'usuarioRegistrado';
    const fotoUsuarioSecundaria = document.getElementById('fotoUsuario');
    
    const DEFAULT_IMG_SRC = "";

    if (fotoUsuarioSecundaria) {
        const dadosSalvosJSON = localStorage.getItem(dadosUsuario);

        if (dadosSalvosJSON) {
            const usuario = JSON.parse(dadosSalvosJSON);
            
            const fotoSrc = usuario.fotoPerfil || DEFAULT_IMG_SRC;
            fotoUsuarioSecundaria.src = fotoSrc;
        } else {
            fotoUsuarioSecundaria.src = DEFAULT_IMG_SRC;
        }
    }