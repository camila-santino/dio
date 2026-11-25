import { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Save,
  Trash2,
} from 'lucide-react';
import type {
  ConfirmModalConfig,
  DadosPessoaTitularForm,
  EstadoCivil,
  RegistroPessoaTitular,
  TabId,
  WorkspaceConfig,
} from '../types/ir';
import { RECEITA_FEDERAL_IR_URL } from '../types/ir';
import {
  carimbarDataHoraAtual,
  formatarCEP,
  formatarCPF,
  formatarTelefone,
  validarDadosPessoaTitular,
} from '../utils/validators';

export const INITIAL_TITULAR_FORM: DadosPessoaTitularForm = {
  nomeCompleto: '',
  cpf: '',
  documentoOficial: '',
  dataNascimento: '',
  estadoCivil: '',
  enderecoCompleto: '',
  cep: '',
  cidadeEstado: '',
  telefone: '',
  contatoPorApp: '',
  email: '',
  alteracaoEntregaAnterior: false,
  existeDependente: false,
  quantidadeDependentes: '1',
  residenteExterior: false,
};

interface DadosTitularTabProps {
  onNavigateTab: (tab: TabId) => void;
  onSaveTitular: (registro: RegistroPessoaTitular) => Promise<void>;
  onRequestConfirm: (cfg: ConfirmModalConfig) => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
  workspaceConfig: WorkspaceConfig;
  isGoogleConnected: boolean;
  ultimoTitularSalvo: RegistroPessoaTitular | null;
}

const ESTADOS_CIVIS: EstadoCivil[] = [
  'Solteira / Solteiro',
  'Casada / Casado',
  'União Estável',
  'Divorciada / Divorciado',
  'Separada / Separado',
  'Viúva / Viúvo',
];

export function DadosTitularTab({
  onNavigateTab,
  onSaveTitular,
  onRequestConfirm,
  onAnnounce,
  workspaceConfig,
  isGoogleConnected,
  ultimoTitularSalvo,
}: DadosTitularTabProps) {
  const [form, setForm] = useState<DadosPessoaTitularForm>(INITIAL_TITULAR_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const hasAnyFilled =
    Object.entries(form).some(([key, val]) => {
      if (key === 'quantidadeDependentes') return false;
      if (typeof val === 'boolean') return val;
      return String(val).trim().length > 0;
    });

  const updateField = <K extends keyof DadosPessoaTitularForm>(
    key: K,
    value: DadosPessoaTitularForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (statusFeedback) setStatusFeedback(null);
  };

  const focusFirstError = (errMap: Record<string, string>) => {
    const firstKey = Object.keys(errMap)[0];
    if (!firstKey) return;
    const el = document.getElementById(`titular-${firstKey}`);
    el?.focus();
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validarDadosPessoaTitular(form);
    if (!result.valid) {
      setErrors(result.errors);
      const qtd = Object.keys(result.errors).length;
      onAnnounce(
        `Existem ${qtd} pendência(s) de validação nos Dados da Pessoa Titular. Revise os campos indicados.`,
        true
      );
      setTimeout(() => focusFirstError(result.errors), 50);
      return;
    }

    const destinoSheets =
      isGoogleConnected && workspaceConfig.spreadsheetId
        ? `Planilha "${workspaceConfig.spreadsheetTitle}" (aba ${workspaceConfig.abaTitular})`
        : 'Tabela local de registros (conecte sua conta Google para enviar também ao Google Sheets)';

    onRequestConfirm({
      title: 'Confirmar salvamento dos Dados da Pessoa Titular?',
      description:
        'Ao confirmar, os dados serão adicionados à tabela de registro com a data e hora automáticas de inclusão e o formulário será limpo imediatamente.',
      details: [
        `Pessoa Titular: ${form.nomeCompleto} (CPF ${form.cpf})`,
        `Dependentes: ${form.existeDependente ? `Sim (${form.quantidadeDependentes} pessoa(s))` : 'Não'}`,
        `Residente no exterior: ${form.residenteExterior ? 'Sim' : 'Não'}`,
        `Destino: ${destinoSheets}`,
      ],
      confirmLabel: 'Confirmar e salvar',
      onConfirm: async () => {
        const novoRegistro: RegistroPessoaTitular = {
          ...form,
          quantidadeDependentes: form.existeDependente ? form.quantidadeDependentes : '0',
          id: `tit-${Date.now()}`,
          dataInclusao: carimbarDataHoraAtual(),
          sincronizadoSheets: Boolean(isGoogleConnected && workspaceConfig.spreadsheetId),
        };
        await onSaveTitular(novoRegistro);
        // Limpa imediatamente após confirmação da operação
        setForm(INITIAL_TITULAR_FORM);
        setErrors({});
        setStatusFeedback({
          type: 'success',
          text: `Dados da Pessoa Titular salvos em ${novoRegistro.dataInclusao} e formulário limpo automaticamente.`,
        });
        onAnnounce(
          'Dados da Pessoa Titular salvos com sucesso na tabela de registro e formulário limpo.',
          false
        );
      },
    });
  };

  const handleLimpar = () => {
    if (!hasAnyFilled) {
      setErrors({});
      setStatusFeedback({
        type: 'info',
        text: 'Os campos já estão vazios.',
      });
      onAnnounce('Os campos de Dados da Pessoa Titular já estão vazios.', false);
      return;
    }

    onRequestConfirm({
      title: 'Limpar os campos preenchidos?',
      description:
        'Se você desistiu de salvar, todos os campos digitados na tabela Dados da Pessoa Titular serão apagados agora.',
      confirmLabel: 'Sim, limpar campos',
      variant: 'danger',
      onConfirm: () => {
        setForm(INITIAL_TITULAR_FORM);
        setErrors({});
        setStatusFeedback({
          type: 'info',
          text: 'Campos limpos conforme solicitado. Nenhum dado foi salvo.',
        });
        onAnnounce('Campos de Dados da Pessoa Titular limpos com sucesso.', false);
        setTimeout(() => firstInputRef.current?.focus(), 60);
      },
    });
  };

  const errorEntries = Object.entries(errors);

  return (
    <div className="space-y-6">
      {/* Cabeçalho contextual com os atalhos oficiais do arquivo atualizado */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dados da Pessoa Titular</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Preencha os dados cadastrais da pessoa responsável pela declaração. Ao salvar, a data de inclusão é carimbada automaticamente e os campos são limpos em seguida.
            </p>
          </div>
          <nav aria-label="Atalhos rápidos de apoio" className="flex flex-wrap items-center gap-2.5">
            <a
              href={RECEITA_FEDERAL_IR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              Ir para Meu Imposto de Renda
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => onNavigateTab('tutorial')}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Ir para o Tutorial
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('tutorial')}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Ir para o Glossário
            </button>
          </nav>
        </div>

        {ultimoTitularSalvo && (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5 text-sm"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span>
              Último cadastro registrado: <strong style={{ color: 'var(--text-primary)' }}>{ultimoTitularSalvo.nomeCompleto}</strong>{' '}
              <span aria-hidden="true">·</span> CPF <span className="font-mono-num">{ultimoTitularSalvo.cpf}</span>{' '}
              <span aria-hidden="true">·</span> incluído em <span className="font-mono-num">{ultimoTitularSalvo.dataInclusao}</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('registros')}
              className="text-sm font-semibold underline"
              style={{ color: 'var(--accent-primary)' }}
            >
              Ver na tabela de registros
            </button>
          </div>
        )}
      </div>

      {/* Formulário em formato de tabela estruturada */}
      <form
        onSubmit={handleSalvar}
        noValidate
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        aria-labelledby="titulo-tabela-titular"
      >
        <div
          className="border-b px-5 py-4"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h2 id="titulo-tabela-titular" className="text-base font-bold">
            Tabela de Entrada — Dados da Pessoa Titular
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Campos marcados com asterisco (*) são obrigatórios para evitar envio de dados incompletos.
          </p>
        </div>

        {/* Resumo acessível de erros de validação */}
        {errorEntries.length > 0 && (
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
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Aviso de validação: corrija {errorEntries.length} campo(s) antes de salvar
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              {errorEntries.map(([field, msg]) => (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => document.getElementById(`titular-${field}`)?.focus()}
                    className="underline text-left font-medium"
                  >
                    {msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {statusFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="mx-5 mt-5 rounded-lg border p-3.5 text-sm font-medium"
            style={
              statusFeedback.type === 'success'
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
            {statusFeedback.text}
          </div>
        )}

        <div className="p-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Nome completo */}
          <div className="md:col-span-2">
            <label htmlFor="titular-nomeCompleto" className="block text-sm font-semibold mb-1.5">
              Nome completo *
            </label>
            <input
              ref={firstInputRef}
              id="titular-nomeCompleto"
              type="text"
              autoComplete="name"
              value={form.nomeCompleto}
              onChange={(e) => updateField('nomeCompleto', e.target.value)}
              aria-invalid={Boolean(errors.nomeCompleto)}
              aria-describedby={errors.nomeCompleto ? 'err-titular-nomeCompleto' : undefined}
              placeholder="Ex.: Maria Clara Souza"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.nomeCompleto ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.nomeCompleto && (
              <p id="err-titular-nomeCompleto" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.nomeCompleto}
              </p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="titular-cpf" className="block text-sm font-semibold mb-1.5">
              CPF *
            </label>
            <input
              id="titular-cpf"
              type="text"
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => updateField('cpf', formatarCPF(e.target.value))}
              aria-invalid={Boolean(errors.cpf)}
              aria-describedby={errors.cpf ? 'err-titular-cpf' : 'hint-titular-cpf'}
              placeholder="000.000.000-00"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.cpf ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            <p id="hint-titular-cpf" className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Os dígitos verificadores são conferidos automaticamente.
            </p>
            {errors.cpf && (
              <p id="err-titular-cpf" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.cpf}
              </p>
            )}
          </div>

          {/* Documento Oficial */}
          <div>
            <label htmlFor="titular-documentoOficial" className="block text-sm font-semibold mb-1.5">
              Documento de Identificação Oficial (RG, CNH ou CIN) *
            </label>
            <input
              id="titular-documentoOficial"
              type="text"
              value={form.documentoOficial}
              onChange={(e) => updateField('documentoOficial', e.target.value)}
              aria-invalid={Boolean(errors.documentoOficial)}
              aria-describedby={errors.documentoOficial ? 'err-titular-documentoOficial' : undefined}
              placeholder="Ex.: RG 12.345.678-9 SSP/SP"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.documentoOficial ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.documentoOficial && (
              <p id="err-titular-documentoOficial" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.documentoOficial}
              </p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label htmlFor="titular-dataNascimento" className="block text-sm font-semibold mb-1.5">
              Data de Nascimento *
            </label>
            <input
              id="titular-dataNascimento"
              type="date"
              value={form.dataNascimento}
              onChange={(e) => updateField('dataNascimento', e.target.value)}
              aria-invalid={Boolean(errors.dataNascimento)}
              aria-describedby={errors.dataNascimento ? 'err-titular-dataNascimento' : undefined}
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.dataNascimento ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.dataNascimento && (
              <p id="err-titular-dataNascimento" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.dataNascimento}
              </p>
            )}
          </div>

          {/* Estado Civil */}
          <div>
            <label htmlFor="titular-estadoCivil" className="block text-sm font-semibold mb-1.5">
              Estado Civil *
            </label>
            <select
              id="titular-estadoCivil"
              value={form.estadoCivil}
              onChange={(e) => updateField('estadoCivil', e.target.value as EstadoCivil)}
              aria-invalid={Boolean(errors.estadoCivil)}
              aria-describedby={errors.estadoCivil ? 'err-titular-estadoCivil' : undefined}
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.estadoCivil ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Selecione uma opção</option>
              {ESTADOS_CIVIS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            {errors.estadoCivil && (
              <p id="err-titular-estadoCivil" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.estadoCivil}
              </p>
            )}
          </div>

          {/* Endereço completo */}
          <div className="md:col-span-2">
            <label htmlFor="titular-enderecoCompleto" className="block text-sm font-semibold mb-1.5">
              Endereço completo *
            </label>
            <input
              id="titular-enderecoCompleto"
              type="text"
              autoComplete="street-address"
              value={form.enderecoCompleto}
              onChange={(e) => updateField('enderecoCompleto', e.target.value)}
              aria-invalid={Boolean(errors.enderecoCompleto)}
              aria-describedby={errors.enderecoCompleto ? 'err-titular-enderecoCompleto' : undefined}
              placeholder="Rua, número, complemento e bairro"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.enderecoCompleto ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.enderecoCompleto && (
              <p id="err-titular-enderecoCompleto" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.enderecoCompleto}
              </p>
            )}
          </div>

          {/* CEP */}
          <div>
            <label htmlFor="titular-cep" className="block text-sm font-semibold mb-1.5">
              CEP *
            </label>
            <input
              id="titular-cep"
              type="text"
              inputMode="numeric"
              value={form.cep}
              onChange={(e) => updateField('cep', formatarCEP(e.target.value))}
              aria-invalid={Boolean(errors.cep)}
              aria-describedby={errors.cep ? 'err-titular-cep' : undefined}
              placeholder="00000-000"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.cep ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.cep && (
              <p id="err-titular-cep" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.cep}
              </p>
            )}
          </div>

          {/* Cidade/Estado */}
          <div>
            <label htmlFor="titular-cidadeEstado" className="block text-sm font-semibold mb-1.5">
              Cidade / Estado *
            </label>
            <input
              id="titular-cidadeEstado"
              type="text"
              value={form.cidadeEstado}
              onChange={(e) => updateField('cidadeEstado', e.target.value)}
              aria-invalid={Boolean(errors.cidadeEstado)}
              aria-describedby={errors.cidadeEstado ? 'err-titular-cidadeEstado' : undefined}
              placeholder="Ex.: Belo Horizonte / MG"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.cidadeEstado ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.cidadeEstado && (
              <p id="err-titular-cidadeEstado" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.cidadeEstado}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="titular-telefone" className="block text-sm font-semibold mb-1.5">
              Telefone *
            </label>
            <input
              id="titular-telefone"
              type="tel"
              value={form.telefone}
              onChange={(e) => updateField('telefone', formatarTelefone(e.target.value))}
              aria-invalid={Boolean(errors.telefone)}
              aria-describedby={errors.telefone ? 'err-titular-telefone' : undefined}
              placeholder="(11) 99999-9999"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm font-mono-num"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.telefone ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.telefone && (
              <p id="err-titular-telefone" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.telefone}
              </p>
            )}
          </div>

          {/* Contato por app */}
          <div>
            <label htmlFor="titular-contatoPorApp" className="block text-sm font-semibold mb-1.5">
              Contato por aplicativo (opcional)
            </label>
            <input
              id="titular-contatoPorApp"
              type="text"
              value={form.contatoPorApp}
              onChange={(e) => updateField('contatoPorApp', e.target.value)}
              placeholder="Ex.: WhatsApp ou Telegram"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* E-mail */}
          <div className="md:col-span-2">
            <label htmlFor="titular-email" className="block text-sm font-semibold mb-1.5">
              E-mail *
            </label>
            <input
              id="titular-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'err-titular-email' : undefined}
              placeholder="nome@exemplo.com"
              className="w-full min-h-[42px] rounded-lg border px-3.5 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.email ? 'var(--status-error-border)' : 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.email && (
              <p id="err-titular-email" className="mt-1 text-xs font-semibold" style={{ color: 'var(--status-error-text)' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Os 3 seletores booleanos da planilha com explicação transparente do impacto */}
          <fieldset
            className="md:col-span-2 rounded-lg border p-4 space-y-4"
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <legend className="px-2 text-sm font-bold">
              Situações específicas da declaração (impactam o simulador e a revisão de malha fina)
            </legend>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="titular-alteracaoEntregaAnterior"
                type="checkbox"
                checked={form.alteracaoEntregaAnterior}
                onChange={(e) => updateField('alteracaoEntregaAnterior', e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-primary)]"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Houve alteração em relação à entrega anterior?
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Ativa lembretes preventivos na revisão de malha fina para conferir endereço, estado civil e recibo anterior.
                </span>
              </span>
            </label>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="titular-existeDependente"
                  type="checkbox"
                  checked={form.existeDependente}
                  onChange={(e) => updateField('existeDependente', e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-primary)]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Existe alguma pessoa dependente?
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Entra diretamente no cálculo da Declaração Completa (dedução anual por dependente e teto de educação).
                  </span>
                </span>
              </label>

              {form.existeDependente && (
                <div className="mt-3 ml-8 max-w-xs">
                  <label
                    htmlFor="titular-quantidadeDependentes"
                    className="block text-sm font-semibold mb-1"
                  >
                    Quantas pessoas dependentes? *
                  </label>
                  <input
                    id="titular-quantidadeDependentes"
                    type="number"
                    min={1}
                    max={20}
                    value={form.quantidadeDependentes}
                    onChange={(e) => updateField('quantidadeDependentes', e.target.value)}
                    aria-invalid={Boolean(errors.quantidadeDependentes)}
                    className="w-32 min-h-[40px] rounded-lg border px-3 py-1.5 text-sm font-mono-num"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: errors.quantidadeDependentes
                        ? 'var(--status-error-border)'
                        : 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {errors.quantidadeDependentes && (
                    <p
                      className="mt-1 text-xs font-semibold"
                      style={{ color: 'var(--status-error-text)' }}
                    >
                      {errors.quantidadeDependentes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="titular-residenteExterior"
                type="checkbox"
                checked={form.residenteExterior}
                onChange={(e) => updateField('residenteExterior', e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-primary)]"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Pessoa residente no exterior?
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Altera o diagnóstico de obrigatoriedade para alertar sobre a Declaração de Saída Definitiva e tributação específica.
                </span>
              </span>
            </label>
          </fieldset>
        </div>

        {/* Dois botões obrigatórios abaixo da tabela: Salvar e Limpar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"
          style={{
            backgroundColor: 'var(--bg-table-head)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Ao confirmar o salvamento, os campos serão limpos automaticamente.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLimpar}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
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
              Salvar Dados da Pessoa Titular
            </button>
          </div>
        </div>
      </form>

      {/* Atalhos inferiores fiéis à planilha atualizada */}
      <section
        aria-label="Atalhos para outras abas da planilha"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <button
          type="button"
          onClick={() => onNavigateTab('entrada')}
          className="flex items-center justify-between rounded-xl border p-4 text-left transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <span className="block text-sm font-bold">Adicionar registro</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Abrir Entrada de Registros (Informes e Comprovantes)
            </span>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('registros')}
          className="flex items-center justify-between rounded-xl border p-4 text-left transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <span className="block text-sm font-bold">Informes de Rendimentos registrados</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Consultar tabela com data automática e links do Drive
            </span>
          </div>
          <FileSpreadsheet className="h-5 w-5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('registros')}
          className="flex items-center justify-between rounded-xl border p-4 text-left transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <span className="block text-sm font-bold">Comprovantes fiscais registrados</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Holerites, recibos de saúde, educação e notas fiscais
            </span>
          </div>
          <FileSpreadsheet className="h-5 w-5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
