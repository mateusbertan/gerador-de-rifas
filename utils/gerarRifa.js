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
  let vendedores = [];
  let totalFolhas;

  if (rifa.vendedor) {
    const lista = JSON.parse(rifa.listaVendedores);
    totalFolhas = Number(rifa.folhasExtra) + (Number(rifa.folhasPorVendedor) * Object.values(lista).flat().length);

    Object.values(lista).flat().forEach((person) => {
      for (let i = 0; i < Number(rifa.folhasPorVendedor); i++) {
        vendedores.push(person);
      };
    });

    for (let i = 0; i < Number(rifa.folhasExtra); i++) {
      vendedores.push('________________');
    };
  } else {
    totalFolhas = Number(rifa.folhas);
  };

  const bar = io ? undefined : logger.progress.start(totalFolhas, 0);

  for (let i = 0; i < totalFolhas; i++) {
    let html = template
      .replace(/{{VENDEDOR}}/g, rifa.vendedor ? vendedores[i] : '________________')
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

    const percent = Math.round(((i + 1) / totalFolhas) * 100);

    if (bar) bar.increment();

    if (io) io.to(taskId).emit('progress', {
      page: i + 1,
      percent
    });
  };

  if (!fs.existsSync(`${generatedPath}/${taskId}`)) {
    fs.mkdirSync(`${generatedPath}/${taskId}`, { recursive: true });
  };

  if (bar) logger.progress.stop();

  pdfFinal.setTitle(rifa.nome);
  pdfFinal.setProducer('Gerador de Rifas - Desenvolvido por Mateus Bertan');
  pdfFinal.setCreationDate(new Date());
  pdfFinal.setModificationDate(new Date());

  const pdfBytes = await pdfFinal.save();

  const outputFile = `${generatedPath}/${taskId}/${rifa.nome}.pdf`;

  fs.writeFileSync(outputFile, pdfBytes);

  await browser.close();

  if (io) io.to(taskId).emit('finished', {
    url:`/rifas/${taskId}/${rifa.nome}.pdf`
  });

  if (!io) logger.info(`Rifa gerada: ${outputFile}`);
};
