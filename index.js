import { createInterface } from 'node:readline';
import { gerarRifa } from './utils/gerarRifa.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.toUpperCase()));
  });
};

console.log("Seja bem-vindo ao gerador de rifas!\n\n");

(async () => {
  const nome = await ask("Nome da rifa: ");
  const premiacao = await ask("Premiação da rifa: ");
  const data = await ask("Data do sorteio: ");
  const preco = await ask("Preço: ");
  const paginas = Number(await ask("Quantidade de páginas: "));
  const template = Number(await ask("Template: "));

  /* TODO:
   * 1. Validação dos inputs
   * 2. Usuário escolher a logo
   * 3. Automatizar nome dos vendedores
   */

  const vendedor = "________________";

  const rifa = { nome, premiacao, data, preco, vendedor, paginas, template };

  console.log("\nDados da rifa:");
  console.log(rifa);

  const confirm = await ask("Gerar rifa (s/n)? ");

  if (!/^s(im)?$/i.test(confirm.trim())) {
    rl.close();
    return;
  }

  console.log("Gerando rifa...");
  gerarRifa(rifa);

  rl.close();
})();
