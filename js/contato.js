///   MENU SANDUÍCHE - Bulma CSS   ///
document.addEventListener('DOMContentLoaded', () => {

    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {

            const target = el.dataset.target;
            const $target = document.getElementById(target);

            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');

        });
    });
});

///    DADOS    ///
document.addEventListener("DOMContentLoaded", () => {

  const forms = document.querySelectorAll("form");

  forms.forEach(form => {

    const inputs = form.querySelectorAll('[required]');

    //  --  Validação  --  //
    inputs.forEach(input => {
      input.addEventListener("input", () => {
       
        if (input.checkValidity()) {
          input.classList.remove("is-danger");
          input.classList.add("is-success");
        
          const msg = input.closest(".field")?.querySelector(".help.is-danger");
        
          if (msg) msg.classList.add("is-hidden");
        } else {
          input.classList.remove("is-success");
        }
      });
    });

    // Validar ao enviar
    form.addEventListener("submit", e => {
      e.preventDefault();
    
      let valido = true;

      form.querySelectorAll(".help.is-danger").forEach(msg => msg.classList.add("is-hidden"));
   
      inputs.forEach(input => input.classList.remove("is-danger", "is-success"));
      inputs.forEach(input => {
     
        if (!input.checkValidity()) {
          valido = false;
  
          input.classList.add("is-danger");
          const msg = input.closest(".field")?.querySelector(".help.is-danger");
     
          if (msg) msg.classList.remove("is-hidden");
        } else {
          input.classList.add("is-success");
        }
      });

      if (!valido) return;

      // Simulação envio
      const botao = form.querySelector('button[type="submit"]');
      const textoOriginal = botao.textContent;
  
      botao.textContent = "Enviando...";
      botao.disabled = true;

      setTimeout(() => {
        botao.textContent = "Mensagem Enviada!";
     
        form.reset();
        inputs.forEach(input => input.classList.remove("is-success"));

        setTimeout(() => {
  
          botao.textContent = textoOriginal;
          botao.disabled = false;
        }, 2000);
      }, 1500);
    });
  });
});