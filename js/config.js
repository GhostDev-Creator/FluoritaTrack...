document.addEventListener('DOMContentLoaded', function() {
    const CHAVE_USUARIO_LOGADO = 'usuarioRegistrado';
    const CHAVE_CADASTROS = 'funcionariosCadastrados'; 

    const emailInput = document.getElementById('email');
    const nomeInput = document.getElementById('nome');
    const telefoneInput = document.getElementById('telefone'); 
    const localizacaoInput = document.getElementById('localizacao');
    const nascimentoInput = document.getElementById('nascimento');
    
    const salvarBtn = document.getElementById('salvarBtn');
    const cancelarBtn = document.querySelector('.cancel-button');
    const mensagemAlerta = document.getElementById('mensagem');
    const btnAlterarEmail = document.getElementById('btnAlterarEmail'); 

    const imagemPerfil = document.getElementById('profile-img'); 
    const fotoSec = document.getElementById('fotoUsuario'); 
    const inputFoto = document.getElementById('upload-foto');
    const botaoRemover = document.querySelector('label[for="remove-foto"]'); 

    const DEFAULT_IMG_SRC = "";
    let alertTimeoutId;
    let dadosUsuarioAtual = null; 

    function aplicarFoto(src) {
        if(imagemPerfil) imagemPerfil.src = src;
        if(fotoSec) fotoSec.src = src; 
    }

    function exibirAlerta(mensagem, cor) {
        if (!mensagemAlerta) return;
        clearTimeout(alertTimeoutId); 
        mensagemAlerta.textContent = mensagem;
        mensagemAlerta.style.color = cor;
        alertTimeoutId = setTimeout(() => {
            mensagemAlerta.textContent = '';
        }, 3000); 
    }

    function formatarParaExibicao(texto) {
        return texto ? texto.replace(/_/g, ' ') : '';
    }

    function salvarFotoImediatamente(fotoSrc) {
        if (!dadosUsuarioAtual) return false;

        const cpf = dadosUsuarioAtual.cpf;

        try {
            dadosUsuarioAtual.fotoPerfil = fotoSrc; 
            localStorage.setItem(CHAVE_USUARIO_LOGADO, JSON.stringify(dadosUsuarioAtual));
            
            const cadastrosExistentes = JSON.parse(localStorage.getItem(CHAVE_CADASTROS) || '[]');
            const index = cadastrosExistentes.findIndex(f => f.cpf === cpf);

            if (index > -1) {
                cadastrosExistentes[index].fotoPerfil = fotoSrc;
                localStorage.setItem(CHAVE_CADASTROS, JSON.stringify(cadastrosExistentes));
            }

            return true;
        } catch (e) {
            console.error('Erro ao salvar foto no localStorage:', e);
            exibirAlerta('Erro ao salvar a foto. Tente novamente.', 'red');
            return false;
        }
    }

    function carregarDadosNoFormulario() {
        const dadosSalvosJSON = localStorage.getItem(CHAVE_USUARIO_LOGADO);

        if(!dadosSalvosJSON){
            exibirAlerta('Nenhum dado de usuário encontrado. Faça login novamente.', 'red');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            aplicarFoto(DEFAULT_IMG_SRC);
            return;
        }
        
        clearTimeout(alertTimeoutId);
        if (mensagemAlerta) mensagemAlerta.textContent = '';

        dadosUsuarioAtual = JSON.parse(dadosSalvosJSON); 
        
        const fotoSrc = dadosUsuarioAtual.fotoPerfil || DEFAULT_IMG_SRC;
        aplicarFoto(fotoSrc); 

        if(nomeInput) nomeInput.value = formatarParaExibicao(dadosUsuarioAtual.nome) || ''; 
        if(telefoneInput) telefoneInput.value = formatarParaExibicao(dadosUsuarioAtual.telefone) || ''; 
        
        if(emailInput) {
            emailInput.value = dadosUsuarioAtual.email || '';
            emailInput.disabled = true; 
        }
        if(localizacaoInput) localizacaoInput.value = formatarParaExibicao(dadosUsuarioAtual.localizacao) || '';
        if(nascimentoInput) nascimentoInput.value = dadosUsuarioAtual.nascimento || '';

        if(btnAlterarEmail) {
            btnAlterarEmail.disabled = false;
            btnAlterarEmail.textContent = 'Alterar E-mail';
        }
    }

    function habilitarAlterarEmail() {
        if(emailInput) {
            emailInput.disabled = false;
            emailInput.focus();
            if(btnAlterarEmail) {
                btnAlterarEmail.disabled = true;
                btnAlterarEmail.textContent = 'Edição Habilitada';
            }
        }
    }

    function salvarAlteracoes(event) {
        event.preventDefault();

        if(!dadosUsuarioAtual) {
            exibirAlerta('Nenhum dado de usuário encontrado para atualizar.', 'red');
            return;
        }

        const cpf = dadosUsuarioAtual.cpf;
        
        const novoNome = nomeInput?.value.trim() || '';
        const novoEmail = emailInput?.value.trim() || dadosUsuarioAtual.email; 
        const novoTelefone = telefoneInput?.value.trim() || ''; 
        const novaLocalizacao = localizacaoInput?.value.trim() || dadosUsuarioAtual.localizacao; 
        const novoNascimento = nascimentoInput?.value.trim() || dadosUsuarioAtual.nascimento; 

        dadosUsuarioAtual.nome = novoNome;
        dadosUsuarioAtual.email = novoEmail;
        dadosUsuarioAtual.telefone = novoTelefone; 
        dadosUsuarioAtual.localizacao = novaLocalizacao;
        dadosUsuarioAtual.nascimento = novoNascimento;
        
        if (novoEmail === '') {
            exibirAlerta('O campo E-mail é obrigatório.', 'red');
            return;
        }
        
        try {
            localStorage.setItem(CHAVE_USUARIO_LOGADO, JSON.stringify(dadosUsuarioAtual)); 

            const cadastrosExistentes = JSON.parse(localStorage.getItem(CHAVE_CADASTROS) || '[]');
            const index = cadastrosExistentes.findIndex(f => f.cpf === cpf);

            if (index > -1) {
                cadastrosExistentes[index] = dadosUsuarioAtual; 
                localStorage.setItem(CHAVE_CADASTROS, JSON.stringify(cadastrosExistentes));
            }
            
            carregarDadosNoFormulario(); 
            exibirAlerta('As alterações foram salvas com sucesso!', 'green');

        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
            exibirAlerta('Erro ao salvar as alterações. Tente novamente.', 'red');
        }
    }

    function cancelarAlteracoes() {
        carregarDadosNoFormulario();
        exibirAlerta('Alterações canceladas. Os dados originais foram restaurados.', 'orange');
    }

    if (inputFoto) {
        inputFoto.addEventListener('change', function(event) {
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newSrc = e.target.result;
                    aplicarFoto(newSrc);
                    if(salvarFotoImediatamente(newSrc)) {
                        exibirAlerta('Foto de perfil carregada e salva!', 'green');
                    }
                }
                reader.readAsDataURL(event.target.files[0]);
            }
        });
    }

    if (botaoRemover) {
        botaoRemover.addEventListener('click', function(event) {
            event.preventDefault(); 
            aplicarFoto(DEFAULT_IMG_SRC);
            if(inputFoto) inputFoto.value = ''; 
            
            if(salvarFotoImediatamente('')) {
                exibirAlerta('Foto de perfil removida e salva!', 'orange');
            }
        });
    }

    carregarDadosNoFormulario();

    if (btnAlterarEmail) btnAlterarEmail.addEventListener('click', habilitarAlterarEmail);
    if (salvarBtn) salvarBtn.addEventListener('click', salvarAlteracoes);
    if (cancelarBtn) cancelarBtn.addEventListener('click', cancelarAlteracoes);
});