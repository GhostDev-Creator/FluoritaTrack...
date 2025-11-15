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

const helpTopics = {
    "registrar-aula": {
        title: "Como registrar uma nova aula?",
        content: `
            <p>Siga estes passos para agendar uma nova aula no sistema:</p>
            <ol>
                <li>No menu lateral (Sidebar), clique em **'Gerenciar Aulas'**.</li>
                <li>Na seção, procure e clique no botão **'Nova Aula'** (<i class="ri-add-line"></i>).</li>
                <li>Preencha a **Turma**, **Disciplina**, **Professor** e a **Data/Hora** da aula.</li>
                <li>O Status será definido automaticamente como 'Agendada'.</li>
                <li>Clique em **'Salvar'** para incluir a aula na lista.</li>
            </ol>
        `
    },
    "resetar-senha": {
        title: "Como resetar minha senha de acesso?",
        content: `
            <p>O reset de senha é gerenciado pela tela de login do sistema. Se você está logado, deve procurar a opção 'Configurações de Perfil'.</p>
            <p>Geralmente, você precisará:</p>
            <ul>
                <li>Clicar em **'Esqueci minha Senha'** na tela de Login.</li>
                <li>Informar seu e-mail de cadastro.</li>
                <li>Seguir o link enviado para o seu e-mail.</li>
            </ul>
        `
    },
    "visualizar-frequencia": {
        title: "Visualizar a frequência dos alunos",
        content: `
            <p>A frequência é visualizada por aula registrada, permitindo que você veja o status individual (PRESENTE ou FALTA) de cada estudante.</p>
            <ol>
                <li>Acesse **'Gerenciar Aulas'**.</li>
                <li>Encontre a aula desejada na tabela.</li>
                <li>Clique no botão **'Visualizar Frequência'** (<i class="ri-eye-line"></i>) na coluna Ações.</li>
                <li>Um modal (pop-up) será exibido com a lista de alunos e seus respectivos status de presença.</li>
            </ol>
        `
    },
    "excluir-cadastro": {
        title: "Excluir um cadastro (Aula, Aluno, Professor)",
        content: `
            <p>A exclusão é uma ação permanente e deve ser feita com cuidado. O procedimento é similar para todas as entidades:</p>
            <p>Na tabela de gerenciamento (Aulas, Alunos, ou Professores):</p>
            <ul>
                <li>Localize a linha que deseja excluir.</li>
                <li>Clique no ícone de **Excluir** (<i class="ri-delete-bin-line"></i>) na coluna Ações.</li>
                <li>Confirme a exclusão na caixa de diálogo que aparecer (o **Message Box**).</li>
            </ul>
        `
    }
};

const searchInput = document.getElementById('help-search');
const suggestionsBox = document.getElementById('suggestions-box');
const resultContainer = document.getElementById('help-results-container');
const resultTitle = document.getElementById('result-title');
const resultContent = document.getElementById('result-content');
const helpCards = document.querySelectorAll('.help-card');

let activeSuggestionIndex = -1; 

const allTopics = Object.keys(helpTopics).map(key => ({ 
    key, 
    title: helpTopics[key].title 
}));

function displayHelp(topicKey, title = null) {
    const topic = helpTopics[topicKey];

    suggestionsBox.style.display = 'none'; 
    searchInput.value = title || (topic ? topic.title : ''); 

    if (topic) {
        resultTitle.innerHTML = topic.title;
        resultContent.innerHTML = topic.content;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
        resultTitle.innerHTML = title || "Tópico Não Encontrado";
        resultContent.innerHTML = "<p>Não encontramos uma resposta exata para esta pesquisa. Tente refinar os termos ou use as sugestões.</p>";
        resultContainer.style.display = 'block';
    }
}

function populateSuggestions(searchTerm = '') {
    suggestionsBox.innerHTML = '';

    let filteredTopics;

    if (searchTerm === '') {
        filteredTopics = allTopics;
    } else {
        filteredTopics = allTopics.filter(topic => 
            topic.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filteredTopics.length > 0) {
        filteredTopics.forEach(topic => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.setAttribute('data-topic', topic.key);

            let titleHtml = topic.title;
            if (searchTerm !== '') {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                titleHtml = topic.title.replace(regex, '<strong>$1</strong>');
            }
            item.innerHTML = titleHtml;

            item.addEventListener('click', () => {
                displayHelp(topic.key, topic.title);
            });

            suggestionsBox.appendChild(item);
        });
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
}

function handleFocus() {
    populateSuggestions(searchInput.value.trim());
}

function handleBlur() {
    setTimeout(() => {
        suggestionsBox.style.display = 'none';
    }, 150);
}

function searchHelp() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === "") return;

    const foundKey = Object.keys(helpTopics).find(key => 
        helpTopics[key].title.toLowerCase().includes(searchTerm)
    );

    if (foundKey) {
        displayHelp(foundKey);
    } else {
        displayHelp(null, `Resultado para: "${searchInput.value}"`);
    }
}

function handleInput(event) {
    const searchTerm = searchInput.value.trim();

    if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
        handleKeyNavigation(event);
        return;
    }

    populateSuggestions(searchTerm);
    activeSuggestionIndex = -1; 
}

function handleKeyNavigation(event) {
    const suggestions = Array.from(suggestionsBox.children);

    if (suggestions.length === 0) return;

    suggestions.forEach(item => item.classList.remove('active'));

    if (event.key === 'ArrowDown') {
        activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp') {
        activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter' && activeSuggestionIndex !== -1) {
        suggestions[activeSuggestionIndex].click();
        event.preventDefault(); 
        return;
    }

    if (activeSuggestionIndex !== -1) {
        const activeItem = suggestions[activeSuggestionIndex];
        activeItem.classList.add('active');
        searchInput.value = activeItem.textContent; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    helpCards.forEach(card => {
        card.addEventListener('click', () => {
            const searchTerm = card.getAttribute('data-search-term');
            searchInput.value = searchTerm;
            searchHelp();
        });
    });
});