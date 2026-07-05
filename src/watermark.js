// Marca d'água invisível: embute um código único em cada exportação,
// usando caracteres Unicode "zero-width" (não aparecem visualmente, mas ficam no texto).
// Se um arquivo vazado for encontrado, dá pra extrair esse código e saber de qual
// exportação (empresa, data, responsável) ele veio.

const ZW = ["\u200B", "\u200C"]; // zero-width space / zero-width non-joiner => bits 0 e 1

export function gerarCodigoExportacao() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function textoParaBinario(texto) {
  return texto.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join("");
}

export function embutirMarcaDagua(texto, codigo) {
  const binario = textoParaBinario(codigo);
  const marca = binario.split("").map(bit => ZW[bit === "0" ? 0 : 1]).join("");
  return texto + marca;
}

export function extrairMarcaDagua(textoComMarca) {
  const chars = textoComMarca.split("").filter(c => c === ZW[0] || c === ZW[1]);
  if (chars.length === 0) return null;
  const binario = chars.map(c => (c === ZW[0] ? "0" : "1")).join("");
  let codigo = "";
  for (let i = 0; i < binario.length; i += 8) {
    const byte = binario.slice(i, i + 8);
    if (byte.length === 8) codigo += String.fromCharCode(parseInt(byte, 2));
  }
  return codigo;
}
