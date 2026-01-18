////   DISCOS FAVORITADOS   /// 

//  --  Key no localstorage  --  // 
const CHAVE_FAVORITOS = "favoritos";

function obterIdsFavoritos() {
  return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || [];
}

//  --  Salva no LS  --  // 
function salvarIdsFavoritos(lista) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
}
//  --  Verificação  --  //
function estaFavoritado(id) {
  return obterIdsFavoritos().includes(Number(id));
}

//  --  Veridica e adiciona  --  //
function adicionarFavorito(id) {
  const favoritos = obterIdsFavoritos();
  const idNumerico = Number(id);

  if (!favoritos.includes(idNumerico)) {
    favoritos.push(idNumerico);
    salvarIdsFavoritos(favoritos);
  }
}

//  --  Remover  --  //
function removerFavorito(id) {
  const idNumerico = Number(id);
  const favoritos = obterIdsFavoritos().filter(f => f !== idNumerico);
  salvarIdsFavoritos(favoritos);
}

//  --  Alternar: add se não existe, remove se existe  --  //
function alternarFavorito(id) {
  estaFavoritado(id) ? removerFavorito(id) : adicionarFavorito(id);
}

//  --  Limpar todos  --  //
function limparFavoritos() {
  localStorage.removeItem(CHAVE_FAVORITOS);
}
