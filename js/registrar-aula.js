function configurarBuscaTurma(selectId, tableBodyId, buttonId) {
    const filterSelect = document.getElementById(selectId);
    const searchButton = document.querySelector(`.${buttonId}`);
    
    if (!filterSelect || !searchButton) return;

    const tableRows = document.querySelectorAll(`#${tableBodyId} tr`);

    searchButton.addEventListener('click', (evento) => {
        evento.preventDefault(); 
        
        const turmaSelecionada = filterSelect.value;

        tableRows.forEach(row => {
            const rowTurma = row.getAttribute('data-turma');
            if (turmaSelecionada === 'todas' || turmaSelecionada === rowTurma) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        console.log(`Filtro aplicado para: ${turmaSelecionada}`);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarBuscaTurma(
        'turma-filter-alunos',
        'alunos-table-body',
        'btn-secondary'
    );

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
});