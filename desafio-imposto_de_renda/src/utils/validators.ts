import type {
  ComprovanteFiscalForm,
  DadosPessoaTitularForm,
  InformeRendimentoForm,
} from '../types/ir';

export function carimbarDataHoraAtual(): string {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const min = String(agora.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

export function formatarMoedaBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(valor) ? valor : 0);
}

export function parseMoedaBRL(raw: string): number {
  if (!raw || !raw.trim()) return NaN;
  const limpo = raw
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(limpo);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function formatarCPF(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function formatarCPFOuCNPJ(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);
  if (digitos.length <= 11) {
    return formatarCPF(digitos);
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function formatarCEP(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function validarCPF(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

export function validarCNPJ(cnpjRaw: string): boolean {
  const cnpj = cnpjRaw.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split('')
      .reduce((acc, digito, idx) => acc + Number(digito) * pesos[idx], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;
  const d2 = calcularDigito(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cnpj[13]);
}

export function validarCPFOuCNPJ(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length === 11) return validarCPF(digitos);
  if (digitos.length === 14) return validarCNPJ(digitos);
  return false;
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function detectarPIIEmTexto(texto: string): boolean {
  const padraoCPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
  const padraoCNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;
  const padraoEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  return padraoCPF.test(texto) || padraoCNPJ.test(texto) || padraoEmail.test(texto);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validarDadosPessoaTitular(form: DadosPessoaTitularForm): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.nomeCompleto.trim() || form.nomeCompleto.trim().split(/\s+/).length < 2) {
    errors.nomeCompleto = 'Informe o nome completo (nome e sobrenome).';
  }

  if (!form.cpf.trim()) {
    errors.cpf = 'O campo CPF é obrigatório.';
  } else if (!validarCPF(form.cpf)) {
    errors.cpf = 'CPF inválido. Confira os 11 números digitados.';
  }

  if (!form.documentoOficial.trim()) {
    errors.documentoOficial = 'Informe o número do Documento de Identificação Oficial (ex.: RG ou CNH).';
  }

  if (!form.dataNascimento.trim()) {
    errors.dataNascimento = 'Informe a data de nascimento.';
  }

  if (!form.estadoCivil) {
    errors.estadoCivil = 'Selecione o estado civil.';
  }

  if (!form.enderecoCompleto.trim()) {
    errors.enderecoCompleto = 'Informe o endereço completo.';
  }

  const cepDigitos = form.cep.replace(/\D/g, '');
  if (!cepDigitos) {
    errors.cep = 'O campo CEP é obrigatório.';
  } else if (cepDigitos.length !== 8) {
    errors.cep = 'CEP incompleto. Digite os 8 números do CEP.';
  }

  if (!form.cidadeEstado.trim()) {
    errors.cidadeEstado = 'Informe a cidade e o estado (ex.: São Paulo/SP).';
  }

  const telDigitos = form.telefone.replace(/\D/g, '');
  if (!telDigitos) {
    errors.telefone = 'Informe um número de telefone para contato.';
  } else if (telDigitos.length < 10) {
    errors.telefone = 'Telefone incompleto. Inclua o DDD e o número.';
  }

  if (!form.email.trim()) {
    errors.email = 'O campo e-mail é obrigatório.';
  } else if (!validarEmail(form.email)) {
    errors.email = 'Digite um endereço de e-mail válido (ex.: nome@exemplo.com).';
  }

  if (form.existeDependente) {
    const qtd = Number(form.quantidadeDependentes);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 20) {
      errors.quantidadeDependentes =
        'Como você indicou que existe dependente, informe uma quantidade entre 1 e 20.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validarInformeRendimento(form: InformeRendimentoForm): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.instituicaoBanco.trim()) {
    errors.instituicaoBanco = 'Informe o nome do banco ou da fonte pagadora.';
  }

  if (form.periodicidade === 'Mensal' && !form.mesReferencia.trim()) {
    errors.mesReferencia = 'Selecione o mês de referência para lançamentos mensais.';
  }

  const valorNum = parseMoedaBRL(form.valor);
  if (!form.valor.trim()) {
    errors.valor = 'Informe o valor atual ou anual do rendimento.';
  } else if (Number.isNaN(valorNum) || valorNum <= 0) {
    errors.valor = 'Informe um valor maior que zero (ex.: 4500,00).';
  }

  if (form.impostoRetido.trim()) {
    const irNum = parseMoedaBRL(form.impostoRetido);
    if (Number.isNaN(irNum) || irNum < 0) {
      errors.impostoRetido = 'O imposto retido não pode ser negativo.';
    } else if (!Number.isNaN(valorNum) && irNum > valorNum) {
      errors.impostoRetido = 'O imposto retido na fonte não pode ser maior que o rendimento.';
    }
  }

  if (!form.anexoFile) {
    errors.anexoFile =
      'Anexe o documento do informe (PDF ou imagem) para gerar o link no Google Drive ao salvar.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validarComprovanteFiscal(form: ComprovanteFiscalForm): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.descricaoEmitente.trim()) {
    errors.descricaoEmitente = 'Informe a descrição ou o nome de quem emitiu o comprovante.';
  }

  if (
    (form.categoria === 'Saúde (Dedutível)' || form.categoria === 'Educação (Dedutível)') &&
    !form.cpfCnpjEmitente.trim()
  ) {
    errors.cpfCnpjEmitente =
      'Para despesas de Saúde ou Educação, informe o CPF ou CNPJ do emitente para evitar malha fina.';
  } else if (form.cpfCnpjEmitente.trim() && !validarCPFOuCNPJ(form.cpfCnpjEmitente)) {
    errors.cpfCnpjEmitente = 'CPF ou CNPJ do emitente inválido. Confira os números.';
  }

  if (!form.dataDocumento.trim()) {
    errors.dataDocumento = 'Informe a data em que o comprovante ou holerite foi emitido.';
  }

  const valorNum = parseMoedaBRL(form.valor);
  if (!form.valor.trim()) {
    errors.valor = 'Informe o valor do comprovante.';
  } else if (Number.isNaN(valorNum) || valorNum <= 0) {
    errors.valor = 'Informe um valor válido maior que zero.';
  }

  if (form.impostoRetido.trim()) {
    const irNum = parseMoedaBRL(form.impostoRetido);
    if (Number.isNaN(irNum) || irNum < 0) {
      errors.impostoRetido = 'O IR retido na fonte não pode ser negativo.';
    }
  }

  if (!form.anexoFile) {
    errors.anexoFile =
      'Anexe o comprovante ou holerite (PDF ou imagem) para enviar ao Google Drive ao salvar.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function extrairIdDeLinkGoogle(input: string): string {
  const limpo = input.trim();
  if (!limpo) return '';
  // URL de planilha: /spreadsheets/d/<ID>/...
  const sheetMatch = limpo.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch?.[1]) return sheetMatch[1];
  // URL de pasta do Drive: /folders/<ID>
  const folderMatch = limpo.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch?.[1]) return folderMatch[1];
  // URL de arquivo Drive: /d/<ID> ou ?id=<ID>
  const idParamMatch = limpo.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];
  return limpo;
}
