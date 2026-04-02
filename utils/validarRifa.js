const dataRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
const base64ImageRegex = /^data:image\/(png|jpeg|jpg);base64,/;

export default async function validarRifa(req) {
  if (!req.body) {
    return 'Requisição inválida';
  };

  const rifa = req.body;

  // Nome
  if (!rifa.nome || typeof rifa.nome !== "string" || rifa.nome.length < 4 || rifa.nome.length > 25) {
    return 'O nome da rifa deve ter entre 4 e 25 caracteres';
  };

  // Premiação
  if (!rifa.premiacao || typeof rifa.premiacao !== "string" || rifa.premiacao.length < 4 || rifa.premiacao.length > 20) {
    return 'A premiação da rifa deve ter entre 4 e 20 caracteres';
  };

  // Data do Sorteio
  if (!rifa.data || !dataRegex.test(rifa.data)) {
    return 'Data inválida';
  };

  // Preço
  const preco = typeof rifa.preco === 'string' ? parseFloat(rifa.preco.replace(',', '.')) : rifa.preco;
  if (isNaN(preco) || preco < 0.01 || preco > 99.99) {
    return 'Preço inválido';
  };

  // Quantidade de Folhas
  const folhas = parseInt(rifa.folhas);
  if (isNaN(folhas) || folhas < 1 || folhas > 1000) {
    return 'A quantidade de páginas deve ser um número inteiro entre 1 e 1000';
  };

  // Template
  const templatesValidos = ['20', '25', '30'];
  if (!rifa.template || !templatesValidos.includes(String(rifa.template).trim())) {
    return 'Template inválido! Escolha apenas 20, 25 ou 30.';
  };

  // Logo
  if (!rifa.logo || typeof rifa.logo !== "string") {
    return 'A imagem da logo é obrigatória';
  };

  if (!base64ImageRegex.test(rifa.logo)) {
    return 'O formato da imagem da logo é inválido';
  };

  return null;
};
