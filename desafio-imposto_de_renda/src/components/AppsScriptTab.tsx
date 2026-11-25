import { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode2,
  FolderOpen,
} from 'lucide-react';
import type { WorkspaceConfig } from '../types/ir';
import { gerarModulosAppsScript } from '../utils/appsScriptTemplates';

interface AppsScriptTabProps {
  workspaceConfig: WorkspaceConfig;
  onOpenWorkspaceConfig: () => void;
  onAnnounce: (msg: string, assertive?: boolean) => void;
}

export function AppsScriptTab({
  workspaceConfig,
  onOpenWorkspaceConfig,
  onAnnounce,
}: AppsScriptTabProps) {
  const modulos = useMemo(() => gerarModulosAppsScript(workspaceConfig), [workspaceConfig]);
  const [selectedId, setSelectedId] = useState(modulos[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const moduloAtivo = modulos.find((m) => m.id === selectedId) || modulos[0];

  const copiarCodigo = async (id: string, filename: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      onAnnounce(`Código do arquivo ${filename} copiado para a área de transferência.`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      onAnnounce('Não foi possível copiar automaticamente. Selecione o código manualmente.', true);
    }
  };

  const baixarArquivo = (filename: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onAnnounce(`Arquivo ${filename} baixado com sucesso.`);
  };

  const baixarTodosCombinados = () => {
    const pacote = modulos
      .map(
        (m) =>
          `// =========================================================================\n` +
          `// ARQUIVO SEPARADO NO APPS SCRIPT: ${m.filename}\n` +
          `// RESPONSABILIDADE: ${m.responsibility}\n` +
          `// =========================================================================\n\n` +
          m.code
      )
      .join('\n\n');
    baixarArquivo('Pacote_Modular_Apps_Script_IR.txt', pacote);
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
            <h1 className="text-2xl font-bold tracking-tight">
              Google Apps Script Modular (Scripts Separados)
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cada função de automação está organizada em um arquivo separado (<span className="font-mono-num">.gs</span>) para manter sua planilha gratuita do Google Sheets rápida, limpa e fácil de manter.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenWorkspaceConfig}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              {workspaceConfig.driveFolderId
                ? `Pasta vinculada: ${workspaceConfig.driveFolderName}`
                : 'Definir ID da Pasta do Drive'}
            </button>
            <button
              type="button"
              onClick={baixarTodosCombinados}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Baixar todos os módulos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de módulos + Visualizador de código */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        <nav
          aria-label="Arquivos separados do Apps Script"
          className="lg:col-span-4 rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="border-b px-4 py-3 text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-table-head)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            8 Arquivos Modulares ({modulos.length - 1} .gs + 1 .html)
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {modulos.map((mod) => {
              const ativo = mod.id === moduloAtivo.id;
              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(mod.id)}
                    aria-current={ativo ? 'true' : undefined}
                    className="w-full px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: ativo ? 'var(--accent-soft)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="flex items-center gap-2 font-mono-num text-xs font-bold">
                      <FileCode2
                        className="h-4 w-4 shrink-0"
                        style={{ color: 'var(--accent-primary)' }}
                        aria-hidden="true"
                      />
                      {mod.filename}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {mod.title}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section
          aria-labelledby="heading-modulo-ativo"
          className="lg:col-span-8 rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
            style={{
              backgroundColor: 'var(--bg-table-head)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <h2 id="heading-modulo-ativo" className="text-base font-bold font-mono-num flex items-center gap-2">
                <Code2 className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                {moduloAtivo.filename}
              </h2>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {moduloAtivo.responsibility}
              </p>
              {moduloAtivo.buttonFunction && (
                <p className="mt-1.5 text-xs font-semibold">
                  Função para vincular ao botão da planilha:{' '}
                  <code className="font-mono-num underline">{moduloAtivo.buttonFunction}</code>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copiarCodigo(moduloAtivo.id, moduloAtivo.filename, moduloAtivo.code)}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {copiedId === moduloAtivo.id ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copiedId === moduloAtivo.id ? 'Copiado!' : 'Copiar código'}
              </button>
              <button
                type="button"
                onClick={() => baixarArquivo(moduloAtivo.filename, moduloAtivo.code)}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Baixar
              </button>
            </div>
          </div>

          <pre
            tabIndex={0}
            aria-label={`Código fonte do arquivo ${moduloAtivo.filename}`}
            className="overflow-x-auto p-5 text-xs leading-relaxed font-mono-num"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              maxHeight: '540px',
            }}
          >
            <code>{moduloAtivo.code}</code>
          </pre>
        </section>
      </div>

      {/* Passo a passo acessível de instalação na planilha */}
      <section
        aria-labelledby="heading-instalar-scripts"
        className="rounded-xl border p-5 space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <h2 id="heading-instalar-scripts" className="text-lg font-bold">
          Como instalar os scripts separados e vincular aos botões na sua planilha Google Sheets
        </h2>
        <ol className="list-decimal space-y-2.5 pl-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <li>
            Abra sua planilha no Google Sheets e clique no menu superior em{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Extensões &gt; Apps Script</strong>.
          </li>
          <li>
            No editor à esquerda, clique no botão <strong style={{ color: 'var(--text-primary)' }}>+ (Adicionar arquivo)</strong> e crie cada um dos 7 arquivos de Script (<code className="font-mono-num">.gs</code>) e o arquivo HTML (<code className="font-mono-num">UploadSidebar</code>), colando o respectivo código acima.
          </li>
          <li>
            Em <code className="font-mono-num">ConfiguracaoEMenu.gs</code>, confira se <code className="font-mono-num">PASTA_ANEXOS_DRIVE_ID</code> está com o ID da sua pasta de anexos no Google Drive (se você conectou a pasta neste app, o ID já foi preenchido automaticamente!).
          </li>
          <li>
            Volte à aba <strong style={{ color: 'var(--text-primary)' }}>Entrada de Registros</strong> da planilha. Abaixo de cada tabela, insira dois botões via <strong style={{ color: 'var(--text-primary)' }}>Inserir &gt; Desenho</strong> (um para <em>Salvar</em> e outro para <em>Limpar</em>).
          </li>
          <li>
            Clique nos três pontinhos do desenho e escolha <strong style={{ color: 'var(--text-primary)' }}>Transferir script</strong>, informando o nome exato da função:
            <ul className="list-disc pl-6 mt-1.5 space-y-1 font-mono-num text-xs">
              <li>Tabela Dados da Pessoa Titular: <strong>salvarDadosPessoaTitular</strong> e <strong>limparDadosPessoaTitular</strong></li>
              <li>Tabela Informes de Rendimentos: <strong>salvarInformeRendimentos</strong> e <strong>limparInformeRendimentos</strong></li>
              <li>Tabela Comprovantes Fiscais: <strong>salvarComprovanteFiscal</strong> e <strong>limparComprovanteFiscal</strong></li>
              <li>Botão de Enviar Anexo ao Drive: <strong>abrirPainelUploadAnexo</strong></li>
            </ul>
          </li>
          <li>
            Recarregue a planilha: o menu acessível <strong style={{ color: 'var(--text-primary)' }}>Simulador de IR</strong> também aparecerá no topo para quem prefere navegar pelo teclado sem clicar em desenhos!
          </li>
        </ol>
      </section>
    </div>
  );
}
