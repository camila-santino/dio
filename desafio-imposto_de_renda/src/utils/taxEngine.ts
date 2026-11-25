import type {
  ParametrosFiscaisAnuais,
  RegistroComprovanteFiscal,
  RegistroInformeRendimento,
  RegistroPessoaTitular,
} from '../types/ir';
import { formatarMoedaBRL, validarCPF } from './validators';

/**
 * Valores de referência editáveis pela pessoa usuária a cada ano-base.
 * Baseados nos parâmetros oficiais mais recentes de declaração anual IRPF da Receita Federal.
 */
export const DEFAULT_PARAMETROS_FISCAIS: ParametrosFiscaisAnuais = {
  anoCalendario: 2025,
  limiteObrigatoriedadeTributavel: 33888.0,
  limiteObrigatoriedadeIsento: 200000.0,
  deducaoPorDependente: 2275.08,
  tetoEducacaoAnual: 3561.5,
  percentualDescontoSimplificado: 0.2,
  tetoDescontoSimplificado: 16754.34,
  faixasAnuais: [
    { limiteSuperior: 28467.2, aliquota: 0, parcelaDeduzir: 0 },
    { limiteSuperior: 33919.8, aliquota: 0.075, parcelaDeduzir: 2135.04 },
    { limiteSuperior: 45012.6, aliquota: 0.15, parcelaDeduzir: 4679.03 },
    { limiteSuperior: 55976.16, aliquota: 0.225, parcelaDeduzir: 8054.97 },
    { limiteSuperior: null, aliquota: 0.275, parcelaDeduzir: 10853.78 },
  ],
};

export interface ResultadoModeloIR {
  nome: 'Declaração Completa' | 'Desconto Simplificado';
  baseCalculo: number;
  totalDeducoes: number;
  impostoBruto: number;
  impostoRetido: number;
  saldoFinal: number; // > 0 = a pagar, < 0 = a restituir
  aliquotaEfetiva: number;
}

export type StatusObrigatoriedade =
  | 'dados_insuficientes'
  | 'obrigatorio'
  | 'isento_com_restituicao'
  | 'isento';

export interface DiagnosticoObrigatoriedade {
  status: StatusObrigatoriedade;
  titulo: string;
  explicacao: string;
  motivos: string[];
}

export type SeveridadeMalha = 'conforme' | 'atencao' | 'pendencia';

export interface ItemAuditoriaMalha {
  id: string;
  severidade: SeveridadeMalha;
  titulo: string;
  descricao: string;
  acaoRecomendada: string;
}

export interface ResultadoSimulacaoIR {
  rendimentosTributaveisInformes: number;
  rendimentosHoleritesComprovantes: number;
  totalRendimentosTributaveis: number;
  totalRendimentosIsentosOuExclusivos: number;
  totalRendimentosGerais: number;
  mediaMensalTributavel: number;
  totalImpostoRetido: number;
  deducaoSaude: number;
  deducaoEducacaoInformada: number;
  deducaoEducacaoAceita: number;
  deducaoPrevidenciaInformada: number;
  deducaoPrevidenciaAceita: number;
  deducaoPensao: number;
  quantidadeDependentes: number;
  deducaoDependentes: number;
  completa: ResultadoModeloIR;
  simplificada: ResultadoModeloIR;
  melhorOpcao: 'completa' | 'simplificada' | 'empate';
  economiaEstimada: number;
  obrigatoriedade: DiagnosticoObrigatoriedade;
  auditoriaMalha: ItemAuditoriaMalha[];
  contagemMalha: {
    conformes: number;
    atencoes: number;
    pendencias: number;
  };
}

function calcularImpostoProgressivo(
  baseCalculo: number,
  faixas: ParametrosFiscaisAnuais['faixasAnuais']
): number {
  if (baseCalculo <= 0) return 0;
  for (const faixa of faixas) {
    if (faixa.limiteSuperior === null || baseCalculo <= faixa.limiteSuperior) {
      const imposto = baseCalculo * faixa.aliquota - faixa.parcelaDeduzir;
      return Math.max(0, Number(imposto.toFixed(2)));
    }
  }
  const ultima = faixas[faixas.length - 1];
  return Math.max(0, Number((baseCalculo * ultima.aliquota - ultima.parcelaDeduzir).toFixed(2)));
}

function isRendimentoIsentoOuExclusivo(tipo: RegistroInformeRendimento['tipoRendimento']): boolean {
  return (
    tipo === 'Rendimento Bancário / Aplicação (Exclusivo ou Isento)' ||
    tipo === 'Poupança / LCI / LCA / Dividendos (Isento)'
  );
}

export function executarSimulacaoIR(
  titularAtual: RegistroPessoaTitular | null,
  informes: RegistroInformeRendimento[],
  comprovantes: RegistroComprovanteFiscal[],
  params: ParametrosFiscaisAnuais
): ResultadoSimulacaoIR {
  // 1. Rendimentos via Informes
  let rendimentosTributaveisInformes = 0;
  let totalRendimentosIsentosOuExclusivos = 0;
  let irRetidoInformes = 0;

  for (const inf of informes) {
    if (isRendimentoIsentoOuExclusivo(inf.tipoRendimento)) {
      totalRendimentosIsentosOuExclusivos += inf.valor;
    } else {
      rendimentosTributaveisInformes += inf.valor;
    }
    irRetidoInformes += inf.impostoRetido;
  }

  // 2. Comprovantes Fiscais (incluindo Holerites/Salários Mensais e Deduções)
  let rendimentosHoleritesComprovantes = 0;
  let irRetidoComprovantes = 0;
  let deducaoSaude = 0;
  let deducaoEducacaoInformada = 0;
  let deducaoPrevidenciaInformada = 0;
  let deducaoPensao = 0;

  for (const comp of comprovantes) {
    switch (comp.categoria) {
      case 'Holerite / Contracheque (Salário Mensal)':
        rendimentosHoleritesComprovantes += comp.valor;
        irRetidoComprovantes += comp.impostoRetido;
        break;
      case 'Saúde (Dedutível)':
        deducaoSaude += comp.valor;
        break;
      case 'Educação (Dedutível)':
        deducaoEducacaoInformada += comp.valor;
        break;
      case 'Previdência Privada (PGBL)':
        deducaoPrevidenciaInformada += comp.valor;
        break;
      case 'Pensão Alimentícia Judicial':
        deducaoPensao += comp.valor;
        break;
      default:
        break;
    }
  }

  const totalRendimentosTributaveis = Number(
    (rendimentosTributaveisInformes + rendimentosHoleritesComprovantes).toFixed(2)
  );
  const totalRendimentosGerais = Number(
    (totalRendimentosTributaveis + totalRendimentosIsentosOuExclusivos).toFixed(2)
  );
  const mediaMensalTributavel = Number((totalRendimentosTributaveis / 12).toFixed(2));
  const totalImpostoRetido = Number((irRetidoInformes + irRetidoComprovantes).toFixed(2));

  // 3. Deduções legais (Declaração Completa)
  const quantidadeDependentes =
    titularAtual && titularAtual.existeDependente
      ? Math.max(0, Number(titularAtual.quantidadeDependentes) || 0)
      : 0;
  const deducaoDependentes = Number((quantidadeDependentes * params.deducaoPorDependente).toFixed(2));

  // Teto de educação considera pessoa titular + dependentes
  const pessoasElegiveisEducacao = 1 + quantidadeDependentes;
  const tetoEducacaoTotal = pessoasElegiveisEducacao * params.tetoEducacaoAnual;
  const deducaoEducacaoAceita = Number(Math.min(deducaoEducacaoInformada, tetoEducacaoTotal).toFixed(2));

  // PGBL limitado a 12% da renda tributável anual
  const limitePgbl = totalRendimentosTributaveis * 0.12;
  const deducaoPrevidenciaAceita = Number(
    Math.min(deducaoPrevidenciaInformada, limitePgbl).toFixed(2)
  );

  const totalDeducoesCompleta = Number(
    (
      deducaoSaude +
      deducaoEducacaoAceita +
      deducaoDependentes +
      deducaoPrevidenciaAceita +
      deducaoPensao
    ).toFixed(2)
  );

  const baseCompleta = Math.max(
    0,
    Number((totalRendimentosTributaveis - totalDeducoesCompleta).toFixed(2))
  );
  const impostoBrutoCompleta = calcularImpostoProgressivo(baseCompleta, params.faixasAnuais);
  const saldoCompleta = Number((impostoBrutoCompleta - totalImpostoRetido).toFixed(2));
  const aliquotaEfetivaCompleta =
    totalRendimentosTributaveis > 0 ? (impostoBrutoCompleta / totalRendimentosTributaveis) * 100 : 0;

  const completa: ResultadoModeloIR = {
    nome: 'Declaração Completa',
    baseCalculo: baseCompleta,
    totalDeducoes: totalDeducoesCompleta,
    impostoBruto: impostoBrutoCompleta,
    impostoRetido: totalImpostoRetido,
    saldoFinal: saldoCompleta,
    aliquotaEfetiva: Number(aliquotaEfetivaCompleta.toFixed(2)),
  };

  // 4. Desconto Simplificado (20% até o teto)
  const descontoSimplificado = Number(
    Math.min(
      totalRendimentosTributaveis * params.percentualDescontoSimplificado,
      params.tetoDescontoSimplificado
    ).toFixed(2)
  );
  const baseSimplificada = Math.max(
    0,
    Number((totalRendimentosTributaveis - descontoSimplificado).toFixed(2))
  );
  const impostoBrutoSimplificada = calcularImpostoProgressivo(
    baseSimplificada,
    params.faixasAnuais
  );
  const saldoSimplificada = Number((impostoBrutoSimplificada - totalImpostoRetido).toFixed(2));
  const aliquotaEfetivaSimplificada =
    totalRendimentosTributaveis > 0
      ? (impostoBrutoSimplificada / totalRendimentosTributaveis) * 100
      : 0;

  const simplificada: ResultadoModeloIR = {
    nome: 'Desconto Simplificado',
    baseCalculo: baseSimplificada,
    totalDeducoes: descontoSimplificado,
    impostoBruto: impostoBrutoSimplificada,
    impostoRetido: totalImpostoRetido,
    saldoFinal: saldoSimplificada,
    aliquotaEfetiva: Number(aliquotaEfetivaSimplificada.toFixed(2)),
  };

  let melhorOpcao: 'completa' | 'simplificada' | 'empate' = 'empate';
  const economiaEstimada = Number(Math.abs(saldoCompleta - saldoSimplificada).toFixed(2));
  if (saldoCompleta < saldoSimplificada) {
    melhorOpcao = 'completa';
  } else if (saldoSimplificada < saldoCompleta) {
    melhorOpcao = 'simplificada';
  }

  // 5. Diagnóstico de Obrigatoriedade
  const motivosObrigatoriedade: string[] = [];
  if (totalRendimentosTributaveis > params.limiteObrigatoriedadeTributavel) {
    motivosObrigatoriedade.push(
      `Seus rendimentos tributáveis somam ${formatarMoedaBRL(totalRendimentosTributaveis)}, acima do limite anual configurado de ${formatarMoedaBRL(params.limiteObrigatoriedadeTributavel)}.`
    );
  }
  if (totalRendimentosIsentosOuExclusivos > params.limiteObrigatoriedadeIsento) {
    motivosObrigatoriedade.push(
      `Seus rendimentos isentos ou de tributação exclusiva somam ${formatarMoedaBRL(totalRendimentosIsentosOuExclusivos)}, acima do limite de ${formatarMoedaBRL(params.limiteObrigatoriedadeIsento)}.`
    );
  }

  let obrigatoriedade: DiagnosticoObrigatoriedade;
  if (informes.length === 0 && comprovantes.length === 0) {
    obrigatoriedade = {
      status: 'dados_insuficientes',
      titulo: 'Ainda faltam registros para avaliar a obrigatoriedade',
      explicacao:
        'Cadastre ao menos um Informe de Rendimentos ou Holerite na aba Entrada de Registros para que possamos verificar se existe obrigação de entregar a declaração.',
      motivos: [
        `Limite anual atual de rendimentos tributáveis: ${formatarMoedaBRL(params.limiteObrigatoriedadeTributavel)}.`,
        `Limite anual atual de rendimentos isentos/exclusivos: ${formatarMoedaBRL(params.limiteObrigatoriedadeIsento)}.`,
      ],
    };
  } else if (titularAtual?.residenteExterior) {
    obrigatoriedade = {
      status: 'obrigatorio',
      titulo: 'Atenção especial: pessoa residente no exterior',
      explicacao:
        'Quem reside no exterior segue regras específicas da Receita Federal (Declaração de Saída Definitiva e tributação exclusiva na fonte). Confira sua situação cadastral antes de transmitir a declaração comum.',
      motivos: [
        'O campo "Residente no exterior?" está marcado como Sim nos Dados da Pessoa Titular.',
        ...motivosObrigatoriedade,
      ],
    };
  } else if (motivosObrigatoriedade.length > 0) {
    obrigatoriedade = {
      status: 'obrigatorio',
      titulo: 'Sim — pelos valores informados, existe obrigação de declarar o IR',
      explicacao:
        'Com base nos rendimentos registrados e nos parâmetros fiscais deste ano-base, a entrega da declaração anual é obrigatória.',
      motivos: motivosObrigatoriedade,
    };
  } else if (totalImpostoRetido > 0) {
    obrigatoriedade = {
      status: 'isento_com_restituicao',
      titulo: 'Sem obrigação pelos rendimentos informados, mas vale declarar para receber restituição',
      explicacao: `Os rendimentos registrados ficaram abaixo do limite de ${formatarMoedaBRL(params.limiteObrigatoriedadeTributavel)}, porém houve ${formatarMoedaBRL(totalImpostoRetido)} de imposto retido na fonte. Entregar a declaração permite solicitar a devolução desse valor.`,
      motivos: [
        `Rendimentos tributáveis informados: ${formatarMoedaBRL(totalRendimentosTributaveis)}.`,
        `Imposto já retido na fonte passível de restituição: ${formatarMoedaBRL(totalImpostoRetido)}.`,
        'Verifique também outros critérios oficiais (como posse de bens acima do limite, ganho de capital ou operações em bolsa).',
      ],
    };
  } else {
    obrigatoriedade = {
      status: 'isento',
      titulo: 'Pelos rendimentos informados, não há obrigação de declarar',
      explicacao:
        'Seus rendimentos tributáveis e isentos registrados estão abaixo dos limites anuais configurados. Ainda assim, confirme no portal da Receita Federal se você não se enquadra em outros critérios (bens, bolsa de valores ou atividade rural).',
      motivos: [
        `Rendimentos tributáveis: ${formatarMoedaBRL(totalRendimentosTributaveis)} (limite: ${formatarMoedaBRL(params.limiteObrigatoriedadeTributavel)}).`,
        `Rendimentos isentos/exclusivos: ${formatarMoedaBRL(totalRendimentosIsentosOuExclusivos)} (limite: ${formatarMoedaBRL(params.limiteObrigatoriedadeIsento)}).`,
      ],
    };
  }

  // 6. Auditoria Preventiva de Malha Fina (100% transparente e baseada nos dados reais)
  const auditoriaMalha: ItemAuditoriaMalha[] = [];

  if (!titularAtual) {
    auditoriaMalha.push({
      id: 'titular-ausente',
      severidade: 'pendencia',
      titulo: 'Dados da Pessoa Titular ainda não salvos',
      descricao:
        'Nenhum registro da Pessoa Titular foi salvo até o momento. Sem esses dados, a identificação e a dedução de dependentes ficam incompletas.',
      acaoRecomendada: 'Acesse a aba "Dados da Pessoa Titular", preencha os campos e clique em Salvar.',
    });
  } else if (!validarCPF(titularAtual.cpf)) {
    auditoriaMalha.push({
      id: 'cpf-invalido',
      severidade: 'pendencia',
      titulo: 'CPF da Pessoa Titular com dígito inválido',
      descricao: 'O CPF salvo não passa na validação oficial de dígitos verificadores.',
      acaoRecomendada: 'Corrija o CPF na aba "Dados da Pessoa Titular" e salve novamente.',
    });
  } else {
    auditoriaMalha.push({
      id: 'titular-ok',
      severidade: 'conforme',
      titulo: 'Cadastro da Pessoa Titular completo e CPF válido',
      descricao: `Registro salvo em ${titularAtual.dataInclusao} com CPF matematicamente válido.`,
      acaoRecomendada: 'Nenhuma ação pendente neste item.',
    });
  }

  // Verificação de links do Google Drive nos Informes
  const informesSemLinkDrive = informes.filter(
    (i) => !i.anexoLinkDrive || !i.anexoLinkDrive.startsWith('https://')
  );
  if (informes.length === 0) {
    auditoriaMalha.push({
      id: 'informes-vazio',
      severidade: 'atencao',
      titulo: 'Nenhum Informe de Rendimentos registrado',
      descricao: 'Ainda não há informes bancários ou de fontes pagadoras nas tabelas de registro.',
      acaoRecomendada: 'Registre seus informes na aba "Entrada de Registros".',
    });
  } else if (informesSemLinkDrive.length > 0) {
    auditoriaMalha.push({
      id: 'informes-sem-drive',
      severidade: 'atencao',
      titulo: `${informesSemLinkDrive.length} informe(s) sem link real do Google Drive`,
      descricao:
        'Esses registros foram salvos em modo local antes da conexão ao Google Drive. Guardar o comprovante na pasta do Drive facilita atender eventuais solicitações da Receita.',
      acaoRecomendada:
        'Conecte sua conta Google e sincronize seus anexos para guardar o link permanente do Drive.',
    });
  } else {
    auditoriaMalha.push({
      id: 'informes-drive-ok',
      severidade: 'conforme',
      titulo: 'Todos os Informes de Rendimentos possuem link de anexo no Google Drive',
      descricao: `${informes.length} informe(s) arquivado(s) com comprovante vinculado.`,
      acaoRecomendada: 'Mantenha os arquivos na pasta do Drive por pelo menos 5 anos.',
    });
  }

  // Verificação de comprovantes de Saúde/Educação sem CPF/CNPJ do emitente
  const dedutiveisSemDoc = comprovantes.filter(
    (c) =>
      (c.categoria === 'Saúde (Dedutível)' || c.categoria === 'Educação (Dedutível)') &&
      !c.cpfCnpjEmitente.trim()
  );
  if (dedutiveisSemDoc.length > 0) {
    auditoriaMalha.push({
      id: 'dedutiveis-sem-doc',
      severidade: 'pendencia',
      titulo: `${dedutiveisSemDoc.length} despesa(s) dedutível(is) sem CPF/CNPJ do prestador`,
      descricao:
        'A divergência em despesas médicas e escolares sem CPF/CNPJ do emitente é uma das principais causas de retenção em malha fina.',
      acaoRecomendada:
        'Confira os recibos e garanta que o CPF/CNPJ da clínica, profissional ou escola esteja correto.',
    });
  } else if (comprovantes.length > 0) {
    auditoriaMalha.push({
      id: 'comprovantes-doc-ok',
      severidade: 'conforme',
      titulo: 'Comprovantes dedutíveis com identificação do emitente preenchida',
      descricao: 'As despesas de saúde e educação cadastradas incluem o CPF ou CNPJ de quem emitiu.',
      acaoRecomendada: 'Guarde os recibos originais (e o link no Drive) por no mínimo 5 anos.',
    });
  }

  // Possível duplicidade entre Informes de Salário e Holerites Mensais
  const temInformeSalario = informes.some(
    (i) => i.tipoRendimento === 'Salário / Pró-labore (Tributável)'
  );
  const temHoleriteComprovante = comprovantes.some(
    (c) => c.categoria === 'Holerite / Contracheque (Salário Mensal)'
  );
  if (temInformeSalario && temHoleriteComprovante) {
    auditoriaMalha.push({
      id: 'duplicidade-salario',
      severidade: 'atencao',
      titulo: 'Verifique possível duplicidade entre Informe Anual e Holerites Mensais',
      descricao:
        'Você cadastrou tanto um Informe de Salário quanto Holerites mensais em Comprovantes Fiscais. Se ambos forem do mesmo empregador e mesmo período, o total tributável pode ficar dobrado.',
      acaoRecomendada:
        'Confirme se os valores são de fontes diferentes; caso sejam da mesma empresa, utilize o Informe Anual consolidado para a declaração oficial.',
    });
  }

  // Teto de educação ultrapassado
  if (deducaoEducacaoInformada > tetoEducacaoTotal) {
    auditoriaMalha.push({
      id: 'teto-educacao',
      severidade: 'atencao',
      titulo: 'Despesas de educação acima do teto anual dedutível',
      descricao: `Foram lançados ${formatarMoedaBRL(deducaoEducacaoInformada)} em educação, mas o teto aceito para ${pessoasElegiveisEducacao} pessoa(s) é de ${formatarMoedaBRL(tetoEducacaoTotal)}. O simulador já limitou o cálculo automaticamente.`,
      acaoRecomendada:
        'Na declaração oficial, informe o valor real pago; o programa da Receita aplica o teto automaticamente (cursos livres/idiomas/esportes não são dedutíveis).',
    });
  }

  // Proporção alta de despesas médicas em relação à renda
  if (totalRendimentosTributaveis > 0 && deducaoSaude / totalRendimentosTributaveis > 0.35) {
    auditoriaMalha.push({
      id: 'saude-alta',
      severidade: 'atencao',
      titulo: 'Despesas médicas representam mais de 35% da renda tributável',
      descricao:
        'Não há limite legal para despesas médicas comprovadas, mas percentuais elevados costumam passar por conferência automática na Receita Federal.',
      acaoRecomendada:
        'Certifique-se de que todos os recibos têm nota fiscal/comprovante de pagamento anexado no Drive e não incluem valores reembolsados por plano de saúde.',
    });
  }

  // Seletores booleanos da Pessoa Titular
  if (titularAtual?.existeDependente) {
    auditoriaMalha.push({
      id: 'dependente-alerta',
      severidade: 'atencao',
      titulo: `Atenção aos rendimentos de ${quantidadeDependentes} pessoa(s) dependente(s)`,
      descricao:
        'Ao incluir dependentes na declaração, todos os rendimentos tributáveis recebidos por essas pessoas (como estágio, bolsa ou pensão) também precisam ser declarados.',
      acaoRecomendada:
        'Confira se alguma pessoa dependente recebeu rendimentos no ano antes de transmitir.',
    });
  }

  if (titularAtual?.alteracaoEntregaAnterior) {
    auditoriaMalha.push({
      id: 'alteracao-anterior',
      severidade: 'atencao',
      titulo: 'Alteração em relação à entrega anterior sinalizada',
      descricao:
        'Você marcou que houve alteração em relação à declaração anterior (como mudança de endereço, estado civil, retificação ou patrimônio).',
      acaoRecomendada:
        'Revise o número do recibo da última declaração e verifique se os dados cadastrais batem com o e-CAC.',
    });
  }

  if (titularAtual?.residenteExterior) {
    auditoriaMalha.push({
      id: 'residente-exterior',
      severidade: 'atencao',
      titulo: 'Situação especial: pessoa residente no exterior',
      descricao:
        'Pessoas residentes no exterior possuem regra própria (Comunicação e Declaração de Saída Definitiva do País).',
      acaoRecomendada:
        'Consulte a seção de residentes no exterior no portal Meu Imposto de Renda da Receita Federal.',
    });
  }

  const contagemMalha = {
    conformes: auditoriaMalha.filter((i) => i.severidade === 'conforme').length,
    atencoes: auditoriaMalha.filter((i) => i.severidade === 'atencao').length,
    pendencias: auditoriaMalha.filter((i) => i.severidade === 'pendencia').length,
  };

  return {
    rendimentosTributaveisInformes,
    rendimentosHoleritesComprovantes,
    totalRendimentosTributaveis,
    totalRendimentosIsentosOuExclusivos,
    totalRendimentosGerais,
    mediaMensalTributavel,
    totalImpostoRetido,
    deducaoSaude,
    deducaoEducacaoInformada,
    deducaoEducacaoAceita,
    deducaoPrevidenciaInformada,
    deducaoPrevidenciaAceita,
    deducaoPensao,
    quantidadeDependentes,
    deducaoDependentes,
    completa,
    simplificada,
    melhorOpcao,
    economiaEstimada,
    obrigatoriedade,
    auditoriaMalha,
    contagemMalha,
  };
}
