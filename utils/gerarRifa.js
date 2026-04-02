import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

import logger from './logger.js';

const templatesPath = './templates';
const generatedPath = './rifas_geradas';

export default async function gerarRifa(rifa, taskId, io) {
  const template = fs.readFileSync(`${templatesPath}/rifa_${rifa.template}l.html`, 'utf8');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const pdfFinal = await PDFDocument.create();

  let htmlFinal = '';
  let numeroAtual = 1;

  const bar = logger.progress.start(Number(rifa.folhas), 0);

  for (let i = 0; i < Number(rifa.folhas); i++) {
    let html = template
      .replace(/{{VENDEDOR}}/g, '________________')
      .replace(/{{RIFA}}/g, rifa.nome.toUpperCase())
      .replace(/{{PREMIAÇÃO}}/g, rifa.premiacao.toUpperCase())
      .replace(/{{DATA}}/g, rifa.data)
      .replace(/{{PREÇO}}/g, parseFloat(rifa.preco.replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
      .replace(/<img[^>]+>/, `<img src="${rifa.logo}" alt="Logo">`);

    for (let n = 1; n <= Number(rifa.template); n++) {
      const num = numeroAtual++;
      const regex = new RegExp(`{{N${n}}}`, "g");
      html = html.replace(regex, num);
    };

    htmlFinal = `
      <div class="page" style="page-break-after: always;">
        ${html}
      </div>
    `;

    await page.setContent(htmlFinal, { waitUntil: 'domcontentloaded' });

    const pageBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    const tempDoc = await PDFDocument.load(pageBuffer);
    const [copiedPage] = await pdfFinal.copyPages(tempDoc, [0]);
    pdfFinal.addPage(copiedPage);

    const percent = Math.round(((i + 1) / rifa.folhas) * 100);

    bar.increment();

    if (io) io.emit(taskId, {
      type: 'progress',
      page: i + 1,
      percent
    });
  };

  if (!fs.existsSync(`${generatedPath}/${taskId}`)) {
    fs.mkdirSync(`${generatedPath}/${taskId}`, { recursive: true });
  };

  logger.progress.stop();
  logger.info('Salvando o PDF...');

  pdfFinal.setTitle(rifa.nome);
  pdfFinal.setProducer('Gerador de Rifas - Desenvolvido por Mateus Bertan');
  pdfFinal.setCreationDate(new Date());
  pdfFinal.setModificationDate(new Date());

  const pdfBytes = await pdfFinal.save();

  const outputFile = `${generatedPath}/${taskId}/${rifa.nome}.pdf`;

  fs.writeFileSync(outputFile, pdfBytes);

  await browser.close();

  if (io) io.emit(taskId, {
    type: 'finished',
    url:`/rifas/${taskId}/${rifa.nome}.pdf`
  });

  logger.info(`Rifa gerada com sucesso: ${outputFile}`);
};
