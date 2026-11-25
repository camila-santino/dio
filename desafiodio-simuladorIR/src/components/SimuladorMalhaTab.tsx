import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Table as TableIcon,
  XCircle,
} from 'lucide-react';
import type {
  ParametrosFiscaisAnuais,
  RegistroComprovanteFiscal,
  RegistroInformeRendimento,
  RegistroPessoaTitular,
} from '../types/ir';
import { RECEITA_FEDERAL_IR_URL } from '../types/ir';
import { DEFAULT_PARAMETROS_FISCAIS, executarSimulacaoIR } from '../utils/taxEngine';
import { detectarPIIEmTexto, formatarMoedaBRL } from '../utils/validators';

interface SimuladorMalhaTabProps {
  titularAtual: RegistroPessoaTitular | null;
  informes: RegistroInformeRendimento[];
  comprovantes: RegistroComprovanteFiscal[];
  parametros: ParametrosFiscaisAnuais;
  onUpdateParametros: (next: ParametrosFiscaisAnuais) => void;
  modoSemIA: boolean;
  onToggleModoSemIA: () => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
}

export function SimuladorMalhaTab({
  titularAtual,
  informes,
  comprovantes,
  parametros,
  onUpdateParametros,
  modoSemIA,
  onToggleModoSemIA,
  onAnnounce,
}: SimuladorMalhaTabProps) {
  const [mostrarTabelaGraficos, setMostrarTabelaGraficos] = useState(false);
  const [editarParametros, setEditarParametros] = useState(false);

  // Assistente opcional gratuito (gemini-4-hydrogen) com proteção rigorosa contra PII
  const [pergunta, setPergunta] = useState('');
  const [autorizarTotaisAnonimos, setAutorizarTotaisAnonimos] = useState(false);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [respostaIA, setRespostaIA] = useState('');
  const [erroIA, setErroIA] = useState('');

  const sim = useMemo(
    () => executarSimulacaoIR(titularAtual, informes, comprovantes, parametros),
    [titularAtual, informes, comprovantes, parametros]
  );

  // Dados dos gráficos acessíveis
  const maxComparativo = Math.max(
    1,
    sim.completa.baseCalculo,
    sim.simplificada.baseCalculo,
    sim.completa.impostoBruto,
    sim.simplificada.impostoBruto,
    sim.completa.totalDeducoes,
    sim.simplificada.totalDeducoes
  );

  const categoriasDistribuicao = [
    {
      label: 'Rendimentos Tributáveis (Informes)',
      valor: sim.rendimentosTributaveisInformes,
      cor: '#0F4C81',
    },
    {
      label: 'Holerites / Salários Mensais',
      valor: sim.rendimentosHoleritesComprovantes,
      cor: '#2563EB',
    },
    {
      label: 'Rendimentos Isentos / Exclusivos',
      valor: sim.totalRendimentosIsentosOuExclusivos,
      cor: '#0D9488',
    },
    {
      label: 'Dedução: Saúde',
      valor: sim.deducaoSaude,
      cor: '#15803D',
    },
    {
      label: 'Dedução: Educação (com teto)',
      valor: sim.deducaoEducacaoAceita,
      cor: '#B45309',
    },
    {
      label: 'Dedução: Dependentes + PGBL + Pensão',
      valor: sim.deducaoDependentes + sim.deducaoPrevidenciaAceita + sim.deducaoPensao,
      cor: '#6D28D9',
    },
  ];
  const maxCategoria = Math.max(1, ...categoriasDistribuicao.map((c) => c.valor));

  const updateParamNumero = (key: keyof ParametrosFiscaisAnuais, val: string) => {
    const num = Number(val);
    if (!Number.isFinite(num) || num < 0) return;
    onUpdateParametros({ ...parametros, [key]: num });
  };

  const updateFaixa = (
    idx: number,
    campo: 'limiteSuperior' | 'aliquota' | 'parcelaDeduzir',
    val: string
  ) => {
    const num = Number(val);
    if (!Number.isFinite(num) || num < 0) return;
    const novas = parametros.faixasAnuais.map((f, i) => {
      if (i !== idx) return f;
      if (campo === 'aliquota') {
        return { ...f, aliquota: num / 100 };
      }
      return { ...f, [campo]: num };
    });
    onUpdateParametros({ ...parametros, faixasAnuais: novas });
  };

  const handlePerguntarAssistente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroIA('');
    setRespostaIA('');

    if (modoSemIA) {
      setErroIA('O Modo 100% Sem IA está ativado. Desative-o acima caso queira enviar uma dúvida genérica.');
      return;
    }

    const q = pergunta.trim();
    if (q.length < 3) {
      setErroIA('Escreva sua dúvida em linguagem simples antes de enviar.');
      return;
    }

    // Bloqueio preventivo no navegador contra envio acidental de dados pessoais
    if (detectarPIIEmTexto(q)) {
      setErroIA(
        'Por sua segurança e privacidade, detectamos algo parecido com CPF, CNPJ ou e-mail na sua pergunta. Remova esses dados pessoais antes de enviar.'
      );
      onAnnounce('Envio bloqueado por privacidade: remova CPF, CNPJ ou e-mail da pergunta.', true);
      return;
    }

    setCarregandoIA(true);
    try {
      const anonymizedSummary = autorizarTotaisAnonimos
        ? [
            `Ano-base: ${parametros.anoCalendario}`,
            `Total rendimentos tributáveis: ${formatarMoedaBRL(sim.totalRendimentosTributaveis)}`,
            `Total rendimentos isentos/exclusivos: ${formatarMoedaBRL(sim.totalRendimentosIsentosOuExclusivos)}`,
            `IR retido na fonte: ${formatarMoedaBRL(sim.totalImpostoRetido)}`,
            `Deduções na completa: ${formatarMoedaBRL(sim.completa.totalDeducoes)} (dependentes: ${sim.quantidadeDependentes})`,
            `Saldo estimado Completa: ${formatarMoedaBRL(sim.completa.saldoFinal)}`,
            `Saldo estimado Simplificada: ${formatarMoedaBRL(sim.simplificada.saldoFinal)}`,
            `Diagnóstico de obrigatoriedade: ${sim.obrigatoriedade.titulo}`,
          ].join(' | ')
        : undefined;

      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          mode: 'irpf',
          anonymizedSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao consultar o assistente.');
      }
      setRespostaIA(data.answer);
      onAnnounce('Resposta do assistente em linguagem simples carregada abaixo.');
    } catch (err: unknown) {
      setErroIA(
        err instanceof Error
          ? err.message
          : 'Não foi possível obter resposta agora. Todos os cálculos locais seguem disponíveis.'
      );
    } finally {
      setCarregandoIA(false);
    }
  };

  const formatSaldo = (saldo: number) => {
    if (saldo < 0) return `Restituição estimada de ${formatarMoedaBRL(Math.abs(saldo))}`;
    if (saldo > 0) return `Imposto a pagar estimado de ${formatarMoedaBRL(saldo)}`;
    return 'Zero imposto a pagar ou restituir (R$ 0,00)';
  };

  const obrigatoriedadeStyle =
    sim.obrigatoriedade.status === 'obrigatorio'
      ? {
          bg: 'var(--status-warn-bg)',
          border: 'var(--status-warn-border)',
          text: 'var(--status-warn-text)',
          Icon: AlertTriangle,
        }
      : sim.obrigatoriedade.status === 'isento_com_restituicao' ||
          sim.obrigatoriedade.status === 'isento'
        ? {
            bg: 'var(--status-success-bg)',
            border: 'var(--status-success-border)',
            text: 'var(--status-success-text)',
            Icon: CheckCircle2,
          }
        : {
            bg: 'var(--bg-muted)',
            border: 'var(--border-strong)',
            text: 'var(--text-primary)',
            Icon: Info,
          };

  const ObrigIcon = obrigatoriedadeStyle.Icon;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Simulador de IR, Obrigatoriedade e Revisão de Malha Fina
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cálculo 100% gratuito, local e transparente baseado nos seus registros (rendimentos anuais, mensais, holerites e despesas dedutíveis) — sem necessidade de planos pagos e sem envio de dados pessoais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditarParametros((v) => !v)}
              aria-expanded={editarParametros}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: editarParametros ? 'var(--accent-soft)' : 'var(--bg-muted)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Parâmetros Fiscais ({parametros.anoCalendario})
            </button>
            <a
              href={RECEITA_FEDERAL_IR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Conferir na Receita Federal
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Painel Editável de Atualização Anual dos Parâmetros da Receita Federal */}
      {editarParametros && (
        <section
          aria-labelledby="heading-parametros-anuais"
          className="rounded-xl border p-5 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--accent-primary)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="heading-parametros-anuais" className="text-lg font-bold">
                Atualização Anual — Parâmetros Fiscais do Ano-Base
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Como a tabela progressiva e os limites de isenção podem mudar todos os anos, você pode editar livremente os valores abaixo conforme a publicação anual da Receita Federal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateParametros(DEFAULT_PARAMETROS_FISCAIS);
                onAnnounce('Parâmetros fiscais restaurados para os valores padrão de referência.');
              }}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restaurar valores padrão
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="param-ano" className="block text-xs font-bold mb-1">
                Ano-calendário de referência
              </label>
              <input
                id="param-ano"
                type="number"
                value={parametros.anoCalendario}
                onChange={(e) => updateParamNumero('anoCalendario', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label htmlFor="param-obrig-trib" className="block text-xs font-bold mb-1">
                Limite obrigatoriedade (Tributáveis R$)
              </label>
              <input
                id="param-obrig-trib"
                type="number"
                step="0.01"
                value={parametros.limiteObrigatoriedadeTributavel}
                onChange={(e) =>
                  updateParamNumero('limiteObrigatoriedadeTributavel', e.target.value)
                }
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label htmlFor="param-dep" className="block text-xs font-bold mb-1">
                Dedução por pessoa dependente (R$/ano)
              </label>
              <input
                id="param-dep"
                type="number"
                step="0.01"
                value={parametros.deducaoPorDependente}
                onChange={(e) => updateParamNumero('deducaoPorDependente', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label htmlFor="param-edu" className="block text-xs font-bold mb-1">
                Teto anual de Educação (R$/pessoa)
              </label>
              <input
                id="param-edu"
                type="number"
                step="0.01"
                value={parametros.tetoEducacaoAnual}
                onChange={(e) => updateParamNumero('tetoEducacaoAnual', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label htmlFor="param-teto-simp" className="block text-xs font-bold mb-1">
                Teto do Desconto Simplificado (R$)
              </label>
              <input
                id="param-teto-simp"
                type="number"
                step="0.01"
                value={parametros.tetoDescontoSimplificado}
                onChange={(e) => updateParamNumero('tetoDescontoSimplificado', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label htmlFor="param-obrig-isento" className="block text-xs font-bold mb-1">
                Limite obrigatoriedade (Isentos R$)
              </label>
              <input
                id="param-obrig-isento"
                type="number"
                step="0.01"
                value={parametros.limiteObrigatoriedadeIsento}
                onChange={(e) => updateParamNumero('limiteObrigatoriedadeIsento', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <caption className="text-left font-bold text-sm mb-2">
                Tabela Progressiva Anual (Editável)
              </caption>
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: 'var(--bg-table-head)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <th scope="col" className="px-3 py-2">Faixa</th>
                  <th scope="col" className="px-3 py-2">Base até (R$)</th>
                  <th scope="col" className="px-3 py-2">Alíquota (%)</th>
                  <th scope="col" className="px-3 py-2">Parcela a deduzir (R$)</th>
                </tr>
              </thead>
              <tbody>
                {parametros.faixasAnuais.map((faixa, idx) => (
                  <tr key={idx} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-3 py-2 font-semibold">Faixa {idx + 1}</td>
                    <td className="px-3 py-2">
                      {faixa.limiteSuperior === null ? (
                        <span style={{ color: 'var(--text-muted)' }}>Acima da faixa anterior</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          aria-label={`Limite superior da faixa ${idx + 1}`}
                          value={faixa.limiteSuperior}
                          onChange={(e) => updateFaixa(idx, 'limiteSuperior', e.target.value)}
                          className="w-36 rounded border px-2 py-1 font-mono-num"
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        aria-label={`Alíquota em percentual da faixa ${idx + 1}`}
                        value={Number((faixa.aliquota * 100).toFixed(2))}
                        onChange={(e) => updateFaixa(idx, 'aliquota', e.target.value)}
                        className="w-24 rounded border px-2 py-1 font-mono-num"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        aria-label={`Parcela a deduzir da faixa ${idx + 1}`}
                        value={faixa.parcelaDeduzir}
                        onChange={(e) => updateFaixa(idx, 'parcelaDeduzir', e.target.value)}
                        className="w-36 rounded border px-2 py-1 font-mono-num"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 1. DIAGNÓSTICO DE OBRIGATORIEDADE DO IR */}
      <section
        aria-labelledby="heading-obrigatoriedade"
        className="rounded-xl border p-5"
        style={{
          backgroundColor: obrigatoriedadeStyle.bg,
          borderColor: obrigatoriedadeStyle.border,
          color: obrigatoriedadeStyle.text,
        }}
      >
        <div className="flex items-start gap-3">
          <ObrigIcon className="h-6 w-6 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide">
              Verificação de obrigatoriedade (Ano-base {parametros.anoCalendario})
            </div>
            <h2 id="heading-obrigatoriedade" className="text-lg font-bold leading-snug">
              {sim.obrigatoriedade.titulo}
            </h2>
            <p className="text-sm leading-relaxed">{sim.obrigatoriedade.explicacao}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {sim.obrigatoriedade.motivos.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2. RESUMO NUMÉRICO (4 INDICADORES REAIS) */}
      <section aria-label="Resumo dos rendimentos e imposto" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Rendimentos Tributáveis (Anual)
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num">
            {formatarMoedaBRL(sim.totalRendimentosTributaveis)}
          </div>
          <div className="mt-1 text-xs font-mono-num" style={{ color: 'var(--text-secondary)' }}>
            Média mensal: {formatarMoedaBRL(sim.mediaMensalTributavel)}
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Isentos / Tributação Exclusiva
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num">
            {formatarMoedaBRL(sim.totalRendimentosIsentosOuExclusivos)}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Não entram na base progressiva
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            IR Já Retido na Fonte
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num">
            {formatarMoedaBRL(sim.totalImpostoRetido)}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Abatido do imposto devido
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Opção Mais Vantajosa
          </div>
          <div className="mt-1.5 text-xl font-bold">
            {sim.melhorOpcao === 'completa'
              ? 'Declaração Completa'
              : sim.melhorOpcao === 'simplificada'
                ? 'Desconto Simplificado'
                : 'Empate entre modelos'}
          </div>
          <div className="mt-1 text-xs font-mono-num" style={{ color: 'var(--status-success-text)' }}>
            {sim.economiaEstimada > 0
              ? `Economia estimada: ${formatarMoedaBRL(sim.economiaEstimada)}`
              : 'Mesmo resultado nos dois modelos'}
          </div>
        </div>
      </section>

      {/* 3. COMPARATIVO COMPLETA VS SIMPLIFICADA */}
      <section aria-labelledby="heading-comparativo" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[sim.completa, sim.simplificada].map((modelo) => {
          const isBest =
            (modelo.nome === 'Declaração Completa' && sim.melhorOpcao === 'completa') ||
            (modelo.nome === 'Desconto Simplificado' && sim.melhorOpcao === 'simplificada');

          return (
            <div
              key={modelo.nome}
              className="rounded-xl border p-5 space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isBest ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <h2
                  id={modelo.nome === 'Declaração Completa' ? 'heading-comparativo' : undefined}
                  className="text-lg font-bold"
                >
                  {modelo.nome}
                </h2>
                {isBest && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--status-success-text)' }}
                  >
                    Mais econômica
                  </span>
                )}
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt style={{ color: 'var(--text-secondary)' }}>Deduções aplicadas</dt>
                  <dd className="font-mono-num font-semibold">{formatarMoedaBRL(modelo.totalDeducoes)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: 'var(--text-secondary)' }}>Base de cálculo tributável</dt>
                  <dd className="font-mono-num font-semibold">{formatarMoedaBRL(modelo.baseCalculo)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: 'var(--text-secondary)' }}>Imposto apurado na tabela</dt>
                  <dd className="font-mono-num font-semibold">{formatarMoedaBRL(modelo.impostoBruto)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: 'var(--text-secondary)' }}>(-) IR já retido na fonte</dt>
                  <dd className="font-mono-num font-semibold">{formatarMoedaBRL(modelo.impostoRetido)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: 'var(--text-secondary)' }}>Alíquota efetiva</dt>
                  <dd className="font-mono-num font-semibold">{modelo.aliquotaEfetiva.toFixed(2)}%</dd>
                </div>
              </dl>

              <div
                className="rounded-lg border p-3.5 text-sm font-bold"
                style={
                  modelo.saldoFinal <= 0
                    ? {
                        backgroundColor: 'var(--status-success-bg)',
                        borderColor: 'var(--status-success-border)',
                        color: 'var(--status-success-text)',
                      }
                    : {
                        backgroundColor: 'var(--status-warn-bg)',
                        borderColor: 'var(--status-warn-border)',
                        color: 'var(--status-warn-text)',
                      }
                }
              >
                {formatSaldo(modelo.saldoFinal)}
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. GRÁFICOS ACESSÍVEIS + TABELA EQUIVALENTE PARA LEITORES DE TELA */}
      <section
        aria-labelledby="heading-graficos"
        className="rounded-xl border p-5 space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="heading-graficos" className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              Gráficos Acessíveis da Simulação e Malha Fina
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Cores com contraste seguro para daltonismo, rótulos diretos e alternativa em tabela textual para leitores de tela.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarTabelaGraficos((v) => !v)}
            aria-pressed={mostrarTabelaGraficos}
            className="min-h-[38px] inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <TableIcon className="h-4 w-4" aria-hidden="true" />
            {mostrarTabelaGraficos ? 'Exibir como gráficos visuais' : 'Exibir como tabela acessível'}
          </button>
        </div>

        {mostrarTabelaGraficos ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="text-left font-semibold mb-2">
                Tabela equivalente dos gráficos da simulação de IRPF
              </caption>
              <thead>
                <tr
                  className="border-b text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-table-head)', borderColor: 'var(--border-subtle)' }}
                >
                  <th scope="col" className="px-4 py-2.5">Indicador / Categoria</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5">Base de Cálculo — Declaração Completa</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{formatarMoedaBRL(sim.completa.baseCalculo)}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5">Base de Cálculo — Desconto Simplificado</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{formatarMoedaBRL(sim.simplificada.baseCalculo)}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5">Imposto Bruto — Declaração Completa</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{formatarMoedaBRL(sim.completa.impostoBruto)}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-2.5">Imposto Bruto — Desconto Simplificado</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">{formatarMoedaBRL(sim.simplificada.impostoBruto)}</td>
                </tr>
                {categoriasDistribuicao.map((cat) => (
                  <tr key={cat.label} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-2.5">{cat.label}</td>
                    <td className="px-4 py-2.5 text-right font-mono-num">{formatarMoedaBRL(cat.valor)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-2.5">Revisão de Malha Fina (Conformes / Atenção / Pendências)</td>
                  <td className="px-4 py-2.5 text-right font-mono-num">
                    {sim.contagemMalha.conformes} / {sim.contagemMalha.atencoes} / {sim.contagemMalha.pendencias}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico 1: Comparativo Completa vs Simplificada */}
            <div
              role="img"
              aria-label={`Gráfico comparativo: na Declaração Completa a base é ${formatarMoedaBRL(sim.completa.baseCalculo)} e o imposto apurado é ${formatarMoedaBRL(sim.completa.impostoBruto)}. No Desconto Simplificado a base é ${formatarMoedaBRL(sim.simplificada.baseCalculo)} e o imposto apurado é ${formatarMoedaBRL(sim.simplificada.impostoBruto)}.`}
              className="rounded-lg border p-4 space-y-4"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}
            >
              <h3 className="text-sm font-bold">Gráfico 1 — Completa vs. Simplificada</h3>
              {[
                {
                  titulo: 'Deduções aplicadas',
                  a: sim.completa.totalDeducoes,
                  b: sim.simplificada.totalDeducoes,
                },
                {
                  titulo: 'Base de cálculo',
                  a: sim.completa.baseCalculo,
                  b: sim.simplificada.baseCalculo,
                },
                {
                  titulo: 'Imposto apurado',
                  a: sim.completa.impostoBruto,
                  b: sim.simplificada.impostoBruto,
                },
              ].map((grupo) => (
                <div key={grupo.titulo} className="space-y-1.5">
                  <div className="text-xs font-semibold">{grupo.titulo}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0" style={{ color: 'var(--text-secondary)' }}>Completa</span>
                      <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(100, (grupo.a / maxComparativo) * 100)}%`,
                            backgroundColor: '#0F4C81',
                          }}
                        />
                      </div>
                      <span className="w-24 text-right font-mono-num shrink-0">{formatarMoedaBRL(grupo.a)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0" style={{ color: 'var(--text-secondary)' }}>Simplificada</span>
                      <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(100, (grupo.b / maxComparativo) * 100)}%`,
                            backgroundColor: '#0D9488',
                          }}
                        />
                      </div>
                      <span className="w-24 text-right font-mono-num shrink-0">{formatarMoedaBRL(grupo.b)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico 2: Distribuição de Rendimentos e Deduções */}
            <div
              role="img"
              aria-label={`Gráfico de composição por categoria: rendimentos tributáveis somam ${formatarMoedaBRL(sim.totalRendimentosTributaveis)}, isentos somam ${formatarMoedaBRL(sim.totalRendimentosIsentosOuExclusivos)} e deduções da completa somam ${formatarMoedaBRL(sim.completa.totalDeducoes)}.`}
              className="rounded-lg border p-4 space-y-3"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}
            >
              <h3 className="text-sm font-bold">Gráfico 2 — Composição de Rendimentos e Deduções</h3>
              {categoriasDistribuicao.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="font-medium truncate">{item.label}</span>
                    <span className="font-mono-num font-semibold shrink-0">{formatarMoedaBRL(item.valor)}</span>
                  </div>
                  <div className="h-3.5 w-full rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${item.valor > 0 ? Math.max(3, (item.valor / maxCategoria) * 100) : 0}%`,
                        backgroundColor: item.cor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 5. REVISÃO PREVENTIVA DE MALHA FINA */}
      <section
        aria-labelledby="heading-malha-fina"
        className="rounded-xl border p-5 space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 id="heading-malha-fina" className="text-lg font-bold">
              Revisão Preventiva de Malha Fina
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Conferência automática baseada em regras objetivas sobre seus registros reais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold font-mono-num">
            <span style={{ color: 'var(--status-success-text)' }}>
              Conformes: {sim.contagemMalha.conformes}
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ color: 'var(--status-warn-text)' }}>
              Pontos de atenção: {sim.contagemMalha.atencoes}
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ color: 'var(--status-error-text)' }}>
              Pendências: {sim.contagemMalha.pendencias}
            </span>
          </div>
        </div>

        {/* Barra proporcional da revisão de malha fina */}
        {sim.auditoriaMalha.length > 0 && (
          <div
            role="img"
            aria-label={`Resumo visual da revisão de malha fina: ${sim.contagemMalha.conformes} itens conformes, ${sim.contagemMalha.atencoes} pontos de atenção e ${sim.contagemMalha.pendencias} pendências críticas.`}
            className="flex h-3 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          >
            <div
              style={{
                width: `${(sim.contagemMalha.conformes / sim.auditoriaMalha.length) * 100}%`,
                backgroundColor: '#15803D',
              }}
            />
            <div
              style={{
                width: `${(sim.contagemMalha.atencoes / sim.auditoriaMalha.length) * 100}%`,
                backgroundColor: '#D97706',
              }}
            />
            <div
              style={{
                width: `${(sim.contagemMalha.pendencias / sim.auditoriaMalha.length) * 100}%`,
                backgroundColor: '#B91C1C',
              }}
            />
          </div>
        )}

        <ul className="space-y-3">
          {sim.auditoriaMalha.map((item) => {
            const estilo =
              item.severidade === 'conforme'
                ? {
                    bg: 'var(--status-success-bg)',
                    border: 'var(--status-success-border)',
                    text: 'var(--status-success-text)',
                    label: 'Conforme',
                    Icon: CheckCircle2,
                  }
                : item.severidade === 'atencao'
                  ? {
                      bg: 'var(--status-warn-bg)',
                      border: 'var(--status-warn-border)',
                      text: 'var(--status-warn-text)',
                      label: 'Ponto de atenção',
                      Icon: AlertTriangle,
                    }
                  : {
                      bg: 'var(--status-error-bg)',
                      border: 'var(--status-error-border)',
                      text: 'var(--status-error-text)',
                      label: 'Pendência crítica',
                      Icon: XCircle,
                    };
            const ItemIcon = estilo.Icon;
            return (
              <li
                key={item.id}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: estilo.bg,
                  borderColor: estilo.border,
                  color: estilo.text,
                }}
              >
                <div className="flex items-start gap-3">
                  <ItemIcon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold">{estilo.label}</div>
                    <h3 className="text-sm font-bold mt-0.5">{item.titulo}</h3>
                    <p className="text-sm mt-1 leading-relaxed">{item.descricao}</p>
                    <p className="text-xs mt-1.5 font-semibold">
                      Próximo passo: {item.acaoRecomendada}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 6. ASSISTENTE OPCIONAL GRATUITO & PRIVACIDADE MÁXIMA */}
      <section
        aria-labelledby="heading-assistente-privado"
        className="rounded-xl border p-5 space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="heading-assistente-privado" className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              Assistente Opcional em Linguagem Simples (Privacidade Protegida)
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Totalmente opcional e gratuito (sem plano pago). Seus dados pessoais (nome, CPF, endereço, e-mail, bancos ou links do Drive) <strong>nunca</strong> são enviados à IA. Você pode manter o <strong>Modo 100% Sem IA</strong> ligado o tempo todo.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleModoSemIA}
            aria-pressed={modoSemIA}
            className="min-h-[40px] rounded-lg border px-3.5 py-2 text-xs font-bold whitespace-nowrap"
            style={
              modoSemIA
                ? {
                    backgroundColor: 'var(--status-success-bg)',
                    borderColor: 'var(--status-success-border)',
                    color: 'var(--status-success-text)',
                  }
                : {
                    backgroundColor: 'var(--bg-muted)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }
            }
          >
            {modoSemIA ? 'Modo 100% Sem IA: ATIVO' : 'Ativar Modo 100% Sem IA'}
          </button>
        </div>

        {modoSemIA ? (
          <div
            className="rounded-lg border p-4 text-sm"
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            O <strong>Modo 100% Sem IA</strong> está ativado. Nenhum texto sai do seu navegador para serviços de inteligência artificial. Todos os cálculos, gráficos, revisão de malha fina, integração Google Drive/Sheets e scripts Apps Script continuam funcionando integralmente.
          </div>
        ) : (
          <form onSubmit={handlePerguntarAssistente} className="space-y-3">
            <div>
              <label htmlFor="pergunta-ir-ia" className="block text-sm font-semibold mb-1">
                Tire uma dúvida sobre termos do IR em linguagem simples (não digite CPF, nome ou e-mail)
              </label>
              <textarea
                id="pergunta-ir-ia"
                rows={3}
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder="Ex.: Qual a diferença entre Declaração Completa e Desconto Simplificado? Ou: Cursos de idiomas entram na dedução de educação?"
                className="w-full rounded-lg border p-3 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={autorizarTotaisAnonimos}
                onChange={(e) => setAutorizarTotaisAnonimos(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>
                Autorizar envio <strong>apenas dos totais numéricos anonimizados</strong> (sem nome, CPF, bancos ou links) para contextualizar a explicação.
              </span>
            </label>

            {erroIA && (
              <div
                role="alert"
                className="rounded-lg border p-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--status-error-bg)',
                  borderColor: 'var(--status-error-border)',
                  color: 'var(--status-error-text)',
                }}
              >
                {erroIA}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={carregandoIA}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                }}
              >
                {carregandoIA ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {carregandoIA ? 'Elaborando explicação acessível...' : 'Perguntar em linguagem simples'}
              </button>
            </div>

            {respostaIA && (
              <div
                role="region"
                aria-label="Resposta do assistente educativo"
                className="rounded-lg border p-4 text-sm whitespace-pre-wrap leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {respostaIA}
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
