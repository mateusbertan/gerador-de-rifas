import fs from 'node:fs';
import path from 'node:path';
import puppeteer from "puppeteer";

const templatesPath = "./templates";
const generatedPath = "./rifas_geradas";

export async function gerarRifa(rifa) {
  const template = fs.readFileSync(`${templatesPath}/template_${rifa.template}l.html`, "utf8");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let htmlFinal = "";
  let numeroAtual = 1;

  for (let i = 0; i < rifa.paginas; i++) {
    let html = template
      .replace(/{{VENDEDOR}}/g, rifa.vendedor)
      .replace(/{{RIFA}}/g, rifa.nome)
      .replace(/{{PREMIAÇÃO}}/g, rifa.premiacao)
      .replace(/{{DATA}}/g, rifa.data)
      .replace(/{{PREÇO}}/g, rifa.preco);

    // Temporário enquanto não faço o sistema de imagem
    const imgPath = `${templatesPath}/img/template-logo.png`;
    const imgBase64 = fs.readFileSync(imgPath, { encoding: "base64" });

    html = html.replace(
      '<img src="img/template-logo.png" alt="Template Logo">',
      `<img src="data:image/png;base64,${imgBase64}" alt="Logo">`
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

  await page.setContent(htmlFinal, { waitUntil: "networkidle0" });

  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath, { recursive: true });
  }

  const outputFile = `${generatedPath}/${rifa.nome}.pdf`;

  await page.pdf({
    path: outputFile,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
  });

  console.log(`Rifa gerada com sucesso: ${outputFile}`);

  await browser.close();
}
