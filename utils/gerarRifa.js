import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

import logger from './logger.js';

const templatesPath = './templates';
const generatedPath = './rifas_geradas';

export default async function gerarRifa(rifa, taskId, io) {
  const template = fs.readFileSync(`${templatesPath}/rifa_${rifa.template}l.html`, 'utf8');
  const templateListaVendedores = fs.readFileSync(`${templatesPath}/lista_vendedores.html`, 'utf8');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const pdfFinal = await PDFDocument.create();

  let htmlFinal = '';
  let numeroAtual = 1;
  let totalFolhas;
  let vendedores = [];
  let paginasVendedores = [];

  if (rifa.vendedor) {
    const lista = JSON.parse(rifa.listaVendedores);
    const turmas = Object.keys(lista).length;
    const folhasVendedorExtra = Math.ceil(Number(rifa.folhasExtra) / (35 * Number(rifa.folhasPorVendedor)));
    const folhasDeVendedores = turmas + folhasVendedorExtra;

    totalFolhas = folhasDeVendedores + Number(rifa.folhasExtra) + (Number(rifa.folhasPorVendedor) * Object.values(lista).flat().length);

    const vendedorFolhas = [];

    let offset = 0;
    paginasVendedores = Object.values(lista).map(turma => {
      const result = offset;
      offset += (turma.length * Number(rifa.folhasPorVendedor) + 1);
      return result;
    });

    for (let i = 1; i <= folhasVendedorExtra; i++) {
      if (i == 1) paginasVendedores.push(totalFolhas - Number(rifa.folhasExtra) - folhasVendedorExtra);
      if (i > 1) paginasVendedores.push(paginasVendedores.at(-1) + 1)
    };

    Object.entries(lista).forEach(([group, people]) => {
      vendedores.push('');

      people.forEach((person) => {
        vendedores.push(...Array(Number(rifa.folhasPorVendedor)).fill(person));
      });
    });

    vendedores.push(...Array(folhasVendedorExtra).fill(''));
    vendedores.push(...Array(Number(rifa.folhasExtra)).fill('__________________'));
  } else {
    totalFolhas = Number(rifa.folhas);
  };

  const bar = io ? undefined : logger.progress.start(totalFolhas, 0);

  let ultimoNumero = 1;
  const soma = rifa.vendedor ? (Number(rifa.template) * Number(rifa.folhasPorVendedor)) : undefined;

  for (let i = 0; i < totalFolhas; i++) {
    let html;

    if (paginasVendedores.includes(i)) {
      const lista = JSON.parse(rifa.listaVendedores);

      html = templateListaVendedores
        .replace(/{{RIFA}}/g, rifa.nome.toUpperCase())
        .replace(/{{DATA}}/g, rifa.data)
        .replace(/<img[^>]+>/, `<img src="${rifa.logo}" alt="Logo">`);

      const index = paginasVendedores.indexOf(i);

      if (index >= Object.keys(lista).length) {
        html = html
          .replace(/{{TURMA}}/g, '<em>Folhas Extra</em>');

        for (let n = 1; n <= 35; n++) {
          const nomeRegex = new RegExp(`{{NOME${n}}}`, 'g');
          const numeroRegex = new RegExp(`{{NUM${n}}}`, 'g');

          html = html
          .replace(nomeRegex, '&nbsp;')
          .replace(numeroRegex, '&nbsp;');
        };
      } else {
          html = html
            .replace(/{{TURMA}}/g, Object.keys(lista)[index]);
          
          for (let n = 1; n <= 35; n++) {
            const nomeRegex = new RegExp(`{{NOME${n}}}`, 'g');
            const numeroRegex = new RegExp(`{{NUM${n}}}`, 'g');

            html = html
            .replace(nomeRegex, Object.values(lista)[index] ? Object.values(lista)[index][n - 1] ?? '&nbsp;' : '&nbsp;')
            .replace(numeroRegex, Object.values(lista)[index] ? Object.values(lista)[index][n - 1] ? `${ultimoNumero} - ${ultimoNumero + (soma - 1)}`: '&nbsp;' : '&nbsp;');
            if (Object.values(lista)[index][n - 1]) ultimoNumero += soma;
          };
      };
    } else {
      html = template
        .replace(/{{VENDEDOR}}/g, rifa.vendedor ? vendedores[i] : '__________________')
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
    };

    htmlFinal = `
      ${html}
    `;

    await page.setContent(htmlFinal, { waitUntil: 'domcontentloaded' });

    const pageBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    const tempDoc = await PDFDocument.load(pageBuffer);
    const [copiedPage] = await pdfFinal.copyPages(tempDoc, [0]);
    pdfFinal.addPage(copiedPage);

    const percent = (((i + 1) / totalFolhas) * 100).toFixed(2);

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
