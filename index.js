import { createInterface } from 'node:readline';
import { gerarRifa } from './utils/gerarRifa.js';
import logger from './utils/logger.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.toUpperCase()));
  });
};

logger.info('Seja bem-vindo ao gerador de rifas!\n\n');

(async () => {
  const nome = await ask('Nome da rifa: ');
  const premiacao = await ask('Premiação da rifa: ');
  const data = await ask('Data do sorteio (DD/MM): ');
  const preco = await ask('Preço: ');
  const paginas = Number(await ask('Quantidade de páginas: '));
  const template = Number(await ask('Template (20, 25, 30): '));

  /* TODO:
   * 1. Validação dos inputs
   * 2. Usuário escolher a logo
   * 3. Automatizar nome dos vendedores
   */

  const vendedor = '________________';

  const rifa = { nome, premiacao, data, preco, vendedor, paginas, template };

  logger.info('\nDados da rifa:');
  logger.info(rifa);

  const confirm = await ask('Gerar rifa (s/n)? ');

  if (!/^s(im)?$/i.test(confirm.trim())) {
    logger.warn('Tchau!');
    rl.close();
    return;
  }

  logger.info('Gerando rifa...');
  gerarRifa(rifa);

  rl.close();
})();
