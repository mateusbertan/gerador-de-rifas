/* ------------------------------- INPUTS -------------------------------
 * nome               = nome da rifa.
 * premiacao          = premição da rifa.
 * data               = data do sorteio.
 * preco              = preço de cada número da rifa.
 * logo               = imagem da logo da rifa.
 * template           = template da rifa (números por folha).
 * vendedor           = se o nome dos vendedores serão atribuidos manualmente ou via lista de vendedores.
 * quantidadeDeFolhas = quantidade de folhas a ser gerado.
 * listaVendedores    = lista com todos os vendedores e suas respectivas turmas.
 * folhasPorVendedor  = quantidade de folhas que serão atribuídas para cada vendedor.
 * folhasExtra        = quantidade de folhas extra (com nome do vendedor a ser atribuido manualmente) que serão geradas.
 *
 * OBS.: O input "quantidadeDeFolhas" só é visível caso o vendedor estiver como "manual". Enquanto, os inputs
 *       "listaVendedores", "folhasPorVendedor" e "folhasExtra" só são visíveis caso o vendedor estiver como "auto".
 */

/* ------------------------------- VALIDAÇÃO -------------------------------
 * nome               = string entre 4 e 25 caracteres.
 * premiacao          = string entre 4 e 20 caracteres.
 * data               = string com DD/MM válido.
 * preco              = string com preço formatado (XX,XX) entre 0,01 e 99,99.
 * logo               = string com base64 em aspecto 1x1 com no máximo 512x512 pixels de resolução.
 * template           = número 20, 25 ou 30.
 * vendedor           = string "manual" ou "auto".
 * quantidadeDeFolhas = número entre 1 e 1000.
 * listaVendedores    = objeto com turmas e vendedores (máximo de 5 turmas e 35 vendedores por turma).
 * folhasPorVendedor  = número entre 1 e 5.
 * folhasExtra        = número entre 0 e 300.
 */

/* ------------------------------- FUNÇÕES -------------------------------
 * 1. Alteração do CSS do iframe
 *      Injeta um CSS que remove as bordas de desenvolvimento presentes no template e oculta possível overflow.
 * 2. Máscara de inputs
 *    2.1. Máscara de data
 *           Valida se os caracteres correspondem ao esperado (somente números) e se formam uma data válida, além de autocompletar com a /.
 *    2.2. Máscara de preço
 *           Valida se os caracteres correspondem ao esperado (somente números) e se formam um preço válido dentro do mínimo e máximo
 *           esperando, além de autocompletar com a vírgula.
 *    2.3. Máscara do número de folhas
 *           Valida se os caracteres correspondem ao esperado (somente números) e se formam um valor dentro
 *           do máximo esperando. Além disso, também atualiza a variável de página máxima.
 *    2.4. Máscara das folhas por vendedor
 *           Valida se os caracteres correspondem ao esperado (somente números) e se formam um valor dentro
 *           do máximo esperando.
 *    2.5. Máscara das folhas extra
 *           Valida se os caracteres correspondem ao esperado (somente números) e se formam um valor dentro
 *           do máximo esperando.
 * 3. Alternação dos inputs dependendo do tipo de vendedor
 *      Identifica se o input do vendendor é "auto" ou "manual" e altera o display, required e value dos respectivos inputs e labels.
 * 4. Atualização em tempo real do preview
 *      Altera os valores dos placeholders do preview com os valores padrão, e adiciona um evento para atualizar os placeholders após
 *      qualquer alteração no valor dos inputs e chama a função 11.
 * 5. Atualização do template no iframe
 *      Altera o caminho do iframe do preview de acordo com o valor do template do input de template.
 * 6. Mudança da visibilidade do iframe
 *      Recebendo true (1) ou false (0) como parâmetro e define a visibilidade do iframe do preview.
 * 7. Processamento da logo
 *      Verifica se a logo enviada é uma imagem válida, se tem no máximo 1024x1024, avisa caso o aspecto não esteja correto, transforma a
 *      imagem em um base64 com 512x512 e salva esse valor no atributo "data-base64" do input da logo.
 * 8. Paginação
 *      De acordo com o clique, atualiza as variáveis de página atual.
 * 9. Envio do formulário.
 *      Envia a requisição para gerar a rifa, caso haja erro, mostra o erro na página, senão abre a conexão de WebSocket com o servidor e
 *      começa a receber as mensagens do progresso e por fim da rifa concluída.
 * 10. Processamento da lista de vendedores
 *      Valida a lista e adiciona o objeto com as turmas e pessoas ao datalist do input. 
 * 11. Atualizar informações
 *      Atualiza os elementos de informações da rifa.
 * 12. Atualizar número das páginas
 *      Atualiza o número total de páginas.
 */

/* ------------------------------- EVENTOS -------------------------------
 * A. Carregamento da página
 *      Reseta o formulário e chama a função 4.
 * B. Carregamento do iframe
 *      Chama as funções 1, 4 e 6.
 * C. Input nos inputs
 *    C.1. Input de data
 *           Chama a função 2.1.
 *    C.2. Input de preço
 *           Chama a função 2.2.
 *    C.3. Input do número de folhas
 *           Chama a função 2.3.
 *    C.4. Input da logo
 *           Chama a função 7.
 *    C.5. Input da lista de vendedores
 *           Chama a função 10.
 *    C.6. Input nas folhas por vendedor
 *           Chama a função 2.4.
 *    C.7. Input nas folhas extra
 *           Chama a função 2.5.
 * D. Alteração no select de tipo de vendedor
 *      Chama a função 3.
 * E. Alteração no select do template
 *      Chama a função 5 e 6.
 * F. Clique nos botões de paginação
 *      Chama a função 8.
 * G. Envio do formulário
 *      Chama a função 9.
 */

import { io } from '/assets/socket.io.min.js';

const websocketServer = 'ws://localhost:3000/';

const defaults = {
  nome: 'RIFA DE PÁSCOA',
  premiacao: 'CESTA DE CHOCOLATES',
  data: '06/04',
  preco: '2,00',
  template: 20,
  quantidadeDeFolhas: 100,
  folhasPorVendedor: 2,
  folhasExtra: 50
};

const iframe = document.getElementById('preview');
const form = document.getElementById('dados');

const inputs = {
  nome: document.getElementById('nome'),
  premiacao: document.getElementById('premiacao'),
  data: document.getElementById('data'),
  preco: document.getElementById('preco'),
  logo: document.getElementById('logo'),
  template: document.getElementById('template'),
  vendedor: document.getElementById('vendedor'),
  quantidadeDeFolhas: document.getElementById('quantidadeDeFolhas'),
  listaVendedores: document.getElementById('listaVendedores'),
  folhasPorVendedor: document.getElementById('folhasPorVendedor'),
  folhasExtra: document.getElementById('folhasExtra')
};

const labels = {
  listaVendedores: document.querySelector('label[for="listaVendedores"]'),
  folhasPorVendedor: document.querySelector('label[for="folhasPorVendedor"]'),
  folhasExtra: document.querySelector('label[for="folhasExtra"]'),
  quantidadeDeFolhas: document.querySelector('label[for="quantidadeDeFolhas"]')
};

const buttons = {
  submit: document.getElementById('submitButton'),
  previousPage: document.getElementById('previousPageButton'),
  nextPage: document.getElementById('nextPageButton')
};

const pagination = {
  currentPage: document.getElementById('currentPage'),
  totalPages: document.getElementById('totalPages')
};

const info = {
  numeros: document.getElementById('infoNumeros'),
  arrecadacao: document.getElementById('infoArrecadacao')
};

const progress = {
  totalPages: document.getElementById('totalPages'),
  currentPage: document.getElementById('currentPage'),
  container: document.getElementById('progressContainer'),
  message: document.getElementById('message'),
  currentPage: document.getElementById('currentPageProgress'),
  maxPage: document.getElementById('maxPageProgress'),
  percentage: document.getElementById('percentageProgress'),
  bar: document.getElementById('progressBar')
};

const setInputsDisabled = (status) => {
  Object.values(inputs).forEach(input => {
    if (input) input.disabled = status;
  });
};

let currentPage = 1;
let totalPages = 100;
let autoVendedor = false;

// 1. Alteração do CSS do iframe
function updateIframeStyle(iframe) {
  const doc = iframe.contentDocument;

  const style = doc.createElement('style');
  style.textContent = `
    body {
      border: none !important;
      overflow: hidden !important;
    }
  `;

  doc.head.appendChild(style);
};

// 2.1. Máscara de data
let lastValidData = '';
function useDataMask(event) {
  let input = event.target
  let value = input.value;

  if (event.inputType === 'deleteContentBackward') {
    lastValidData = value;
    return;
  };

  let onlyNumbers = value.replace(/\D/g, '');
  let formated = '';

  if (onlyNumbers.length > 0) {
    let diaStr = onlyNumbers.slice(0, 2);
    let diaNum = parseInt(diaStr);

    if (parseInt(diaStr[0]) > 3) {
      input.value = lastValidData;
      return;
    };

    if (diaStr.length === 2) {
      if (diaNum < 1 || diaNum > 31) {
        input.value = lastValidData;
        return;
      };
      formated = diaStr + '/';
    } else {
      formated = diaStr;
    };

    if (onlyNumbers.length > 2) {
      let mesStr = onlyNumbers.slice(2, 4);

      if (parseInt(mesStr[0]) > 1) {
        input.value = lastValidData;
        return;
      };

      if (mesStr.length === 2) {
        let m = parseInt(mesStr);
        let d = parseInt(diaStr);

        if (m < 1 || m > 12) {
          input.value = lastValidData;
          return;
        };

        const diasPorMes = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (d > diasPorMes[m]) {
          input.value = lastValidData;
          return;
        };
        formated += mesStr;
      } else {
        formated += mesStr;
      };
    };
  };
  input.value = formated;
  lastValidData = formated;
};

// 2.2. Máscara de preço
function usePriceMask(input) {
  function format(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    return (Number(v) / 100).toFixed(2).replace('.', ',');
  };

  let max = Number(input.getAttribute('max'));
  let v = input.value.replace(/\D/g, '');

  if (max) {
    let decimal = Number(v || '0') / 100;
    if (decimal > max) {
      v = v.slice(0, -1);
    };
  };
  input.value = format(v);
};

// 2.3. Máscara do número de folhas
let lastValidPages = '';
function usePagesMask(input) {
  let value = input.value;

  let onlyNumbers = value.replace(/\D/g, '');

  if (onlyNumbers === '') {
    input.value = '';
    lastValidPages = '';
    return;
  };

  let numericValue = parseInt(onlyNumbers);

  if (numericValue > input.max || numericValue < input.min) {
    input.value = lastValidPages;
  } else {
    input.value = numericValue.toString();
    lastValidPages = input.value;
  };

  updatePageNumber();

  currentPage = 1;
  progress.currentPage.textContent = currentPage;
};

// 2.4. Máscara das folhas por vendedor
let lastValidFolhasPorVendedor = '';
function useFolhasPorVendedorMask(input) {
  let value = input.value;

  let onlyNumbers = value.replace(/\D/g, '');

  if (onlyNumbers === '') {
    input.value = '';
    lastValidFolhasPorVendedor = '';
    return;
  };

  let numericValue = parseInt(onlyNumbers);

  if (numericValue > input.max || numericValue < input.min) {
    input.value = lastValidFolhasPorVendedor;
  } else {
    input.value = numericValue.toString();
    lastValidFolhasPorVendedor = input.value;
  };

  updatePageNumber();
};

// 2.5. Máscara das folhas extra
let lastValidFolhasExtra = '';
function useFolhasExtraMask(input) {
  let value = input.value;

  let onlyNumbers = value.replace(/\D/g, '');

  if (onlyNumbers === '') {
    input.value = '';
    lastValidFolhasExtra = '';
    return;
  };

  let numericValue = parseInt(onlyNumbers);

  if (numericValue > input.max || numericValue < input.min) {
    input.value = lastValidFolhasExtra;
  } else {
    input.value = numericValue.toString();
    lastValidFolhasExtra = input.value;
  };

  updatePageNumber();
};

// 3. Alternação dos inputs dependendo do tipo de vendedor
function toggleVendedorInputs(input) {
  const isAutomatico = input.value === "true";

  if (isAutomatico) {
    inputs.listaVendedores.style.display = "block";
    labels.listaVendedores.style.display = "block";
    inputs.listaVendedores.required = true;

    inputs.folhasPorVendedor.style.display = "block";
    labels.folhasPorVendedor.style.display = "block";
    inputs.folhasPorVendedor.required = true;

    inputs.folhasExtra.style.display = "block";
    labels.folhasExtra.style.display = "block";
    inputs.folhasExtra.required = true;

    inputs.quantidadeDeFolhas.style.display = "none";
    labels.quantidadeDeFolhas.style.display = "none";
    inputs.quantidadeDeFolhas.required = false;
    inputs.quantidadeDeFolhas.value = "";

    autoVendedor = true;
  } else {
    inputs.listaVendedores.style.display = "none";
    labels.listaVendedores.style.display = "none";
    inputs.listaVendedores.required = false;
    inputs.listaVendedores.value = "";
    inputs.listaVendedores.dataset.lista = "";

    inputs.folhasPorVendedor.style.display = "none";
    labels.folhasPorVendedor.style.display = "none";
    inputs.folhasPorVendedor.required = false;
    inputs.folhasPorVendedor.value = "";

    inputs.folhasExtra.style.display = "none";
    labels.folhasExtra.style.display = "none";
    inputs.folhasExtra.required = false;
    inputs.folhasExtra.value = "";

    inputs.quantidadeDeFolhas.style.display = "block";
    labels.quantidadeDeFolhas.style.display = "block";
    inputs.quantidadeDeFolhas.required = true;

    autoVendedor = false;
  };

  updatePageNumber();
};

// 4. Atualização em tempo real do preview
function updatePlaceholders(iframe) {
  const doc = iframe.contentDocument;

  const vendedorElement = doc.querySelector(`[data-placeholder="vendedor"]`);
  vendedorElement.textContent = '________________';

  function update() {
    updateInfo();
    const template = Number(inputs.template.value);

    for (let i = 1; i < template + 1; i++) {
      const el = doc.querySelector(`[data-placeholder="n${i}"]`);

      if (!el) return;

      el.textContent = `${i + ((currentPage - 1) * template)}`;
    };

    Object.entries(inputs).forEach(([key, input]) => {
      const el = doc.querySelector(`[data-placeholder="${key}"]`);

      if (key == 'logo') {
        if (!input.dataset.base64) return;
        el.src = input.dataset.base64;
        return;
      };

      if (autoVendedor) {
        const folhasExtra = inputs.folhasExtra.value || defaults.folhasExtra;

        const folhasPorVendedor = Number(inputs.folhasPorVendedor.value || defaults.folhasPorVendedor);
        const vendedores = inputs.listaVendedores.dataset.lista ? Object.values(JSON.parse(inputs.listaVendedores.dataset.lista)).flat() : undefined;

        if (!vendedores || currentPage > (vendedores.length * folhasPorVendedor)) return;

        vendedorElement.textContent = vendedores[Math.ceil((currentPage) / folhasPorVendedor) - 1];
      };

      if (!el || key == 'vendedor') return;

      el.textContent = input.value.toUpperCase() || defaults[key].toUpperCase() || el.textContent.toUpperCase();
    });
  };

  Object.values(inputs).forEach(input => {
    if (input.id == 'vendedor') return;
    input.addEventListener('input', update);
  });

  update();
};

// 5. Atualização do template no iframe
function updatePreviewTemplate(input) {
  if (iframe.src != `/templates/rifa_${input.value}l.html`) {
    iframe.src = `/templates/rifa_${input.value}l.html`;
  };
};

// 6. Mudança da visibilidade do iframe
function changeIframeVisibility(iframe, state) {
  if (state == 1) {
    iframe.style.opacity = 1;
  } else {
    iframe.style.opacity = 0;
  };
};

// 7. Processamento da logo
function processLogo(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('A logo precisa ser uma imagem válida.');
    input.value = '';
    return;
  };

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      const width = img.width;
      const height = img.height;

      if (width > 1024 || height > 1024) {
        alert('A imagem não deve ter mais de 1024x1024 pixels.');
        input.value = '';
        return;
      };

      if (width !== height) {
        alert('Aviso: A imagem não tem proporção quadrada (1:1). Pode haver distorção.');
      };

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 512;
      
      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(img, 0, 0, size, size);

      const base64 = canvas.toDataURL('image/png');

      input.setAttribute('data-base64', base64);

      updatePlaceholders(iframe);
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
};

// 8. Paginação
function doPagination(event) {
  if (event.type === 'click') {
    if (event.target.classList.contains('previousClick')) {
      if (currentPage == 1) return;
      currentPage--;
      updatePlaceholders(iframe);
      pagination.currentPage.textContent = currentPage;
    } else {
      if (currentPage >= totalPages) return;
      currentPage++;
      updatePlaceholders(iframe);
      pagination.currentPage.textContent = currentPage;
    };
  };
};

// 9. Envio do formulário
async function formSubmit(event) {
  event.preventDefault();

  buttons.submit.disabled = true;
  buttons.submit.innerText = 'Enviando...';
  buttons.submit.style.cursor = 'not-allowed';

  setInputsDisabled(true);

  const manualPayload = {
    vendedor: false,
    nome: inputs.nome.value,
    premiacao: inputs.premiacao.value,
    data: inputs.data.value,
    preco: inputs.preco.value,
    folhas: inputs.quantidadeDeFolhas.value,
    template: inputs.template.value,
    logo: inputs.logo.dataset.base64
  };

  const autoPayload = {
    vendedor: true,
    nome: inputs.nome.value,
    premiacao: inputs.premiacao.value,
    data: inputs.data.value,
    preco: inputs.preco.value,
    folhasPorVendedor: inputs.folhasPorVendedor.value,
    folhasExtra: inputs.folhasExtra.value,
    listaVendedores: inputs.listaVendedores.dataset.lista,
    template: inputs.template.value,
    logo: inputs.logo.dataset.base64
  };

  try {
    const response = await fetch('/gerar-rifa', {
      method: 'POST',
      body: JSON.stringify(autoVendedor ? autoPayload : manualPayload),
      headers: { 'Content-type': 'application/json' }
    });

    const data = await response.json();

    if (data.error) {
      console.log(`Erro: ${data.error}`);
      progress.message.style.visibility = 'visible';
      progress.message.innerHTML = `<p><b>Erro:</b> ${data.error}</p>`;
      buttons.submit.disabled = false;
      buttons.submit.innerText = 'Gerar';
      buttons.submit.style.cursor = 'pointer';
      setInputsDisabled(false);
      return;
    };

    progress.message.style.visibility = 'hidden';
    buttons.submit.innerText = 'Iniciando geração...';
    progress.maxPage.innerText = totalPages;
    progress.container.style.visibility = 'visible';

    console.log(`Task ID: ${data.taskId}`);

    const socket = new io(websocketServer);

    socket.on('connect', () => {
      console.log('Websocket conectado!');
      socket.emit('join-task', data.taskId);
      buttons.submit.innerText = 'Gerando...';
    });

    socket.on('progress', (data) => {
      console.log(`Progresso: ${data.percent}% | ${data.page} páginas`);
      progress.currentPage.innerText = data.page;
      progress.percentage.innerText = `${Math.round(data.percent)}%`;
      progress.bar.style.setProperty('--progress', `${data.percent}%`);
    });

    socket.on('finished', (data) => {
      console.log(`Rifa finalizada: ${data.url}`);
      buttons.submit.innerHTML = `<a href="${data.url}" target="_blank">Finalizado!</a>`;
      window.open(data.url, '_blank');
      setInputsDisabled(false);
    });

    socket.on('rifa_error', (data) => {
      progress.message.style.visibility = 'visible';
      progress.message.innerHTML = '<p><strong>Erro:</strong> Ocorreu um erro inesperado.</p>';
      progress.currentPage.innerText = 0;
      progress.percentage.innerText = `0%`;
      progress.bar.style.setProperty('--progress', `0%`);
      progress.container.style.visibility = 'hidden';
      buttons.submit.disabled = false;
      buttons.submit.innerText = 'Gerar';
      buttons.submit.style.cursor = 'pointer';
      setInputsDisabled(false);
    });
  } catch (error) {
    console.error(error);
    progress.message.style.visibility = 'visible';
    progress.message.innerHTML = '<p><strong>Erro:</strong> Não foi possível conectar ao servidor.</p>';
    buttons.submit.disabled = false;
    buttons.submit.innerText = 'Gerar';
    buttons.submit.style.cursor = 'pointer';
    setInputsDisabled(false);
  };
};

// 10. Processamento da lista de vendedores
function processList(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    const content = event.target.result;

    if (typeof content === 'string') {
      function validateFileContent(content) {
        const groups = content
          .split(/\n\s*\n/)
          .map(g => g.trim())
          .filter(g => g.length > 0);

        if (groups.length < 1) {
          return { valid: false, error: 'Nenhuma turma identificada.' };
        };

        if (groups.length > 5) {
          return { valid: false, error: 'Máximo de 5 turmas permitidas.' };
        };

        for (let i = 0; i < groups.length; i++) {
          const lines = groups[i]
            .split('\n')
            .map(l => l.trim());

          if (lines.length < 2 || lines.length > 36) {
            return {
              valid: false,
              error: `As turmas devem ter entre 1 e 35 pessoas.`
            };
          };

          for (let j = 0; j < lines.length; j++) {
            if (lines[j].length > 20) {
              return {
                valid: false,
                error: `Máximo de 20 caracteres.`
              };
            };
          };
        };

        return { valid: true };
      };

      function processData(content) {
        const lista = {};

        const groups = content
          .split(/\n\s*\n/)
          .map(g => g.trim())
          .filter(g => g.length > 0);

        groups.forEach((group) => {
          const groupName = group.split(/\r?\n/)[0];
          const people = group
            .split('\n')
            .map(l => l.trim());

          let peopleList = [];
          people.forEach((person) => {
            if (person === groupName) return;
            peopleList.push(person);
          });
          lista[groupName] = peopleList;
        });
        
        return lista;
      };


      const result = validateFileContent(content);

      if (!result.valid) {
        alert(result.error);
        input.value = '';
        return;
      };

      const listaVend = processData(content);

      input.setAttribute('data-lista', JSON.stringify(listaVend));

      updatePlaceholders(iframe);

      updatePageNumber();
      updateInfo();
    } else {
      alert('A lista precisa ser um arquivo de texto válido.');
      input.value = '';
      return;
    };
  };

  reader.readAsText(file);
};

// 11. Atualizar informações
function updateInfo() {
  const totalNumbers = totalPages * Number(inputs.template.value || defaults.template);
  info.numeros.textContent = totalNumbers;
  info.arrecadacao.textContent = Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalNumbers * Number(inputs.preco.value.replace(',', '.') || defaults.preco.replace(',', '.')));
};

// 12. Atualizar número das páginas
function updatePageNumber() {
  totalPages = autoVendedor ?
  ((Number(inputs.folhasExtra.value || defaults.folhasExtra)) + ((Number(inputs.folhasPorVendedor.value || defaults.folhasPorVendedor) * Number(inputs.listaVendedores.dataset.lista ? Object.values(JSON.parse(inputs.listaVendedores.dataset.lista)).flat().length : 0)))) :
  (Number(inputs.quantidadeDeFolhas.value || defaults.quantidadeDeFolhas));

  pagination.totalPages.textContent = totalPages;

  currentPage = 1;
  pagination.currentPage.innerText = currentPage;
};

// A. Carregamento da página
window.addEventListener('load', () => {
  form.reset();
  updatePlaceholders(iframe);
});

// B. Carregamento do iframe
iframe.addEventListener('load', () => {
  updateIframeStyle(iframe);
  updatePlaceholders(iframe);
  setTimeout(() => changeIframeVisibility(iframe, true), 300);
});

// C.1. Input de data
inputs.data.addEventListener('input', (event) => {
  useDataMask(event);
});

// C.2. Input de preço
inputs.preco.addEventListener('input', (event) => {
  usePriceMask(event.target);
});

// C.3. Input de folhas
inputs.quantidadeDeFolhas.addEventListener('input', (event) => {
  usePagesMask(event.target);
});

// C.4. Input da logo
inputs.logo.addEventListener('input', (event) => {
  processLogo(event.target);
});

// C.5. Input da lista de vendedores
inputs.listaVendedores.addEventListener('input', (event) => {
  processList(event.target);
});

// C.6. Input de folhas por vendedor
inputs.folhasPorVendedor.addEventListener('input', (event) => {
  useFolhasPorVendedorMask(event.target);
});

// C.7. Input de folhas extra
inputs.folhasExtra.addEventListener('input', (event) => {
  useFolhasExtraMask(event.target);
});

// D. Alteração no select de tipo de vendedor 
inputs.vendedor.addEventListener('change', (event) => {
  toggleVendedorInputs(event.target);
  updatePlaceholders(iframe);
  updateInfo();
});

// E. Alteração no select do template
inputs.template.addEventListener('change', (event) => {
  changeIframeVisibility(iframe, false, 0);
  setTimeout(() => updatePreviewTemplate(event.target), 200);
});

// F. Clique nos botões de paginação
[buttons.previousPage, buttons.nextPage].forEach((button) => {
  button.addEventListener('click', (event) => {
    doPagination(event);
  });
});

// G. Envio do formulário
form.addEventListener('submit', async (event) => {
  formSubmit(event);
});
