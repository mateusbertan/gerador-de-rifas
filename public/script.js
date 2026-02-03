const iframe = document.getElementById('preview');

const defaults = {
  nome: 'RIFA DE PÁSCOA',
  premiacao: 'CESTA DE CHOCOLATES',
  data: '06/04',
  preco: '2,00'
};

const inputs = {
  nome: document.getElementById('nome'),
  premiacao: document.getElementById('premiacao'),
  data: document.getElementById('data'),
  preco: document.getElementById('preco')
  // vendedor: document.getElementById('vendedor') // TODO
};

// Alterações no estilo da rifa dentro do preview
iframe.addEventListener('load', () => {
  const doc = iframe.contentDocument;

  const style = doc.createElement('style');
  style.textContent = `
      body {
        border: none !important;
        overflow: hidden !important;
      }
  `;

  doc.head.appendChild(style);
});

// Atualização em tempo real do preview
iframe.addEventListener('load', () => {
  const doc = iframe.contentDocument;

  function update() {
    Object.entries(inputs).forEach(([key, input]) => {
      const el = doc.querySelector(`[data-placeholder="${key}"]`);

      if (!el) return;

      el.textContent = input.value.toUpperCase() || defaults[key].toUpperCase() || el.textContent.toUpperCase();
    });
  };

  Object.values(inputs).forEach(input => {
    input.addEventListener('input', update);
  });

  update();
});

// Máscara para data
const inputData = document.getElementById('data');
let lastValidValue = "";

inputData.addEventListener('input', (e) => {
  let value = e.target.value;

  if (e.inputType === "deleteContentBackward") {
    lastValidValue = value;
    return;
  };

  let apenasNumeros = value.replace(/\D/g, "");
  let formatado = "";

  if (apenasNumeros.length > 0) {
    let diaStr = apenasNumeros.slice(0, 2);
    let diaNum = parseInt(diaStr);

    if (parseInt(diaStr[0]) > 3) {
      e.target.value = lastValidValue;
      return;
    };

    if (diaStr.length === 2) {
      if (diaNum < 1 || diaNum > 31) {
        e.target.value = lastValidValue;
        return;
      };
      formatado = diaStr + "/";
    } else {
      formatado = diaStr;
    };

    if (apenasNumeros.length > 2) {
      let mesStr = apenasNumeros.slice(2, 4);

      if (parseInt(mesStr[0]) > 1) {
        e.target.value = lastValidValue;
        return;
      };

      if (mesStr.length === 2) {
        let m = parseInt(mesStr);
        let d = parseInt(diaStr);

        if (m < 1 || m > 12) {
          e.target.value = lastValidValue;
          return;
        };

        const diasPorMes = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (d > diasPorMes[m]) {
          e.target.value = lastValidValue;
          return;
        };
        formatado += mesStr;
      } else {
        formatado += mesStr;
      };
    };
  };
  e.target.value = formatado;
  lastValidValue = formatado;
});

// Máscara para preço
const inputPreco = document.getElementById('preco');

inputPreco.addEventListener('input', () => {
  function format(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    return (Number(v) / 100).toFixed(2).replace('.', ',');
  };

  let max = Number(inputPreco.getAttribute('max'));
  let v = inputPreco.value.replace(/\D/g, '');

  if (max) {
    let decimal = Number(v || '0') / 100;
    if (decimal > max) {
      v = v.slice(0, -1);
    };
  };
  inputPreco.value = format(v);
});

// Máscara para número de páginas
const inputPaginas = document.getElementById('paginas');
let lastValidPaginas = "";

inputPaginas.type = "text";
inputPaginas.inputMode = "numeric";

inputPaginas.addEventListener('input', (e) => {
  let value = e.target.value;

  let apenasNumeros = value.replace(/\D/g, "");

  if (apenasNumeros === "") {
    e.target.value = "";
    lastValidPaginas = "";
    return;
  };

  let valorNumerico = parseInt(apenasNumeros);

  if (valorNumerico > 1000) {
    e.target.value = lastValidPaginas;
  } else {
    e.target.value = valorNumerico.toString();
    lastValidPaginas = e.target.value;
  };
});

inputPaginas.addEventListener('blur', (e) => {
  if (e.target.value === "" || parseInt(e.target.value) < 1) {
    e.target.value = "1";
    lastValidPaginas = "1";
  };
});

// Atualiza o preview de acordo com a quantidade de números por página
const selectNumeros = document.getElementById('numeros');
const previewIframe = document.getElementById('preview');

selectNumeros.addEventListener('change', (e) => {
  const valor = e.target.value;
  previewIframe.src = `/templates/rifa_${valor}l.html`;
});

// Habilita o input da lista dos vendedores

/* TODO
const selectVendedor = document.getElementById('vendedor');
const inputListaVendedores = document.getElementById('listaVendedores');
const labelListaVendedores = document.querySelector('label[for="listaVendedores"]');

selectVendedor.addEventListener('change', (e) => {
  const isAutomatico = e.target.value === "true";

  if (isAutomatico) {
    inputListaVendedores.style.display = "block";
    labelListaVendedores.style.display = "block";
    inputListaVendedores.required = true;
  } else {
    inputListaVendedores.style.display = "none";
    labelListaVendedores.style.display = "none";
    inputListaVendedores.required = false;
    inputListaVendedores.value = "";
  };
});

*/
