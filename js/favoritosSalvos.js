////   DISCOS FAVORITADOS   /// 
const CHAVE_FAVORITOS = "favoritos";

function obterIdsFavoritos() {
  return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || [];
}

function salvarIdsFavoritos(lista) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
}

function estaFavoritado(id) {
  return obterIdsFavoritos().includes(Number(id));
}

function adicionarFavorito(id) {
  const favoritos = obterIdsFavoritos();
  const idNumerico = Number(id);

  if (!favoritos.includes(idNumerico)) {
    favoritos.push(idNumerico);
    salvarIdsFavoritos(favoritos);
  }
}

function removerFavorito(id) {
  const idNumerico = Number(id);
  const favoritos = obterIdsFavoritos().filter(f => f !== idNumerico);
  salvarIdsFavoritos(favoritos);
}

function alternarFavorito(id) {
  estaFavoritado(id) ? removerFavorito(id) : adicionarFavorito(id);
}

function limparFavoritos() {
  localStorage.removeItem(CHAVE_FAVORITOS);
}
