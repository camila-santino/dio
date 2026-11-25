import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Info,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CategoriaComprovante,
  ComprovanteFiscalForm,
  ConfirmModalConfig,
  InformeRendimentoForm,
  PeriodicidadeRendimento,
  TipoRendimento,
  WorkspaceConfig,
} from '../types/ir';
import {
  formatarCPFOuCNPJ,
  formatarMoedaBRL,
  parseMoedaBRL,
  validarComprovanteFiscal,
  validarInformeRendimento,
} from '../utils/validators';

const INITIAL_INFORME_FORM: InformeRendimentoForm = {
  instituicaoBanco: '',
  tipoRendimento: 'Rendimento Bancário / Aplicação (Exclusivo ou Isento)',
  periodicidade: 'Anual',
  mesReferencia: '',
  valor: '',
  impostoRetido: '',
  observacao: '',
  anexoFile: null,
};

const INITIAL_COMPROVANTE_FORM: ComprovanteFiscalForm = {
  categoria: 'Holerite / Contracheque (Salário Mensal)',
  descricaoEmitente: '',
  cpfCnpjEmitente: '',
  dataDocumento: '',
  valor: '',
  impostoRetido: '',
  observacao: '',
  anexoFile: null,
};

const TIPOS_RENDIMENTO: TipoRendimento[] = [
  'Rendimento Bancário / Aplicação (Exclusivo ou Isento)',
  'Salário / Pró-labore (Tributável)',
  'Aposentadoria / Pensão (Tributável)',
  'Aluguel Recebido (Tributável)',
  'Trabalho Autônomo / MEI (Tributável)',
  'Poupança / LCI / LCA / Dividendos (Isento)',
  'Outros Rendimentos Tributáveis',
];

const CATEGORIAS_COMPROVANTE: CategoriaComprovante[] = [
  'Holerite / Contracheque (Salário Mensal)',
  'Saúde (Dedutível)',
  'Educação (Dedutível)',
  'Previdência Privada (PGBL)',
  'Pensão Alimentícia Judicial',
  'Outros Comprovantes / Notas Fiscais',
];

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface EntradaRegistrosTabProps {
  totalInformesRegistrados: number;
  totalComprovantesRegistrados: number;
  isGoogleConnected: boolean;
  workspaceConfig: WorkspaceConfig;
  onSaveInforme: (form: InformeRendimentoForm) => Promise<{ linkDrive: string; dataInclusao: string }>;
  onSaveComprovante: (
    form: ComprovanteFiscalForm
  ) => Promise<{ linkDrive: string; dataInclusao: string }>;
  onRequestConfirm: (cfg: ConfirmModalConfig) => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
  onOpenWorkspaceConfig: () => void;
}

export function EntradaRegistrosTab({
  totalInformesRegistrados,
  totalComprovantesRegistrados,
  isGoogleConnected,
  workspaceConfig,
  onSaveInforme,
  onSaveComprovante,
  onRequestConfirm,
  onAnnounce,
  onOpenWorkspaceConfig,
}: EntradaRegistrosTabProps) {
  // Estado Tabela 1: Informes de Rendimentos
  const [informeForm, setInformeForm] = useState<InformeRendimentoForm>(INITIAL_INFORME_FORM);
  const [informeErrors, setInformeErrors] = useState<Record<string, string>>({});
  const [informeFeedback, setInformeFeedback] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);
  const informeFileRef = useRef<HTMLInputElement>(null);
  const informeFirstRef = useRef<HTMLInputElement>(null);

  // Estado Tabela 2: Comprovantes Fiscais
  const [compForm, setCompForm] = useState<ComprovanteFiscalForm>(INITIAL_COMPROVANTE_FORM);
  const [compErrors, setCompErrors] = useState<Record<string, string>>({});
  const [compFeedback, setCompFeedback] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);
  const compFileRef = useRef<HTMLInputElement>(null);
  const compFirstRef = useRef<HTMLSelectElement>(null);

  const driveReady = Boolean(isGoogleConnected && workspaceConfig.driveFolderId);

  // --- Handlers Tabela 1: Informes de Rendimentos ---
  const updateInforme = <K extends keyof InformeRendimentoForm>(
    key: K,
    val: InformeRendimentoForm[K]
  ) => {
    setInformeForm((prev) => ({ ...prev, [key]: val }));
    if (informeErrors[key]) {
      setInformeErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (informeFeedback) setInformeFeedback(null);
  };

  const informeHasData =
    Boolean(informeForm.instituicaoBanco.trim()) ||
    Boolean(informeForm.valor.trim()) ||
    Boolean(informeForm.impostoRetido.trim()) ||
    Boolean(informeForm.observacao.trim()) ||
    Boolean(informeForm.anexoFile);

  const handleSalvarInforme = (e: React.FormEvent) => {
    e.preventDefault();
    const validacao = validarInformeRendimento(informeForm);
    if (!validacao.valid) {
      setInformeErrors(validacao.errors);
      const count = Object.keys(validacao.errors).length;
      onAnnounce(
        `Aviso de validação na tabela Informes de Rendimentos: ${count} campo(s) incompleto(s) ou inválido(s).`,
        true
      );
      const firstKey = Object.keys(validacao.errors)[0];
      setTimeout(() => document.getElementById(`inf-${firstKey}`)?.focus(), 50);
      return;
    }

    const valorNum = parseMoedaBRL(informeForm.valor);
    const destinoDrive = driveReady
      ? `Pasta "${workspaceConfig.driveFolderName}" no Google Drive (somente o link será gravado na tabela)`
      : 'Modo local (conecte o Google Drive para enviar o arquivo automaticamente e gerar o link real)';

    onRequestConfirm({
      title: 'Confirmar registro do Informe de Rendimentos?',
      description:
        'Ao confirmar, o anexo selecionado será enviado ao Google Drive, somente o link será incluído na tabela "Informes de Rendimentos registrados" com a data automática de inclusão e o formulário será limpo imediatamente.',
      details: [
        `Banco / Fonte: ${informeForm.instituicaoBanco}`,
        `Tipo: ${informeForm.tipoRendimento} (${informeForm.periodicidade}${
          informeForm.periodicidade === 'Mensal' && informeForm.mesReferencia
            ? ` — ${informeForm.mesReferencia}`
            : ''
        })`,
        `Valor: ${formatarMoedaBRL(valorNum)}`,
        `Anexo: ${informeForm.anexoFile?.name || 'Nenhum'}`,
        `Destino do anexo: ${destinoDrive}`,
      ],
      confirmLabel: 'Confirmar e salvar informe',
      onConfirm: async () => {
        const res = await onSaveInforme(informeForm);
        // Limpa imediatamente após confirmação
        setInformeForm(INITIAL_INFORME_FORM);
        if (informeFileRef.current) informeFileRef.current.value = '';
        setInformeErrors({});
        setInformeFeedback({
          type: 'success',
          text: driveReady
            ? `Informe salvo em ${res.dataInclusao}! Anexo enviado ao Google Drive (somente o link foi gravado) e formulário limpo automaticamente.`
            : `Informe registrado localmente em ${res.dataInclusao} e formulário limpo automaticamente. Conecte sua conta Google para enviar anexos ao Drive.`,
        });
        onAnnounce('Informe de Rendimentos salvo com sucesso e formulário limpo.', false);
      },
    });
  };

  const handleLimparInforme = () => {
    if (!informeHasData) {
      setInformeErrors({});
      setInformeFeedback({ type: 'info', text: 'Os campos de Informes de Rendimentos já estão vazios.' });
      onAnnounce('Os campos de Informes de Rendimentos já estão vazios.', false);
      return;
    }

    onRequestConfirm({
      title: 'Limpar campos de Informes de Rendimentos?',
      description: informeForm.anexoFile
        ? `Você desistiu de salvar? Os campos digitados serão limpos e o anexo temporário "${informeForm.anexoFile.name}" será descartado da memória — nada foi enviado ao Google Drive.`
        : 'Você desistiu de salvar? Todos os campos preenchidos nesta tabela serão limpos agora.',
      confirmLabel: 'Sim, limpar campos',
      variant: 'danger',
      onConfirm: () => {
        setInformeForm(INITIAL_INFORME_FORM);
        if (informeFileRef.current) informeFileRef.current.value = '';
        setInformeErrors({});
        setInformeFeedback({
          type: 'info',
          text: 'Formulário limpo. Nenhum dado ou anexo temporário foi enviado ao Google Drive.',
        });
        onAnnounce('Campos de Informes de Rendimentos limpos com sucesso.', false);
        setTimeout(() => informeFirstRef.current?.focus(), 60);
      },
    });
  };

  // --- Handlers Tabela 2: Comprovantes Fiscais ---
  const updateComp = <K extends keyof ComprovanteFiscalForm>(
    key: K,
    val: ComprovanteFiscalForm[K]
  ) => {
    setCompForm((prev) => ({ ...prev, [key]: val }));
    if (compErrors[key]) {
      setCompErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (compFeedback) setCompFeedback(null);
  };

  const compHasData =
    Boolean(compForm.descricaoEmitente.trim()) ||
    Boolean(compForm.cpfCnpjEmitente.trim()) ||
    Boolean(compForm.dataDocumento.trim()) ||
    Boolean(compForm.valor.trim()) ||
    Boolean(compForm.impostoRetido.trim()) ||
    Boolean(compForm.observacao.trim()) ||
    Boolean(compForm.anexoFile);

  const handleSalvarComprovante = (e: React.FormEvent) => {
    e.preventDefault();
    const validacao = validarComprovanteFiscal(compForm);
    if (!validacao.valid) {
      setCompErrors(validacao.errors);
      const count = Object.keys(validacao.errors).length;
      onAnnounce(
        `Aviso de validação na tabela Comprovantes Fiscais: ${count} campo(s) incompleto(s) ou inválido(s).`,
        true
      );
      const firstKey = Object.keys(validacao.errors)[0];
      setTimeout(() => document.getElementById(`comp-${firstKey}`)?.focus(), 50);
      return;
    }

    const valorNum = parseMoedaBRL(compForm.valor);
    const destinoDrive = driveReady
      ? `Pasta "${workspaceConfig.driveFolderName}" no Google Drive (somente o link será gravado na tabela)`
      : 'Modo local (conecte o Google Drive para enviar o arquivo automaticamente e gerar o link real)';

    onRequestConfirm({
      title: 'Confirmar registro do Comprovante Fiscal?',
      description:
        'Ao confirmar, o comprovante anexado será enviado ao Google Drive, somente o link será incluído na tabela "Comprovantes fiscais registrados" com a data automática de inclusão e o formulário será limpo imediatamente.',
      details: [
        `Categoria: ${compForm.categoria}`,
        `Descrição / Emitente: ${compForm.descricaoEmitente}`,
        `Valor: ${formatarMoedaBRL(valorNum)}`,
        `Anexo: ${compForm.anexoFile?.name || 'Nenhum'}`,
        `Destino do anexo: ${destinoDrive}`,
      ],
      confirmLabel: 'Confirmar e salvar comprovante',
      onConfirm: async () => {
        const res = await onSaveComprovante(compForm);
        // Limpa imediatamente após confirmação
        setCompForm(INITIAL_COMPROVANTE_FORM);
        if (compFileRef.current) compFileRef.current.value = '';
        setCompErrors({});
        setCompFeedback({
          type: 'success',
          text: driveReady
            ? `Comprovante salvo em ${res.dataInclusao}! Anexo enviado ao Google Drive (somente o link foi gravado) e formulário limpo automaticamente.`
            : `Comprovante registrado localmente em ${res.dataInclusao} e formulário limpo automaticamente.`,
        });
        onAnnounce('Comprovante Fiscal salvo com sucesso e formulário limpo.', false);
      },
    });
  };

  const handleLimparComprovante = () => {
    if (!compHasData) {
      setCompErrors({});
      setCompFeedback({ type: 'info', text: 'Os campos de Comprovantes Fiscais já estão vazios.' });
      onAnnounce('Os campos de Comprovantes Fiscais já estão vazios.', false);
      return;
    }

    onRequestConfirm({
      title: 'Limpar campos de Comprovantes Fiscais?',
      description: compForm.anexoFile
        ? `Você desistiu de salvar? Os campos digitados serão limpos e o anexo temporário "${compForm.anexoFile.name}" será descartado da memória — nada foi enviado ao Google Drive.`
        : 'Você desistiu de salvar? Todos os campos preenchidos nesta tabela serão limpos agora.',
      confirmLabel: 'Sim, limpar campos',
      variant: 'danger',
      onConfirm: () => {
        setCompForm(INITIAL_COMPROVANTE_FORM);
        if (compFileRef.current) compFileRef.current.value = '';
        setCompErrors({});
        setCompFeedback({
          type: 'info',
          text: 'Formulário limpo. Nenhum dado ou anexo temporário foi enviado ao Google Drive.',
        });
        onAnnounce('Campos de Comprovantes Fiscais limpos com sucesso.', false);
        setTimeout(() => compFirstRef.current?.focus(), 60);
      },
    });
  };

  const isHolerite = compForm.categoria === 'Holerite / Contracheque (Salário Mensal)';
  const isDedutivelComDoc =
    compForm.categoria === 'Saúde (Dedutível)' || compForm.categoria === 'Educação (Dedutível)';

  return (
    <div className="space-y-8">
      {/* Cabeçalho introdutório claro */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entrada de Registros</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Esta aba reúne apenas as tabelas de entrada de dados que enviam informações para as tabelas de registro. Anexos ficam temporariamente no navegador e só vão para o Google Drive quando você confirmar o salvamento.
            </p>
          </div>
          {!driveReady && (
            <button
              type="button"
              onClick={onOpenWorkspaceConfig}
              className="min-h-[40px] shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            >
              Configurar Planilha e Pasta no Drive
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TABELA 1: INFORMES DE RENDIMENTOS                                 */}
      {/* ================================================================= */}
      <form
        onSubmit={handleSalvarInforme}
        noValidate
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        aria-labelledby="heading-entrada-informes"
      >
        <div
          className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <h2 id="heading-entrada-informes" className="text-lg font-bold">
              1. Informes de Rendimentos (Bancários, Salários e Aplicações)
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Preencha com os dados atuais de cada banco ou fonte pagadora (anual ou mensal).
            </p>
          </div>
          <div className="text-sm font-semibold">
            <span style={{ color: 'var(--text-muted)' }}>Total já registrado: </span>
            <span className="font-mono-num" style={{ color: 'var(--text-primary)' }}>
              {formatarMoedaBRL(totalInformesRegistrados)}
            </span>
          </div>
        </div>

        {Object.keys(informeErrors).length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-5 mt-5 rounded-lg border p-4"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error-text)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Aviso de validação: complete os campos obrigatórios antes de salvar
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {Object.entries(informeErrors).map(([k, msg]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => document.getElementById(`inf-${k}`)?.focus()}
                    className="underline text-left font-medium"
                  >
                    {msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {informeFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="mx-5 mt-5 flex items-start gap-2 rounded-lg border p-3.5 text-sm font-medium"
            style={
              informeFeedback.type === 'success'
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
            {informeFeedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{informeFeedback.text}</span>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="inf-instituicaoBanco" className="block text-sm font-semibold mb-1.5">
              Banco ou Fonte Pagadora *
            </label>
            <input
              ref={informeFirstRef}
              id="inf-instituicaoBanco"
              type="text"
              value={informeForm.instituicaoBanco}
              onChange={(e) => updateInforme('instituicaoBanco', e.target.value)}
              aria-invalid={Boolean(informeErrors.instituicaoBanco)}
              placeholder="Ex.: Banco do Brasil, Nubank ou Empresa ABC"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: informeErrors.instituicaoBanco
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {informeErrors.instituicaoBanco && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {informeErrors.instituicaoBanco}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="inf-tipoRendimento" className="block text-sm font-semibold mb-1.5">
              Tipo de Rendimento *
            </label>
            <select
              id="inf-tipoRendimento"
              value={informeForm.tipoRendimento}
              onChange={(e) => updateInforme('tipoRendimento', e.target.value as TipoRendimento)}
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {TIPOS_RENDIMENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inf-periodicidade" className="block text-sm font-semibold mb-1.5">
              Periodicidade do lançamento *
            </label>
            <select
              id="inf-periodicidade"
              value={informeForm.periodicidade}
              onChange={(e) =>
                updateInforme('periodicidade', e.target.value as PeriodicidadeRendimento)
              }
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Anual">Anual (consolidado do ano inteiro)</option>
              <option value="Mensal">Mensal (rendimento de um mês específico)</option>
            </select>
          </div>

          {informeForm.periodicidade === 'Mensal' ? (
            <div>
              <label htmlFor="inf-mesReferencia" className="block text-sm font-semibold mb-1.5">
                Mês de referência *
              </label>
              <select
                id="inf-mesReferencia"
                value={informeForm.mesReferencia}
                onChange={(e) => updateInforme('mesReferencia', e.target.value)}
                aria-invalid={Boolean(informeErrors.mesReferencia)}
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: informeErrors.mesReferencia
                    ? 'var(--status-error-border)'
                    : 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Selecione o mês</option>
                {MESES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {informeErrors.mesReferencia && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                  {informeErrors.mesReferencia}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="inf-observacao" className="block text-sm font-semibold mb-1.5">
                Observação / Nota (opcional)
              </label>
              <input
                id="inf-observacao"
                type="text"
                value={informeForm.observacao}
                onChange={(e) => updateInforme('observacao', e.target.value)}
                placeholder="Ex.: Conta corrente + CDB consolidados"
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          <div>
            <label htmlFor="inf-valor" className="block text-sm font-semibold mb-1.5">
              Valor atual / recebido (R$) *
            </label>
            <input
              id="inf-valor"
              type="text"
              inputMode="decimal"
              value={informeForm.valor}
              onChange={(e) => updateInforme('valor', e.target.value)}
              aria-invalid={Boolean(informeErrors.valor)}
              placeholder="Ex.: 48500,00"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: informeErrors.valor ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {informeErrors.valor && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {informeErrors.valor}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="inf-impostoRetido" className="block text-sm font-semibold mb-1.5">
              Imposto retido na fonte (R$, opcional)
            </label>
            <input
              id="inf-impostoRetido"
              type="text"
              inputMode="decimal"
              value={informeForm.impostoRetido}
              onChange={(e) => updateInforme('impostoRetido', e.target.value)}
              aria-invalid={Boolean(informeErrors.impostoRetido)}
              placeholder="Ex.: 1250,00"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: informeErrors.impostoRetido
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Ajuda o simulador a calcular imposto a pagar ou restituição.
            </p>
            {informeErrors.impostoRetido && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {informeErrors.impostoRetido}
              </p>
            )}
          </div>

          {informeForm.periodicidade === 'Mensal' && (
            <div className="md:col-span-2">
              <label htmlFor="inf-observacao" className="block text-sm font-semibold mb-1.5">
                Observação / Nota (opcional)
              </label>
              <input
                id="inf-observacao"
                type="text"
                value={informeForm.observacao}
                onChange={(e) => updateInforme('observacao', e.target.value)}
                placeholder="Ex.: Rendimento mensal de aluguel ou extrato mensal"
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Anexo temporário seguro */}
          <div className="md:col-span-2">
            <label htmlFor="inf-anexoFile" className="block text-sm font-semibold mb-1.5">
              Anexo do Informe de Rendimentos (PDF ou imagem) *
            </label>
            <div
              className="rounded-lg border p-4"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: informeErrors.anexoFile
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={informeFileRef}
                  id="inf-anexoFile"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => updateInforme('anexoFile', e.target.files?.[0] || null)}
                  aria-invalid={Boolean(informeErrors.anexoFile)}
                  aria-describedby="hint-inf-anexo"
                  className="text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:cursor-pointer"
                />
                {informeForm.anexoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      updateInforme('anexoFile', null);
                      if (informeFileRef.current) informeFileRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Remover anexo temporário
                  </button>
                )}
              </div>
              <p id="hint-inf-anexo" className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <FileUp className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {informeForm.anexoFile
                    ? `Arquivo temporário selecionado: "${informeForm.anexoFile.name}" (${Math.max(1, Math.round(informeForm.anexoFile.size / 1024))} KB). Ele ainda NÃO foi enviado ao Google Drive — só será enviado quando você confirmar o salvamento. Na tabela de registro ficará gravado somente o link.`
                    : 'Fica em memória temporária até você confirmar o salvamento. Se clicar em "Limpar campos", nenhum arquivo é enviado ao Google Drive.'}
                </span>
              </p>
            </div>
            {informeErrors.anexoFile && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {informeErrors.anexoFile}
              </p>
            )}
          </div>
        </div>

        {/* Dois botões obrigatórios abaixo da Tabela 1 */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Destino: tabela <strong>Informes de Rendimentos registrados</strong> (com data automática e apenas o link do Drive).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLimparInforme}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Limpar campos
            </button>
            <button
              type="submit"
              className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
              }}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar Informe de Rendimentos
            </button>
          </div>
        </div>
      </form>

      {/* ================================================================= */}
      {/* TABELA 2: COMPROVANTES FISCAIS (HOLERITES E NOTAS FISCAIS)        */}
      {/* ================================================================= */}
      <form
        onSubmit={handleSalvarComprovante}
        noValidate
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        aria-labelledby="heading-entrada-comprovantes"
      >
        <div
          className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <h2 id="heading-entrada-comprovantes" className="text-lg font-bold">
              2. Comprovantes Fiscais (Holerites, Saúde, Educação e Notas)
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Inclua holerites mensais (salário), recibos de saúde/educação dedutíveis, previdência e outras notas fiscais.
            </p>
          </div>
          <div className="text-sm font-semibold">
            <span style={{ color: 'var(--text-muted)' }}>Total já registrado: </span>
            <span className="font-mono-num" style={{ color: 'var(--text-primary)' }}>
              {formatarMoedaBRL(totalComprovantesRegistrados)}
            </span>
          </div>
        </div>

        {Object.keys(compErrors).length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-5 mt-5 rounded-lg border p-4"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error-text)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Aviso de validação: complete os campos obrigatórios antes de salvar
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {Object.entries(compErrors).map(([k, msg]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => document.getElementById(`comp-${k}`)?.focus()}
                    className="underline text-left font-medium"
                  >
                    {msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {compFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="mx-5 mt-5 flex items-start gap-2 rounded-lg border p-3.5 text-sm font-medium"
            style={
              compFeedback.type === 'success'
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
            {compFeedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{compFeedback.text}</span>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="comp-categoria" className="block text-sm font-semibold mb-1.5">
              Categoria do comprovante *
            </label>
            <select
              ref={compFirstRef}
              id="comp-categoria"
              value={compForm.categoria}
              onChange={(e) => updateComp('categoria', e.target.value as CategoriaComprovante)}
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {CATEGORIAS_COMPROVANTE.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {isHolerite
                ? 'Holerites somam automaticamente nos rendimentos mensais/anuais do Simulador de IR.'
                : 'Despesas de Saúde, Educação, PGBL e Pensão entram nas deduções da Declaração Completa.'}
            </p>
          </div>

          <div>
            <label htmlFor="comp-descricaoEmitente" className="block text-sm font-semibold mb-1.5">
              {isHolerite ? 'Empregador / Fonte do Holerite *' : 'Descrição / Pessoa ou Empresa Emitente *'}
            </label>
            <input
              id="comp-descricaoEmitente"
              type="text"
              value={compForm.descricaoEmitente}
              onChange={(e) => updateComp('descricaoEmitente', e.target.value)}
              aria-invalid={Boolean(compErrors.descricaoEmitente)}
              placeholder={
                isHolerite
                  ? 'Ex.: Holerite Março — Empresa XYZ Ltda'
                  : 'Ex.: Consulta odontológica — Clínica Sorriso'
              }
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: compErrors.descricaoEmitente
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {compErrors.descricaoEmitente && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {compErrors.descricaoEmitente}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comp-cpfCnpjEmitente" className="block text-sm font-semibold mb-1.5">
              CPF ou CNPJ do Emitente {isDedutivelComDoc ? '*' : '(opcional)'}
            </label>
            <input
              id="comp-cpfCnpjEmitente"
              type="text"
              inputMode="numeric"
              value={compForm.cpfCnpjEmitente}
              onChange={(e) => updateComp('cpfCnpjEmitente', formatarCPFOuCNPJ(e.target.value))}
              aria-invalid={Boolean(compErrors.cpfCnpjEmitente)}
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: compErrors.cpfCnpjEmitente
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {compErrors.cpfCnpjEmitente && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {compErrors.cpfCnpjEmitente}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comp-dataDocumento" className="block text-sm font-semibold mb-1.5">
              Data do Comprovante / Competência *
            </label>
            <input
              id="comp-dataDocumento"
              type="date"
              value={compForm.dataDocumento}
              onChange={(e) => updateComp('dataDocumento', e.target.value)}
              aria-invalid={Boolean(compErrors.dataDocumento)}
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: compErrors.dataDocumento
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {compErrors.dataDocumento && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {compErrors.dataDocumento}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comp-valor" className="block text-sm font-semibold mb-1.5">
              {isHolerite ? 'Valor Bruto do Holerite (R$) *' : 'Valor do Comprovante (R$) *'}
            </label>
            <input
              id="comp-valor"
              type="text"
              inputMode="decimal"
              value={compForm.valor}
              onChange={(e) => updateComp('valor', e.target.value)}
              aria-invalid={Boolean(compErrors.valor)}
              placeholder="Ex.: 3800,00"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: compErrors.valor ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {compErrors.valor && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {compErrors.valor}
              </p>
            )}
          </div>

          {isHolerite ? (
            <div>
              <label htmlFor="comp-impostoRetido" className="block text-sm font-semibold mb-1.5">
                IR Retido na Fonte no Holerite (R$, opcional)
              </label>
              <input
                id="comp-impostoRetido"
                type="text"
                inputMode="decimal"
                value={compForm.impostoRetido}
                onChange={(e) => updateComp('impostoRetido', e.target.value)}
                aria-invalid={Boolean(compErrors.impostoRetido)}
                placeholder="Ex.: 145,50"
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: compErrors.impostoRetido
                    ? 'var(--status-error-border)'
                    : 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              {compErrors.impostoRetido && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                  {compErrors.impostoRetido}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="comp-observacao" className="block text-sm font-semibold mb-1.5">
                Observação / Nota (opcional)
              </label>
              <input
                id="comp-observacao"
                type="text"
                value={compForm.observacao}
                onChange={(e) => updateComp('observacao', e.target.value)}
                placeholder="Ex.: Referente a pessoa dependente ou nota fiscal nº 123"
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {isHolerite && (
            <div className="md:col-span-2">
              <label htmlFor="comp-observacao" className="block text-sm font-semibold mb-1.5">
                Observação / Nota (opcional)
              </label>
              <input
                id="comp-observacao"
                type="text"
                value={compForm.observacao}
                onChange={(e) => updateComp('observacao', e.target.value)}
                placeholder="Ex.: Salário mensal + 13º ou adicional"
                className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Anexo temporário seguro para Comprovantes Fiscais */}
          <div className="md:col-span-2">
            <label htmlFor="comp-anexoFile" className="block text-sm font-semibold mb-1.5">
              Anexo do Comprovante Fiscal ou Holerite (PDF ou imagem) *
            </label>
            <div
              className="rounded-lg border p-4"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: compErrors.anexoFile
                  ? 'var(--status-error-border)'
                  : 'var(--border-strong)',
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={compFileRef}
                  id="comp-anexoFile"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => updateComp('anexoFile', e.target.files?.[0] || null)}
                  aria-invalid={Boolean(compErrors.anexoFile)}
                  aria-describedby="hint-comp-anexo"
                  className="text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:cursor-pointer"
                />
                {compForm.anexoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      updateComp('anexoFile', null);
                      if (compFileRef.current) compFileRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Remover anexo temporário
                  </button>
                )}
              </div>
              <p id="hint-comp-anexo" className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <FileUp className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {compForm.anexoFile
                    ? `Arquivo temporário selecionado: "${compForm.anexoFile.name}" (${Math.max(1, Math.round(compForm.anexoFile.size / 1024))} KB). Enviado ao Drive somente após sua confirmação — na tabela de registro entra apenas o link.`
                    : 'Mantido apenas em memória temporária até você confirmar. Clicar em "Limpar campos" descarta o arquivo sem enviar nada ao Google Drive.'}
                </span>
              </p>
            </div>
            {compErrors.anexoFile && (
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {compErrors.anexoFile}
              </p>
            )}
          </div>
        </div>

        {/* Dois botões obrigatórios abaixo da Tabela 2 */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Destino: tabela <strong>Comprovantes fiscais registrados</strong> (com data automática e apenas o link do Drive).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLimparComprovante}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Limpar campos
            </button>
            <button
              type="submit"
              className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
              }}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar Comprovante Fiscal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
