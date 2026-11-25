import { useMemo, useState } from 'react';
import {
  ExternalLink,
  FilePlus2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  ConfirmModalConfig,
  RegistroComprovanteFiscal,
  RegistroInformeRendimento,
  RegistroPessoaTitular,
  TabId,
  WorkspaceConfig,
} from '../types/ir';
import { formatarMoedaBRL } from '../utils/validators';

type SubTabRegistro = 'informes' | 'comprovantes' | 'titulares';

interface TabelasRegistroTabProps {
  titulares: RegistroPessoaTitular[];
  informes: RegistroInformeRendimento[];
  comprovantes: RegistroComprovanteFiscal[];
  isGoogleConnected: boolean;
  workspaceConfig: WorkspaceConfig;
  isSyncing: boolean;
  onSyncFromSheets: () => Promise<void>;
  onDeleteInforme: (id: string) => void;
  onDeleteComprovante: (id: string) => void;
  onDeleteTitular: (id: string) => void;
  onRequestConfirm: (cfg: ConfirmModalConfig) => void;
  onNavigateTab: (tab: TabId) => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
}

export function TabelasRegistroTab({
  titulares,
  informes,
  comprovantes,
  isGoogleConnected,
  workspaceConfig,
  isSyncing,
  onSyncFromSheets,
  onDeleteInforme,
  onDeleteComprovante,
  onDeleteTitular,
  onRequestConfirm,
  onNavigateTab,
  onAnnounce,
}: TabelasRegistroTabProps) {
  const [subTab, setSubTab] = useState<SubTabRegistro>('informes');
  const [search, setSearch] = useState('');

  const termo = search.trim().toLowerCase();

  const informesFiltrados = useMemo(() => {
    if (!termo) return informes;
    return informes.filter(
      (i) =>
        i.instituicaoBanco.toLowerCase().includes(termo) ||
        i.tipoRendimento.toLowerCase().includes(termo) ||
        i.observacao.toLowerCase().includes(termo) ||
        i.mesReferencia.toLowerCase().includes(termo)
    );
  }, [informes, termo]);

  const comprovantesFiltrados = useMemo(() => {
    if (!termo) return comprovantes;
    return comprovantes.filter(
      (c) =>
        c.categoria.toLowerCase().includes(termo) ||
        c.descricaoEmitente.toLowerCase().includes(termo) ||
        c.cpfCnpjEmitente.toLowerCase().includes(termo) ||
        c.observacao.toLowerCase().includes(termo)
    );
  }, [comprovantes, termo]);

  const titularesFiltrados = useMemo(() => {
    if (!termo) return titulares;
    return titulares.filter(
      (t) =>
        t.nomeCompleto.toLowerCase().includes(termo) ||
        t.cpf.toLowerCase().includes(termo) ||
        t.cidadeEstado.toLowerCase().includes(termo)
    );
  }, [titulares, termo]);

  const totalInformes = useMemo(
    () => informesFiltrados.reduce((acc, i) => acc + i.valor, 0),
    [informesFiltrados]
  );

  const totalComprovantes = useMemo(
    () => comprovantesFiltrados.reduce((acc, c) => acc + c.valor, 0),
    [comprovantesFiltrados]
  );

  const confirmarExclusao = (
    tipoLabel: string,
    resumo: string,
    onConfirmar: () => void
  ) => {
    onRequestConfirm({
      title: `Remover registro de ${tipoLabel}?`,
      description:
        'Esta ação removerá o item da tabela de registros no aplicativo. Caso já tenha sido salvo no Google Sheets ou Google Drive, os arquivos originais na sua conta permanecem preservados até que você os remova lá.',
      details: [resumo],
      confirmLabel: 'Confirmar remoção',
      variant: 'danger',
      onConfirm: () => {
        onConfirmar();
        onAnnounce(`Registro de ${tipoLabel} removido da tabela.`, false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tabelas de Registro</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Consulte todos os registros gravados com data de inclusão fixa e apenas o link clicável para o arquivo no Google Drive.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {isGoogleConnected && workspaceConfig.spreadsheetId && (
              <button
                type="button"
                onClick={onSyncFromSheets}
                disabled={isSyncing}
                className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Sincronizar com Google Sheets
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('entrada')}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
              }}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Adicionar novo registro
            </button>
          </div>
        </div>

        {/* Sub-abas acessíveis + Busca */}
        <div className="mt-5 flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div
            role="tablist"
            aria-label="Selecionar tabela de registro"
            className="flex flex-wrap items-center gap-1.5 rounded-lg p-1"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'informes'}
              onClick={() => setSubTab('informes')}
              className="min-h-[38px] rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap"
              style={
                subTab === 'informes'
                  ? {
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              Informes de Rendimentos ({informes.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'comprovantes'}
              onClick={() => setSubTab('comprovantes')}
              className="min-h-[38px] rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap"
              style={
                subTab === 'comprovantes'
                  ? {
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              Comprovantes Fiscais ({comprovantes.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'titulares'}
              onClick={() => setSubTab('titulares')}
              className="min-h-[38px] rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap"
              style={
                subTab === 'titulares'
                  ? {
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              Dados da Pessoa Titular ({titulares.length})
            </button>
          </div>

          <div className="relative w-full lg:w-80">
            <label htmlFor="busca-registros" className="sr-only">
              Filtrar registros desta tabela
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              id="busca-registros"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por banco, categoria ou nome..."
              className="w-full min-h-[40px] rounded-lg border pl-9 pr-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabela 1: Informes de Rendimentos registrados */}
      {subTab === 'informes' && (
        <section
          aria-label="Tabela de Informes de Rendimentos registrados"
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5"
            style={{
              backgroundColor: 'var(--bg-table-head)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold">Informes de Rendimentos registrados</h2>
            <p className="text-sm font-semibold">
              <span style={{ color: 'var(--text-muted)' }}>Soma exibida: </span>
              <span className="font-mono-num">{formatarMoedaBRL(totalInformes)}</span>
            </p>
          </div>

          {informesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold">
                Nenhum Informe de Rendimentos registrado até o momento.
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Preencha a tabela de Informes na aba Entrada de Registros para que apareçam aqui com o link do Google Drive.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('entrada')}
                className="mt-4 min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                }}
              >
                Ir para Entrada de Registros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Lista de Informes de Rendimentos registrados com data automática e link para o arquivo no Google Drive
                </caption>
                <thead>
                  <tr
                    className="border-b text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Data de Inclusão</th>
                    <th scope="col" className="px-4 py-3">Banco / Fonte</th>
                    <th scope="col" className="px-4 py-3">Tipo e Periodicidade</th>
                    <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Valor</th>
                    <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">IR Retido</th>
                    <th scope="col" className="px-4 py-3">Anexo (somente link)</th>
                    <th scope="col" className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {informesFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="px-4 py-3 font-mono-num text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {item.dataInclusao}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{item.instituicaoBanco}</div>
                        {item.observacao && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {item.observacao}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.tipoRendimento}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.periodicidade === 'Mensal'
                            ? `Mensal · ${item.mesReferencia}`
                            : 'Anual'}
                          {item.sincronizadoSheets ? ' · Sincronizado no Sheets' : ' · Local'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold whitespace-nowrap">
                        {formatarMoedaBRL(item.valor)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {formatarMoedaBRL(item.impostoRetido)}
                      </td>
                      <td className="px-4 py-3">
                        {item.anexoLinkDrive && item.anexoLinkDrive.startsWith('https://') ? (
                          <a
                            href={item.anexoLinkDrive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold underline break-all"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            Abrir anexo no Drive
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.anexoLinkDrive || 'Aguardando envio ao Google Drive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            confirmarExclusao(
                              'Informe de Rendimentos',
                              `${item.instituicaoBanco} — ${formatarMoedaBRL(item.valor)}`,
                              () => onDeleteInforme(item.id)
                            )
                          }
                          aria-label={`Remover informe de ${item.instituicaoBanco}`}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                          style={{
                            borderColor: 'var(--border-strong)',
                            color: 'var(--status-error-text)',
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tabela 2: Comprovantes fiscais registrados */}
      {subTab === 'comprovantes' && (
        <section
          aria-label="Tabela de Comprovantes fiscais registrados"
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5"
            style={{
              backgroundColor: 'var(--bg-table-head)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold">Comprovantes fiscais registrados</h2>
            <p className="text-sm font-semibold">
              <span style={{ color: 'var(--text-muted)' }}>Soma exibida: </span>
              <span className="font-mono-num">{formatarMoedaBRL(totalComprovantes)}</span>
            </p>
          </div>

          {comprovantesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold">
                Nenhum Comprovante Fiscal registrado até o momento.
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cadastre holerites mensais, recibos de saúde, educação ou notas fiscais na aba Entrada de Registros.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('entrada')}
                className="mt-4 min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                }}
              >
                Ir para Entrada de Registros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Lista de Comprovantes fiscais registrados com data automática e link para o arquivo no Google Drive
                </caption>
                <thead>
                  <tr
                    className="border-b text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Data de Inclusão</th>
                    <th scope="col" className="px-4 py-3">Categoria</th>
                    <th scope="col" className="px-4 py-3">Descrição / Emitente</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Data Doc.</th>
                    <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Valor</th>
                    <th scope="col" className="px-4 py-3">Anexo (somente link)</th>
                    <th scope="col" className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comprovantesFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="px-4 py-3 font-mono-num text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {item.dataInclusao}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{item.categoria}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.sincronizadoSheets ? 'Sincronizado no Sheets' : 'Local'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.descricaoEmitente}</div>
                        {item.cpfCnpjEmitente && (
                          <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
                            Doc.: {item.cpfCnpjEmitente}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono-num text-xs whitespace-nowrap">
                        {item.dataDocumento}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold whitespace-nowrap">
                        {formatarMoedaBRL(item.valor)}
                        {item.impostoRetido > 0 && (
                          <div className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                            IRRF: {formatarMoedaBRL(item.impostoRetido)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.anexoLinkDrive && item.anexoLinkDrive.startsWith('https://') ? (
                          <a
                            href={item.anexoLinkDrive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold underline"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            Abrir anexo no Drive
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.anexoLinkDrive || 'Aguardando envio ao Google Drive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            confirmarExclusao(
                              'Comprovante Fiscal',
                              `${item.categoria} — ${item.descricaoEmitente} (${formatarMoedaBRL(item.valor)})`,
                              () => onDeleteComprovante(item.id)
                            )
                          }
                          aria-label={`Remover comprovante ${item.descricaoEmitente}`}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                          style={{
                            borderColor: 'var(--border-strong)',
                            color: 'var(--status-error-text)',
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tabela 3: Registros da Pessoa Titular */}
      {subTab === 'titulares' && (
        <section
          aria-label="Tabela de Registros da Pessoa Titular"
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="border-b px-5 py-3.5"
            style={{
              backgroundColor: 'var(--bg-table-head)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold">Registros da Pessoa Titular</h2>
          </div>

          {titularesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold">
                Nenhum registro da Pessoa Titular salvo ainda.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('titular')}
                className="mt-4 min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                }}
              >
                Preencher Dados da Pessoa Titular
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Histórico de cadastros da Pessoa Titular salvos com data automática
                </caption>
                <thead>
                  <tr
                    className="border-b text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Data de Inclusão</th>
                    <th scope="col" className="px-4 py-3">Nome completo e CPF</th>
                    <th scope="col" className="px-4 py-3">Contato e Cidade</th>
                    <th scope="col" className="px-4 py-3">Condições da Declaração</th>
                    <th scope="col" className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {titularesFiltrados.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="px-4 py-3 font-mono-num text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {t.dataInclusao}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{t.nomeCompleto}</div>
                        <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
                          CPF: {t.cpf} · Doc.: {t.documentoOficial}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{t.email}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {t.cidadeEstado} · {t.telefone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <div>Alteração anterior: <strong>{t.alteracaoEntregaAnterior ? 'Sim' : 'Não'}</strong></div>
                        <div>
                          Dependentes:{' '}
                          <strong>
                            {t.existeDependente ? `Sim (${t.quantidadeDependentes})` : 'Não'}
                          </strong>
                        </div>
                        <div>Residente no exterior: <strong>{t.residenteExterior ? 'Sim' : 'Não'}</strong></div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            confirmarExclusao(
                              'Dados da Pessoa Titular',
                              `${t.nomeCompleto} (CPF ${t.cpf})`,
                              () => onDeleteTitular(t.id)
                            )
                          }
                          aria-label={`Remover cadastro de ${t.nomeCompleto}`}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                          style={{
                            borderColor: 'var(--border-strong)',
                            color: 'var(--status-error-text)',
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
