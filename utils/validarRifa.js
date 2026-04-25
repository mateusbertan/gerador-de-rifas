const dataRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
const base64ImageRegex = /^data:image\/(png|jpeg|jpg);base64,/;

export default async function validarRifa(req) {
  if (!req.body) {
    return 'Requisição inválida.';
  };

  const rifa = req.body;

  // Nome
  if (!rifa.nome || typeof rifa.nome !== "string" || rifa.nome.length < 4 || rifa.nome.length > 25) {
    return 'O nome da rifa deve ter entre 4 e 25 caracteres.';
  };

  // Premiação
  if (!rifa.premiacao || typeof rifa.premiacao !== "string" || rifa.premiacao.length < 4 || rifa.premiacao.length > 20) {
    return 'A premiação da rifa deve ter entre 4 e 20 caracteres.';
  };

  // Data do Sorteio
  if (!rifa.data || !dataRegex.test(rifa.data)) {
    return 'Data inválida.';
  };

  // Preço
  const preco = typeof rifa.preco === 'string' ? parseFloat(rifa.preco.replace(',', '.')) : rifa.preco;
  if (isNaN(preco) || preco < 0.01 || preco > 99.99) {
    return 'Preço inválido.';
  };

  // Template
  const templatesValidos = ['20', '25', '30'];
  if (!rifa.template || !templatesValidos.includes(String(rifa.template).trim())) {
    return 'Template inválido! Escolha apenas 20, 25 ou 30.';
  };

  // Logo
  if (!rifa.logo || typeof rifa.logo !== 'string') {
    return 'A imagem da logo é obrigatória.';
  };

  if (!base64ImageRegex.test(rifa.logo)) {
    return 'O formato da imagem da logo é inválido.';
  };

  // Modo de vendedor
  if (typeof rifa.vendedor !== 'boolean') {
    return 'Modo de vendedor inválido.'
  };

  if (rifa.vendedor) {
    // Folhas por Vendedor
    const folhasPorVendedor = parseInt(rifa.folhasPorVendedor);
    if (isNaN(folhasPorVendedor) || folhasPorVendedor < 1 || folhasPorVendedor > 5) {
      return 'A quantidade de folhas por vendedor deve ser um número inteiro entre 1 e 5.';
    };

    // Folhas Extra
    const folhasExtra = parseInt(rifa.folhas);
    if (isNaN(folhasExtra) || folhasExtra < 0 || folhasExtra > 300) {
      return 'A quantidade de folhas extra deve ser um número inteiro entre 0 e 300.';
    };

    // Lista de vendedores
    let lista = {};
    try {
      lista = JSON.parse(rifa.listaVendedores);
    } catch {
      return 'Lista de vendedores inválida.';
    };

    if (typeof lista !== 'object' || lista === null || Array.isArray(lista)) {
      return 'Lista de vendedores inválida.';
    };

    const grupos = Object.entries(lista);

    if (grupos.length < 1 || grupos.length > 5) {
      return 'A lista de vendedores deve ter 1 a 5 grupos.';
    };

    for (const [grupo, pessoas] of grupos) {
      if (grupo.trim().length < 1 || grupo.trim().length > 20) {
        return 'O nome dos grupos na lista de vendedores deve ter entre 1 e 20 caracteres.';
      };

      if (!Array.isArray(pessoas)) {
        return 'Lista de vendedores inválida.';
      };

      if (pessoas.lenght < 1 || pessoas.length > 35) {
        return 'Os grupos devem ter entre 1 e 35 pessoas';
      };

      for (const pessoa of pessoas) {
        if (typeof pessoa !== 'string') {
          return 'Lista de vendedores inválida.';
        };

        if (pessoa.trim().length < 1 || pessoa.trim().length > 20) {
          return `O nome das pessoas na lista de vendedores deve ter entre 1 e 20 caracteres.'`;
        };
      };
    };
  } else {
    // Quantidade de folhas
    const folhas = parseInt(rifa.folhas);
    if (isNaN(folhas) || folhas < 1 || folhas > 1000) {
      return 'A quantidade de páginas deve ser um número inteiro entre 1 e 1000.';
    };
  };

  return null;
};
