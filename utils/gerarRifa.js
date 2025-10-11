import fs from 'node:fs';
import puppeteer from 'puppeteer';
import logger from './logger.js';

const templatesPath = './templates';
const generatedPath = './rifas_geradas';

export async function gerarRifa(rifa) {
  const template = fs.readFileSync(`${templatesPath}/rifa_${rifa.template}l.html`, "utf8");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let htmlFinal = '';
  let numeroAtual = 1;

  for (let i = 0; i < rifa.paginas; i++) {
    let html = template
      .replace(/{{VENDEDOR}}/g, rifa.vendedor)
      .replace(/{{RIFA}}/g, rifa.nome.toUpperCase())
      .replace(/{{PREMIAÇÃO}}/g, rifa.premiacao.toUpperCase())
      .replace(/{{DATA}}/g, rifa.data)
      .replace(/{{PREÇO}}/g, rifa.preco);

    html = html.replace(
      '<img src="img/logo.png" alt="Template Logo">',
      `<img src="${rifa.logo}" alt="Logo">`
    );

    for (let n = 1; n <= rifa.template; n++) {
      const num = numeroAtual++;
      const regex = new RegExp(`{{N${n}}}`, "g");
      html = html.replace(regex, num);
    }

    htmlFinal += `
      <div class="page" style="page-break-after: always;">
        ${html}
      </div>
    `;
  }

  await page.setContent(htmlFinal, { waitUntil: 'networkidle0' });

  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath, { recursive: true });
  }

  const outputFile = `${generatedPath}/${rifa.nome}.pdf`;

  await page.pdf({
    path: outputFile,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });

  logger.info(`Rifa gerada com sucesso: ${outputFile}`);

  await browser.close();
}
