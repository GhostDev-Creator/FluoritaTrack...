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