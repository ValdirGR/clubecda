const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const counts = await Promise.all([
    p.empresa.count().then(c => `empresas: ${c}`),
    p.escritorio.count().then(c => `escritorios: ${c}`),
    p.profissional.count().then(c => `profissionais: ${c}`),
    p.noticia.count().then(c => `noticias: ${c}`),
    p.fotoNoticia.count().then(c => `fotos_noticias: ${c}`),
    p.ponto.count().then(c => `pontos: ${c}`),
    p.showroom.count().then(c => `showroom: ${c}`),
    p.promocao.count().then(c => `promocao: ${c}`),
    p.casUsuario.count().then(c => `cas_usuarios: ${c}`),
    p.casModulo.count().then(c => `cas_modulos: ${c}`),
    p.casAcessoMod.count().then(c => `cas_acessos_mod: ${c}`),
    p.informativo.count().then(c => `mod_informativo: ${c}`),
    p.informativoFoto.count().then(c => `mod_informativo_f: ${c}`),
    p.indice.count().then(c => `mod_indice: ${c}`),
  ]);
  counts.forEach(c => console.log(c));
  await p.$disconnect();
}

main();
