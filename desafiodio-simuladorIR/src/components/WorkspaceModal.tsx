import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FolderPlus,
  Loader2,
  RefreshCw,
  Sheet,
  X,
} from 'lucide-react';
import type { ConfirmModalConfig, ParametrosFiscaisAnuais, WorkspaceConfig } from '../types/ir';
import {
  createDriveFolder,
  createStructuredSpreadsheet,
  getDriveFileMetadata,
  getSpreadsheetMetadata,
  listUserFolders,
  listUserSpreadsheets,
  type DriveItemSummary,
} from '../services/googleWorkspace';
import { extrairIdDeLinkGoogle } from '../utils/validators';

interface WorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  accessToken: string | null;
  config: WorkspaceConfig;
  parametros: ParametrosFiscaisAnuais;
  onSaveConfig: (next: WorkspaceConfig) => void;
  onRequestConfirm: (cfg: ConfirmModalConfig) => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
  onSyncFromSheets: (cfg: WorkspaceConfig) => Promise<void>;
}

export function WorkspaceModal({
  open,
  onClose,
  accessToken,
  config,
  parametros,
  onSaveConfig,
  onRequestConfirm,
  onAnnounce,
  onSyncFromSheets,
}: WorkspaceModalProps) {
  const [spreadsheets, setSpreadsheets] = useState<DriveItemSummary[]>([]);
  const [folders, setFolders] = useState<DriveItemSummary[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [manualSheetInput, setManualSheetInput] = useState(config.spreadsheetId);
  const [manualFolderInput, setManualFolderInput] = useState(config.driveFolderId);
  const [newSheetName, setNewSheetName] = useState('Simulador de IR Acessível — Meus Registros');
  const [newFolderName, setNewFolderName] = useState('Anexos IRPF — Informes e Comprovantes');

  useEffect(() => {
    if (!open) return;
    setManualSheetInput(config.spreadsheetId);
    setManualFolderInput(config.driveFolderId);
    setErrorMsg('');

    if (accessToken) {
      carregarListasDrive(accessToken);
    }
  }, [open, accessToken]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function carregarListasDrive(token: string) {
    setLoadingLists(true);
    setErrorMsg('');
    try {
      const [sheetsList, foldersList] = await Promise.all([
        listUserSpreadsheets(token),
        listUserFolders(token),
      ]);
      setSpreadsheets(sheetsList);
      setFolders(foldersList);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível listar suas planilhas e pastas no Google Drive.'
      );
    } finally {
      setLoadingLists(false);
    }
  }

  if (!open) return null;

  const handleConectarExistentes = async () => {
    if (!accessToken) {
      setErrorMsg('Conecte sua conta Google primeiro para vincular a planilha e a pasta.');
      return;
    }
    const sheetId = extrairIdDeLinkGoogle(manualSheetInput);
    const folderId = extrairIdDeLinkGoogle(manualFolderInput);

    if (!sheetId || !folderId) {
      setErrorMsg('Selecione ou informe tanto a planilha do Google Sheets quanto a pasta de anexos do Google Drive.');
      return;
    }

    setErrorMsg('');
    setLoadingLists(true);
    try {
      const [sheetMeta, folderMeta] = await Promise.all([
        getSpreadsheetMetadata(accessToken, sheetId),
        getDriveFileMetadata(accessToken, folderId),
      ]);

      const nextConfig: WorkspaceConfig = {
        ...config,
        spreadsheetId: sheetMeta.spreadsheetId,
        spreadsheetTitle: sheetMeta.properties.title,
        spreadsheetUrl: sheetMeta.spreadsheetUrl,
        driveFolderId: folderMeta.id,
        driveFolderName: folderMeta.name,
        driveFolderUrl:
          folderMeta.webViewLink || `https://drive.google.com/drive/folders/${folderMeta.id}`,
      };
      onSaveConfig(nextConfig);
      onAnnounce(
        `Planilha "${nextConfig.spreadsheetTitle}" e pasta "${nextConfig.driveFolderName}" conectadas com sucesso.`
      );
      await onSyncFromSheets(nextConfig);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível validar o link ou ID informado. Confira se sua conta tem acesso.'
      );
    } finally {
      setLoadingLists(false);
    }
  };

  const handleCriarNovos = () => {
    if (!accessToken) {
      setErrorMsg('Entre com sua conta Google antes de criar a planilha e a pasta.');
      return;
    }
    const tituloPlanilha = newSheetName.trim() || 'Simulador de IR Acessível';
    const tituloPasta = newFolderName.trim() || 'Anexos IRPF';

    onRequestConfirm({
      title: 'Criar nova planilha e pasta no Google Drive?',
      description:
        'Esta ação criará uma planilha estruturada no Google Sheets (com as abas de entrada, registros e parâmetros) e uma pasta dedicada de anexos na sua conta Google gratuita.',
      details: [
        `Nova planilha: ${tituloPlanilha}`,
        `Nova pasta de anexos: ${tituloPasta}`,
        'Abas criadas: Dados da Pessoa Titular, Entrada de Registros, Informes de Rendimentos registrados, Comprovantes fiscais registrados e Parametros IR.',
      ],
      confirmLabel: 'Confirmar e criar no Drive',
      onConfirm: async () => {
        const [sheetCfg, folderMeta] = await Promise.all([
          createStructuredSpreadsheet(accessToken, tituloPlanilha, parametros),
          createDriveFolder(accessToken, tituloPasta),
        ]);

        const finalCfg: WorkspaceConfig = {
          ...sheetCfg,
          driveFolderId: folderMeta.id,
          driveFolderName: folderMeta.name,
          driveFolderUrl:
            folderMeta.webViewLink || `https://drive.google.com/drive/folders/${folderMeta.id}`,
        };
        onSaveConfig(finalCfg);
        onAnnounce(
          `Planilha "${finalCfg.spreadsheetTitle}" e pasta "${finalCfg.driveFolderName}" criadas no Google Drive.`
        );
        onClose();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
    >
      <div
        className="w-full max-w-2xl rounded-xl border p-6 my-8 shadow-xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 id="workspace-modal-title" className="text-xl font-bold">
              Conectar Google Sheets e Pasta do Google Drive
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Escolha uma planilha e uma pasta já existentes ou crie tudo automaticamente na sua conta Google gratuita.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configuração do Google Workspace"
            className="rounded-lg p-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-lg border p-3.5 text-sm font-medium"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderColor: 'var(--status-error-border)',
              color: 'var(--status-error-text)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {config.spreadsheetId && config.driveFolderId && (
          <div
            className="mt-4 rounded-lg border p-4 text-sm"
            style={{
              backgroundColor: 'var(--status-success-bg)',
              borderColor: 'var(--status-success-border)',
              color: 'var(--status-success-text)',
            }}
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Conexão ativa configurada
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              <a
                href={config.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline font-medium"
              >
                Planilha: {config.spreadsheetTitle}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={config.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline font-medium"
              >
                Pasta de anexos: {config.driveFolderName}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Opção 1: Criar automaticamente */}
          <section aria-labelledby="criar-novos-heading" className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-muted)' }}>
            <div className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <h3 id="criar-novos-heading" className="text-base font-bold">
                Opção 1 — Criar nova planilha estruturada e pasta de anexos
              </h3>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Recomendado para começar do zero: cria automaticamente todas as abas e uma pasta dedicada para guardar seus comprovantes.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="new-sheet-name" className="block text-sm font-semibold mb-1">
                  Nome da nova planilha
                </label>
                <input
                  id="new-sheet-name"
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="new-folder-name" className="block text-sm font-semibold mb-1">
                  Nome da pasta de anexos no Drive
                </label>
                <input
                  id="new-folder-name"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleCriarNovos}
                disabled={!accessToken}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                }}
              >
                <Sheet className="h-4 w-4" aria-hidden="true" />
                Criar Planilha e Pasta Automaticamente
              </button>
            </div>
          </section>

          {/* Opção 2: Conectar existentes */}
          <section aria-labelledby="conectar-existentes-heading" className="rounded-lg border p-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between gap-2">
              <h3 id="conectar-existentes-heading" className="text-base font-bold">
                Opção 2 — Conectar a uma planilha e pasta já existentes
              </h3>
              {accessToken && (
                <button
                  type="button"
                  onClick={() => carregarListasDrive(accessToken)}
                  disabled={loadingLists}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {loadingLists ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Atualizar lista
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="select-existing-sheet" className="block text-sm font-semibold mb-1">
                  Escolha uma planilha do seu Google Drive
                </label>
                <select
                  id="select-existing-sheet"
                  value={spreadsheets.some((s) => s.id === manualSheetInput) ? manualSheetInput : ''}
                  onChange={(e) => {
                    if (e.target.value) setManualSheetInput(e.target.value);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">— Selecione uma planilha recente ou cole o link abaixo —</option>
                  {spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="manual-sheet-id" className="block text-xs font-medium mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
                  Ou cole o link / ID da planilha do Google Sheets
                </label>
                <input
                  id="manual-sheet-id"
                  type="text"
                  value={manualSheetInput}
                  onChange={(e) => setManualSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label htmlFor="select-existing-folder" className="block text-sm font-semibold mb-1">
                  Escolha a pasta específica de anexos no Google Drive
                </label>
                <select
                  id="select-existing-folder"
                  value={folders.some((f) => f.id === manualFolderInput) ? manualFolderInput : ''}
                  onChange={(e) => {
                    if (e.target.value) setManualFolderInput(e.target.value);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">— Selecione uma pasta recente ou cole o link abaixo —</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="manual-folder-id" className="block text-xs font-medium mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
                  Ou cole o link / ID da pasta do Google Drive
                </label>
                <input
                  id="manual-folder-id"
                  type="text"
                  value={manualFolderInput}
                  onChange={(e) => setManualFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono-num"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] rounded-lg border px-4 py-2 text-sm font-semibold"
                  style={{
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleConectarExistentes}
                  disabled={!accessToken || loadingLists}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                  }}
                >
                  {loadingLists && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Conectar Planilha e Pasta
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
