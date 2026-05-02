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
 * vendedor           = booleano.
 * quantidadeDeFolhas = número entre 1 e 1000.
 * listaVendedores    = objeto com turmas e vendedores (máximo de 5 turmas e 35 vendedores por turma).
 * folhasPorVendedor  = número entre 1 e 5.
 * folhasExtra        = número entre 0 e 300.
 */

import { io } from "/assets/socket.io.min.js";

const websocketServer = "ws://localhost:3000/";

const defaults = {
  nome: "RIFA DE PÁSCOA",
  premiacao: "CESTA DE CHOCOLATES",
  data: "06/04",
  preco: "2,00",
  folhasPorVendedor: 2,
  folhasExtra: 50,
  quantidadeDeFolhas: 100,
  template: 20,
};

const iframe = document.getElementById("preview");
const form = document.getElementById("dados");

const inputs = {
  nome: document.getElementById("nome"),
  premiacao: document.getElementById("premiacao"),
  data: document.getElementById("data"),
  preco: document.getElementById("preco"),
  logo: document.getElementById("logo"),
  vendedor: document.getElementById("vendedor"),
  listaVendedores: document.getElementById("listaVendedores"),
  folhasPorVendedor: document.getElementById("folhasPorVendedor"),
  folhasExtra: document.getElementById("folhasExtra"),
  quantidadeDeFolhas: document.getElementById("quantidadeDeFolhas"),
  template: document.getElementById("template"),
};

const buttons = {
  submit: document.getElementById("submitButton"),
  previousPage: document.getElementById("previousPageButton"),
  nextPage: document.getElementById("nextPageButton"),
};

const pagination = {
  currentPage: document.getElementById("currentPage"),
  totalPages: document.getElementById("totalPages"),
};

const progress = {
  container: document.getElementById("progressContainer"),
  message: document.getElementById("message"),
  bar: document.getElementById("progressBar"),
  percentage: document.getElementById("progressPercentage"),
  currentPage: document.getElementById("currentPageProgress"),
  totalPages: document.getElementById("totalPagesProgress"),
};

const info = {
  numeros: document.getElementById("infoNumeros"),
  arrecadacao: document.getElementById("infoArrecadacao"),
};

let currentPage = 1;
let totalPages = 100;
let autoVendedor = false;
let generated = false;

const socket = new io(websocketServer);

const updateIframeStyle = () => {
  const doc = iframe.contentDocument;

  if (!doc) return;

  const style = doc.createElement("style");
  style.textContent = `
    body {
      border: none !important;
      overflow: hidden !important;
    }
  `;

  doc.head.appendChild(style);
};

const changeIframeVisibility = (state, timeout) => {
  setTimeout(() => (iframe.style.opacity = state), timeout);
};

const updatePreviewTemplate = (template, timeout) => {
  if (iframe.src != `/templates/rifa_${template}l.html`) {
    setTimeout(() => (iframe.src = `/templates/rifa_${template}l.html`), timeout);
  }
};

const setInputsDisabled = (status) => {
  Object.values(inputs).forEach((input) => {
    if (input) input.disabled = status;
  });
};

const resetPagination = () => {
  currentPage = 1;
  progress.currentPage.textContent = 0;
  pagination.currentPage.textContent = 1;
};

const resetProgress = () => {
  progress.currentPage.innerText = 0;
  progress.percentage.innerText = "0%";
  progress.bar.style.setProperty("--progress", "0%");
  progress.container.style.visibility = "hidden";
};

const resetSubmitButton = () => {
  buttons.submit.disabled = false;
  buttons.submit.innerText = "Gerar";
  buttons.submit.style.cursor = "pointer";
};

const resetError = () => {
  progress.message.style.visibility = "hidden";
  progress.message.innerHTML = "";
};

const resetAll = () => {
  resetError();
  resetProgress();
  resetSubmitButton();
  generated = false;
};

const displayError = (error) => {
  progress.message.style.visibility = "visible";
  progress.message.innerHTML = `<p><b>Erro:</b> ${error}</p>`;
};

const disableSubmitButton = () => {
  buttons.submit.disabled = true;
  buttons.submit.style.cursor = "not-allowed";
};

const updateProgress = (page, percent) => {
  buttons.submit.innerText = "Gerando...";
  progress.currentPage.innerText = page;
  progress.percentage.innerText = `${Math.round(percent)}%`;
  progress.bar.style.setProperty("--progress", `${percent}%`);
};

const finishRifa = (url) => {
  buttons.submit.innerHTML = `<a href="${url}" target="_blank">Finalizado!</a>`;
  window.open(url, "_blank");
  generated = true;
  setInputsDisabled(false);
};

const handleRifaError = () => {
  progress.message.style.visibility = "visible";
  progress.message.innerHTML = "<p><strong>Erro:</strong> Ocorreu um erro inesperado.</p>";
  resetProgress();
  resetSubmitButton();
  setInputsDisabled(false);
};

// Input de data
function handleDateInput(event) {
  const input = event.target;

  if (event.inputType === "deleteContentBackward") {
    input.dataset.lastValid = input.value;
    return;
  }

  let onlyNumbers = input.value.replace(/\D/g, "");
  let formated = "";

  if (onlyNumbers.length > 0) {
    let dayStr = onlyNumbers.slice(0, 2);
    let dayNum = parseInt(dayStr);

    if (parseInt(dayStr[0]) > 3) {
      input.value = input.dataset.lastValid;
      return;
    }

    if (dayStr.length === 2) {
      if (dayNum < 1 || dayNum > 31) {
        input.value = input.dataset.lastValid;
        return;
      }
      formated = dayStr + "/";
    } else {
      formated = dayStr;
    }

    if (onlyNumbers.length > 2) {
      let monthStr = onlyNumbers.slice(2, 4);

      if (parseInt(monthStr[0]) > 1) {
        input.value = input.dataset.lastValid;
        return;
      }

      if (monthStr.length === 2) {
        let m = parseInt(monthStr);
        let d = parseInt(dayStr);

        if (m < 1 || m > 12) {
          input.value = input.dataset.lastValid;
          return;
        }

        const daysPerMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (d > daysPerMonth[m]) {
          input.value = input.dataset.lastValid;
          return;
        }
        formated += monthStr;
      } else {
        formated += monthStr;
      }
    }
  }
  input.value = formated;
  input.dataset.lastValid = formated;

  updatePlaceholders();
}

// Input de preço
function handlePriceInput(event) {
  const input = event.target;

  const format = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    return (Number(value) / 100).toFixed(2).replace(".", ",");
  };

  let value = input.value.replace(/\D/g, "");
  let decimal = Number(value || "0") / 100;

  if (decimal > Number(input.max)) {
    value = value.slice(0, -1);
  }

  input.value = format(value);

  updatePlaceholders();
  updateInfo();
}

// Input da logo
function handleLogoInput(event) {
  const input = event.target;

  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("A logo precisa ser uma imagem válida.");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      const width = img.width;
      const height = img.height;

      if (width > 1024 || height > 1024) {
        alert("A logo deve possuir no máximo 1024x1024 pixels.");
        input.value = "";
        return;
      }

      if (width !== height) {
        alert("Aviso: A logo não tem proporção quadrada (1:1). Pode haver distorção.");
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 512;

      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(img, 0, 0, size, size);

      const base64 = canvas.toDataURL("image/png");

      input.setAttribute("data-base64", base64);

      updatePlaceholders();
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

// Input da lista de vendedores
function handleListInput(event) {
  const input = event.target;

  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    const content = event.target.result;

    if (typeof content === "string") {
      const validateFileContent = (content) => {
        const groups = content
          .split(/\n\s*\n/)
          .map((g) => g.trim())
          .filter((g) => g.length > 0);

        if (groups.length < 1) {
          return { valid: false, error: "Nenhuma turma identificada." };
        }

        if (groups.length > 5) {
          return { valid: false, error: "Máximo de 5 turmas permitidas." };
        }

        for (let i = 0; i < groups.length; i++) {
          const lines = groups[i].split("\n").map((l) => l.trim());

          if (lines.length < 2 || lines.length > 36) {
            return {
              valid: false,
              error: `As turmas devem possuir entre 1 e 35 pessoas.`,
            };
          }

          for (let j = 0; j < lines.length; j++) {
            if (lines[j].length > 20) {
              return {
                valid: false,
                error: `O nome das turmas e pessoas devem possuir no máximo 20 caracteres.`,
              };
            }
          }
        }

        return { valid: true };
      };

      function processData(content) {
        const list = {};

        const groups = content
          .split(/\n\s*\n/)
          .map((g) => g.trim())
          .filter((g) => g.length > 0);

        groups.forEach((group) => {
          const groupName = group.split(/\r?\n/)[0];
          const people = group.split("\n").map((l) => l.trim());

          let peopleList = [];
          people.forEach((person) => {
            if (person === groupName) return;
            peopleList.push(person);
          });
          list[groupName] = peopleList;
        });

        return list;
      }

      const result = validateFileContent(content);

      if (!result.valid) {
        input.value = "";
        alert(result.error);
        return;
      }

      const list = processData(content);

      input.setAttribute("data-list", JSON.stringify(list));

      updatePlaceholders();
      updatePageNumber();
      updateInfo();
    } else {
      input.value = "";
      alert("A lista precisa ser um arquivo de texto válido.");
      return;
    }
  };

  reader.readAsText(file);
}

// Inputs numéricos (quantidade de folhas, folhas por vendedor e folhas extra)
function handleNumericInput(event) {
  const input = event.target;
  let value = input.value;
  let onlyNumbers = value.replace(/\D/g, "");

  if (onlyNumbers === "") {
    input.value = "";
    input.dataset.lastValid = "";
    return;
  }

  let numericValue = parseInt(onlyNumbers);

  if (numericValue > input.max || numericValue < input.min) {
    input.value = input.dataset.lastValid || "";
  } else {
    input.value = numericValue.toString();
    input.dataset.lastValid = input.value;
  }

  updatePlaceholders();
  updatePageNumber();
  updateInfo();
  resetPagination();
}

// Alternação dos inputs dependendo do tipo de vendedor
const toggleInputs = (event) => {
  const isAutomatico = event.target.value === "true";

  autoVendedor = isAutomatico;

  const autoInputs = [inputs.listaVendedores, inputs.folhasPorVendedor, inputs.folhasExtra];
  const manualInputs = [inputs.quantidadeDeFolhas];

  const setVisibility = (isVisible, inputs) => {
    inputs.forEach((input) => {
      const displayMode = isVisible ? "block" : "none";

      input.style.display = displayMode;
      if (input.labels?.[0]) input.labels[0].style.display = displayMode;

      input.required = isVisible;

      if (!isVisible) {
        input.value = "";
        if (input.id === "listaVendedores") input.dataset.list = "";
      }
    });
  };

  setVisibility(isAutomatico, autoInputs);
  setVisibility(!isAutomatico, manualInputs);

  updatePageNumber();
};

// Atualização dos placeholders do iframe
function updatePlaceholders() {
  const doc = iframe.contentDocument;

  if (!doc) return;

  const vendedorElement = doc.querySelector(`[data-placeholder="vendedor"]`);
  vendedorElement.textContent = "__________________";

  if (generated) resetAll();

  const template = Number(inputs.template.value);

  for (let i = 1; i < template + 1; i++) {
    const el = doc.querySelector(`[data-placeholder="n${i}"]`);

    if (!el) return;

    el.textContent = `${i + (currentPage - 1) * template}`;
  }

  Object.entries(inputs).forEach(([key, input]) => {
    const el = doc.querySelector(`[data-placeholder="${key}"]`);

    if (key == "logo") {
      if (!input.dataset.base64) return;
      el.src = input.dataset.base64;
      return;
    }

    if (el && key !== "vendedor") {
      el.textContent = input.value.toUpperCase() || defaults[key].toUpperCase() || el.textContent.toUpperCase();
    }

    if (autoVendedor) {
      const folhasExtra = Number(inputs.folhasExtra.value) || defaults.folhasExtra;

      const folhasPorVendedor = Number(inputs.folhasPorVendedor.value || defaults.folhasPorVendedor);
      const vendedores = inputs.listaVendedores.dataset.list
        ? Object.values(JSON.parse(inputs.listaVendedores.dataset.list)).flat()
        : undefined;

      if (!vendedores || currentPage > vendedores.length * folhasPorVendedor) return;

      vendedorElement.textContent = vendedores[Math.ceil(currentPage / folhasPorVendedor) - 1];
    }
  });
}

// Paginação
function doPagination(event) {
  if (event.type === "click") {
    if (event.target.classList.contains("previousClick")) {
      if (currentPage == 1) return;
      currentPage--;
      updatePlaceholders();
      pagination.currentPage.textContent = currentPage;
    } else {
      if (currentPage >= totalPages) return;
      currentPage++;
      updatePlaceholders();
      pagination.currentPage.textContent = currentPage;
    }
  }
}

// Atualizar informações
function updateInfo() {
  const totalNumbers = totalPages * Number(inputs.template.value || defaults.template);

  info.numeros.textContent = totalNumbers;

  info.arrecadacao.textContent = Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalNumbers * Number(inputs.preco.value.replace(",", ".") || defaults.preco.replace(",", ".")));
}

// Atualizar número das páginas
function updatePageNumber() {
  totalPages = autoVendedor
    ? Number(inputs.folhasExtra.value || defaults.folhasExtra) +
      Number(inputs.folhasPorVendedor.value || defaults.folhasPorVendedor) *
        Number(
          inputs.listaVendedores.dataset.list
            ? Object.values(JSON.parse(inputs.listaVendedores.dataset.list)).flat().length
            : 0,
        )
    : Number(inputs.quantidadeDeFolhas.value || defaults.quantidadeDeFolhas);

  pagination.totalPages.textContent = totalPages;

  resetPagination();
}

// Envio do formulário
async function formSubmit(event) {
  event.preventDefault();

  disableSubmitButton();
  setInputsDisabled(true);

  const manualPayload = {
    vendedor: false,
    nome: inputs.nome.value,
    premiacao: inputs.premiacao.value,
    data: inputs.data.value,
    preco: inputs.preco.value,
    logo: inputs.logo.dataset.base64,
    folhas: inputs.quantidadeDeFolhas.value,
    template: inputs.template.value,
  };

  const autoPayload = {
    vendedor: true,
    nome: inputs.nome.value,
    premiacao: inputs.premiacao.value,
    data: inputs.data.value,
    preco: inputs.preco.value,
    logo: inputs.logo.dataset.base64,
    listaVendedores: inputs.listaVendedores.dataset.list,
    folhasPorVendedor: inputs.folhasPorVendedor.value,
    folhasExtra: inputs.folhasExtra.value,
    template: inputs.template.value,
  };

  try {
    const response = await fetch("/gerar-rifa", {
      method: "POST",
      body: JSON.stringify(autoVendedor ? autoPayload : manualPayload),
      headers: { "Content-type": "application/json" },
    });

    const data = await response.json();

    if (data.error) {
      console.error(`Erro: ${data.error}`);
      displayError(data.error);
      resetSubmitButton();
      setInputsDisabled(false);
      return;
    }

    console.log(`Task ID: ${data.taskId}`);
    socket.emit("join-task", data.taskId);

    progress.message.style.visibility = "hidden";
    buttons.submit.innerText = "Iniciando geração...";

    progress.totalPages.innerText = autoVendedor
      ? totalPages +
        Object.keys(JSON.parse(inputs.listaVendedores.dataset.list)).length +
        Math.ceil(Number(inputs.folhasExtra.value) / (35 * Number(inputs.folhasPorVendedor.value)))
      : totalPages;

    progress.container.style.visibility = "visible";
  } catch (error) {
    console.error(`Erro: ${error}`);
    displayError("Não foi possível conectar ao servidor.");
    resetSubmitButton();
    setInputsDisabled(false);
  }
}

// Websocket

socket.on("connect", () => {
  console.log("Websocket conectado!");
});

socket.on("disconnect", () => {
  console.log("Websocket desconectado!");
});

socket.on("progress", (data) => {
  console.log(`Progresso: ${data.percent}% | ${data.page} páginas`);
  updateProgress(data.page, data.percent);
});

socket.on("finished", (data) => {
  console.log(`Rifa finalizada: ${data.url}`);
  finishRifa(data.url);
});

socket.on("rifa_error", () => {
  console.error("Ocorreu um erro durante a geração da rifa!");
  handleRifaError();
});

// Carregamento da página
window.addEventListener("load", () => {
  form.reset();
});

// Carregamento do iframe
iframe.addEventListener("load", () => {
  updateIframeStyle();
  updatePlaceholders();
  changeIframeVisibility(1, 300);
});

// Input do nome e premiação
[inputs.premiacao, inputs.nome].forEach((input) => {
  input.addEventListener("input", (event) => {
    updatePlaceholders();
  });
});

// Input da data
inputs.data.addEventListener("input", (event) => {
  handleDateInput(event);
  updatePlaceholders();
});

// Input do preço
inputs.preco.addEventListener("input", (event) => {
  handlePriceInput(event);
  updatePlaceholders();
});

// Input da logo
inputs.logo.addEventListener("input", (event) => {
  handleLogoInput(event);
});

// Input da lista de vendedores
inputs.listaVendedores.addEventListener("input", (event) => {
  handleListInput(event);
});

// Input da quantidade de folhas, folhas por vendedor e folhas extra
[inputs.quantidadeDeFolhas, inputs.folhasPorVendedor, inputs.folhasExtra].forEach((input) => {
  input.addEventListener("input", (event) => {
    handleNumericInput(event);
  });
});

// Alteração no select de tipo de vendedor
inputs.vendedor.addEventListener("change", (event) => {
  toggleInputs(event);
});

// Alteração no select do template
inputs.template.addEventListener("change", (event) => {
  changeIframeVisibility(0, 0);
  updatePreviewTemplate(event.target.value, 200);
});

// Clique nos botões de paginação
[buttons.previousPage, buttons.nextPage].forEach((button) => {
  button.addEventListener("click", (event) => {
    doPagination(event);
  });
});

// Envio do formulário
form.addEventListener("submit", async (event) => {
  formSubmit(event);
});
