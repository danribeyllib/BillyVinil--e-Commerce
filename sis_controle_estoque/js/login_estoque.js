//  LOGIN ESTOQUE  //

document.getElementById("form-login").onsubmit = function (e) {
    e.preventDefault();

    const usuarioInput = document.getElementById("usuario").value;
    const senhaInput = document.getElementById("senha").value;
    const msgErro = document.getElementById("msg-erro");

    // Login e senha //
    const USUARIO_CORRETO = "admin";
    const SENHA_CORRETA = "admin1234";

    console.log("Tentativa de login com usuario:", usuarioInput);

    if (usuarioInput === USUARIO_CORRETO && senhaInput === SENHA_CORRETA) {

        msgErro.style.display = "none";

        // Token para o suatus //
        const statusLogin = {
            logado: true,
            usuario: usuarioInput,
            dataAcesso: new Date().toISOString()
        };

        // SessionStorage //
        sessionStorage.setItem("billyvinil_sessao", JSON.stringify(statusLogin));

        // Nova aba 
        localStorage.setItem("billyvinil_login_persistente", JSON.stringify(statusLogin));

        console.log("Login realizado com sucesso.");

        window.location.href = "sis_estoque.html";
    } else {
        console.error("Falha no login: Credenciais invalidas.");
        msgErro.style.display = "block";

        document.getElementById("senha").value = "";
    }
};

///   Verificação de Sessão  ///
window.onload = function() {

    /* const sessaoAtiva = sessionStorage.getItem("billyvinil_sessao") || localStorage.getItem("billyvinil_login_persistente");
 
     if (sessaoAtiva) {
         console.log("Sessao encontrada. Usuario ja autenticado.");
         window.location.href = "sis_estoque.html";
     }*/
};