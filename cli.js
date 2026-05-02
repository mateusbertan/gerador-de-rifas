import { createInterface } from "node:readline";
import axios from "axios";
import sharp from "sharp";
import { randomUUID } from "crypto";

import gerarRifa from "./utils/gerarRifa.js";
import logger from "./utils/logger.js";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(question, validation, errorMessage) {
  while (true) {
    logger.info(question);

    const answer = await new Promise((resolve) => {
      rl.question("> ", (res) => resolve(res.trim()));
    });

    const result = await validation(answer);

    if (result) {
      return typeof result === "string" ? result : answer;
    }

    logger.warn(errorMessage);
  }
}

logger.info("Seja bem-vindo ao gerador de rifas!");

const dataRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;

(async () => {
  const nomeInput = await ask(
    "Nome da rifa: ",
    (val) => val.length >= 4 && val.length <= 25,
    "O nome deve ter entre 4 e 25 caracteres!",
  );

  const premiacaoInput = await ask(
    "Premiação da rifa: ",
    (val) => val.length >= 4 && val.length <= 20,
    "O nome deve ter entre 4 e 20 caracteres!",
  );

  const dataInput = await ask(
    "Data do sorteio (DD/MM): ",
    (val) => dataRegex.test(val),
    "Digite uma data válida no formato DD/MM (ex: 25/12)!",
  );

  const precoInput = await ask(
    "Preço (0,01 a 99,99): ",
    (val) => {
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num >= 0.01 && num <= 99.99;
    },
    "O preço deve ser entre 0,01 e 99,99!",
  );

  const folhasInput = await ask(
    "Quantidade de páginas: ",
    (val) => {
      const n = parseInt(val);
      return !isNaN(n) && n > 0 && n <= 1000;
    },
    "Digite um número inteiro entre 1 e 1000!",
  );

  const templateInput = await ask(
    "Template (20, 25, 30): ",
    (val) => ["20", "25", "30"].includes(val.trim()),
    "Opção inválida! Escolha apenas 20, 25 ou 30.",
  );

  const logoInput = await ask(
    "Logo (URL): ",
    async (url) => {
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 8000,
        });

        const resizedBuffer = await sharp(response.data)
          .resize(512, 512, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("png")
          .toBuffer();

        const b64 = resizedBuffer.toString("base64");
        return `data:image/png;base64,${b64}`;
      } catch (e) {
        return false;
      }
    },
    "Não foi possível processar a imagem. Verifique a URL!",
  );

  const rifa = {
    nome: nomeInput.toUpperCase(),
    premiacao: premiacaoInput.toUpperCase(),
    data: dataInput,
    preco: parseFloat(precoInput.replace(",", ".")).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    folhas: folhasInput,
    template: templateInput,
    logo: logoInput,
  };

  const taskId = randomUUID();

  const dados = `
===========================================
               DADOS DA RIFA
===========================================
📌 Nome:      ${rifa.nome.toUpperCase()}
🎁 Prêmio:    ${rifa.premiacao.toUpperCase()}
📅 Sorteio:   ${rifa.data}
💰 Valor:     R$ ${rifa.preco}
📄 Folhas:    ${rifa.folhas} folhas
🎨 Layout:    Template ${rifa.template} linhas
🖼️ Logo:      ${rifa.logo ? "Carregada!" : "Não enviada!"}
🏷️ ID:        ${taskId}
============================================
`;

  logger.info(dados);

  const confirm = await ask(
    "Gerar rifa (s/n)? ",
    (val) => /^(s|sim|n|não|nao)$/i.test(val.trim()),
    'Responda com "s" para sim ou "n" para não.',
  );

  if (/^n/i.test(confirm)) {
    logger.warn("Operação cancelada. Tchau!");
    rl.close();
    return;
  }

  logger.info("Gerando rifa...");
  gerarRifa(rifa, taskId);

  rl.close();
})();
