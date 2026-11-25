import type {
  ParametrosFiscaisAnuais,
  RegistroComprovanteFiscal,
  RegistroInformeRendimento,
  RegistroPessoaTitular,
  WorkspaceConfig,
} from '../types/ir';
import { RECEITA_FEDERAL_IR_URL } from '../types/ir';

export interface DriveItemSummary {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

async function googleFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Erro HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message || detail;
    } catch {
      // ignora erro de parse
    }
    if (res.status === 401) {
      throw new Error(
        'Sua sessão do Google expirou. Clique em "Entrar com o Google" novamente para continuar.'
      );
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

export async function listUserSpreadsheets(token: string): Promise<DriveItemSummary[]> {
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const data = await googleFetch<{ files?: DriveItemSummary[] }>(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`,
    token
  );
  return data.files || [];
}

export async function listUserFolders(token: string): Promise<DriveItemSummary[]> {
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.folder' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const data = await googleFetch<{ files?: DriveItemSummary[] }>(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`,
    token
  );
  return data.files || [];
}

export async function getSpreadsheetMetadata(token: string, spreadsheetId: string) {
  const fields = encodeURIComponent('spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)');
  return googleFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{ properties: { sheetId: number; title: string } }>;
  }>(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=${fields}`, token);
}

export async function getDriveFileMetadata(token: string, fileId: string): Promise<DriveItemSummary> {
  const fields = encodeURIComponent('id,name,webViewLink,mimeType');
  return googleFetch<DriveItemSummary>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${fields}`,
    token
  );
}

export async function createDriveFolder(
  token: string,
  folderName: string
): Promise<DriveItemSummary> {
  return googleFetch<DriveItemSummary>(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
}

export async function createStructuredSpreadsheet(
  token: string,
  title: string,
  parametros: ParametrosFiscaisAnuais
): Promise<WorkspaceConfig & { spreadsheetId: string; spreadsheetTitle: string; spreadsheetUrl: string }> {
  const abaTitular = 'Dados da Pessoa Titular';
  const abaEntrada = 'Entrada de Registros';
  const abaInformes = 'Informes de Rendimentos registrados';
  const abaComprovantes = 'Comprovantes fiscais registrados';
  const abaParametros = 'Parametros IR';

  const created = await googleFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
  }>('https://sheets.googleapis.com/v4/spreadsheets', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title, locale: 'pt_BR' },
      sheets: [
        { properties: { title: abaTitular } },
        { properties: { title: abaEntrada } },
        { properties: { title: abaInformes } },
        { properties: { title: abaComprovantes } },
        { properties: { title: abaParametros } },
      ],
    }),
  });

  const spreadsheetId = created.spreadsheetId;

  // Popula os cabeçalhos iniciais de todas as abas estruturadas em uma única chamada batchUpdate
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `'${abaTitular}'!A1:P2`,
            values: [
              ['Simulador de IR Acessível — Registros da Pessoa Titular', `Portal IR Receita Federal: ${RECEITA_FEDERAL_IR_URL}`],
              [
                'Data de Inclusão',
                'Nome completo',
                'CPF',
                'Documento Oficial',
                'Data de Nascimento',
                'Estado Civil',
                'Endereço completo',
                'CEP',
                'Cidade/Estado',
                'Telefone',
                'Contato por app',
                'E-mail',
                'Houve alteração da entrega anterior?',
                'Existe algum dependente?',
                'Qtd. Dependentes',
                'Residente no exterior?',
              ],
            ],
          },
          {
            range: `'${abaEntrada}'!A1:B23`,
            values: [
              ['Entrada de Registros — Simulador de IR Acessível', 'Preencha os dados abaixo e use os scripts modulares'],
              ['', ''],
              ['Tabela 1: Informes de Rendimentos', 'Dados de Entrada'],
              ['Banco / Fonte Pagadora', ''],
              ['Tipo de Rendimento', ''],
              ['Periodicidade (Anual ou Mensal)', ''],
              ['Mês de Referência (se Mensal)', ''],
              ['Valor (R$)', ''],
              ['Imposto Retido na Fonte (R$)', ''],
              ['Link do Anexo no Google Drive', ''],
              ['Observação', ''],
              ['', ''],
              ['', ''],
              ['', ''],
              ['Tabela 2: Comprovantes Fiscais', 'Dados de Entrada'],
              ['Categoria', ''],
              ['Descrição / Emitente', ''],
              ['CPF / CNPJ do Emitente', ''],
              ['Data do Documento', ''],
              ['Valor (R$)', ''],
              ['IR Retido na Fonte (se Holerite)', ''],
              ['Link do Anexo no Google Drive', ''],
              ['Observação', ''],
            ],
          },
          {
            range: `'${abaInformes}'!A1:I1`,
            values: [
              [
                'Data de Inclusão',
                'Banco / Fonte Pagadora',
                'Tipo de Rendimento',
                'Periodicidade',
                'Mês de Referência',
                'Valor (R$)',
                'IR Retido na Fonte (R$)',
                'Link do Anexo (Google Drive)',
                'Observação',
              ],
            ],
          },
          {
            range: `'${abaComprovantes}'!A1:I1`,
            values: [
              [
                'Data de Inclusão',
                'Categoria',
                'Descrição / Emitente',
                'CPF / CNPJ do Emitente',
                'Data do Documento',
                'Valor (R$)',
                'IR Retido na Fonte (R$)',
                'Link do Anexo (Google Drive)',
                'Observação',
              ],
            ],
          },
          {
            range: `'${abaParametros}'!A1:C8`,
            values: [
              ['Parâmetro Fiscal', 'Valor Configurado', 'Referência'],
              ['Ano-Calendário', parametros.anoCalendario, RECEITA_FEDERAL_IR_URL],
              ['Limite Obrigatoriedade (Tributáveis)', parametros.limiteObrigatoriedadeTributavel, 'Atualizável anualmente'],
              ['Limite Obrigatoriedade (Isentos/Exclusivos)', parametros.limiteObrigatoriedadeIsento, 'Atualizável anualmente'],
              ['Dedução por Pessoa Dependente', parametros.deducaoPorDependente, 'Por dependente/ano'],
              ['Teto Anual de Educação', parametros.tetoEducacaoAnual, 'Por pessoa/ano'],
              ['Percentual Desconto Simplificado', parametros.percentualDescontoSimplificado, '20%'],
              ['Teto Desconto Simplificado', parametros.tetoDescontoSimplificado, 'Limite anual'],
            ],
          },
        ],
      }),
    }
  );

  return {
    spreadsheetId,
    spreadsheetTitle: created.properties.title,
    spreadsheetUrl: created.spreadsheetUrl,
    driveFolderId: '',
    driveFolderName: '',
    driveFolderUrl: '',
    abaTitular,
    abaEntrada,
    abaInformesRegistrados: abaInformes,
    abaComprovantesRegistrados: abaComprovantes,
    abaParametros,
  };
}

/**
 * Garante que uma planilha existente tenha as abas de destino antes de gravar linhas.
 */
export async function ensureRegistryTabsExist(
  token: string,
  spreadsheetId: string,
  requiredTabs: Array<{ title: string; headers: string[] }>
): Promise<void> {
  const meta = await getSpreadsheetMetadata(token, spreadsheetId);
  const existingTitles = new Set(meta.sheets.map((s) => s.properties.title));

  const missing = requiredTabs.filter((t) => !existingTitles.has(t.title));
  if (missing.length === 0) return;

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: missing.map((tab) => ({
          addSheet: { properties: { title: tab.title } },
        })),
      }),
    }
  );

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: missing.map((tab) => ({
          range: `'${tab.title}'!A1`,
          values: [tab.headers],
        })),
      }),
    }
  );
}

/**
 * Envia o arquivo temporário diretamente para a pasta específica do Google Drive
 * e devolve SOMENTE o link visualizável (webViewLink) + nome do arquivo.
 */
export async function uploadFileToDriveFolder(
  token: string,
  folderId: string,
  file: File
): Promise<{ id: string; name: string; webViewLink: string }> {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    let detail = `Erro ao enviar anexo (HTTP ${res.status})`;
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message || detail;
    } catch {
      // ignora
    }
    throw new Error(detail);
  }

  const data = (await res.json()) as { id: string; name: string; webViewLink?: string };
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

export async function appendTitularRow(
  token: string,
  config: WorkspaceConfig,
  registro: RegistroPessoaTitular
): Promise<void> {
  await ensureRegistryTabsExist(token, config.spreadsheetId, [
    {
      title: config.abaTitular,
      headers: [
        'Data de Inclusão',
        'Nome completo',
        'CPF',
        'Documento Oficial',
        'Data de Nascimento',
        'Estado Civil',
        'Endereço completo',
        'CEP',
        'Cidade/Estado',
        'Telefone',
        'Contato por app',
        'E-mail',
        'Houve alteração da entrega anterior?',
        'Existe algum dependente?',
        'Qtd. Dependentes',
        'Residente no exterior?',
      ],
    },
  ]);

  const range = encodeURIComponent(`'${config.abaTitular}'!A:P`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [
          [
            registro.dataInclusao,
            registro.nomeCompleto,
            registro.cpf,
            registro.documentoOficial,
            registro.dataNascimento,
            registro.estadoCivil,
            registro.enderecoCompleto,
            registro.cep,
            registro.cidadeEstado,
            registro.telefone,
            registro.contatoPorApp,
            registro.email,
            registro.alteracaoEntregaAnterior ? 'Sim' : 'Não',
            registro.existeDependente ? 'Sim' : 'Não',
            registro.existeDependente ? Number(registro.quantidadeDependentes) || 0 : 0,
            registro.residenteExterior ? 'Sim' : 'Não',
          ],
        ],
      }),
    }
  );
}

export async function appendInformeRow(
  token: string,
  config: WorkspaceConfig,
  registro: RegistroInformeRendimento
): Promise<void> {
  await ensureRegistryTabsExist(token, config.spreadsheetId, [
    {
      title: config.abaInformesRegistrados,
      headers: [
        'Data de Inclusão',
        'Banco / Fonte Pagadora',
        'Tipo de Rendimento',
        'Periodicidade',
        'Mês de Referência',
        'Valor (R$)',
        'IR Retido na Fonte (R$)',
        'Link do Anexo (Google Drive)',
        'Observação',
      ],
    },
  ]);

  const range = encodeURIComponent(`'${config.abaInformesRegistrados}'!A:I`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [
          [
            registro.dataInclusao,
            registro.instituicaoBanco,
            registro.tipoRendimento,
            registro.periodicidade,
            registro.periodicidade === 'Mensal' ? registro.mesReferencia : 'Anual',
            registro.valor,
            registro.impostoRetido,
            registro.anexoLinkDrive, // SOMENTE o link do arquivo no Google Drive
            registro.observacao,
          ],
        ],
      }),
    }
  );
}

export async function appendComprovanteRow(
  token: string,
  config: WorkspaceConfig,
  registro: RegistroComprovanteFiscal
): Promise<void> {
  await ensureRegistryTabsExist(token, config.spreadsheetId, [
    {
      title: config.abaComprovantesRegistrados,
      headers: [
        'Data de Inclusão',
        'Categoria',
        'Descrição / Emitente',
        'CPF / CNPJ do Emitente',
        'Data do Documento',
        'Valor (R$)',
        'IR Retido na Fonte (R$)',
        'Link do Anexo (Google Drive)',
        'Observação',
      ],
    },
  ]);

  const range = encodeURIComponent(`'${config.abaComprovantesRegistrados}'!A:I`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [
          [
            registro.dataInclusao,
            registro.categoria,
            registro.descricaoEmitente,
            registro.cpfCnpjEmitente,
            registro.dataDocumento,
            registro.valor,
            registro.impostoRetido,
            registro.anexoLinkDrive, // SOMENTE o link do arquivo no Google Drive
            registro.observacao,
          ],
        ],
      }),
    }
  );
}

function parseSheetNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  const str = String(val ?? '')
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(str);
  return Number.isFinite(num) ? num : 0;
}

export async function readWorkspaceRecords(
  token: string,
  config: WorkspaceConfig
): Promise<{
  titulares: RegistroPessoaTitular[];
  informes: RegistroInformeRendimento[];
  comprovantes: RegistroComprovanteFiscal[];
}> {
  const meta = await getSpreadsheetMetadata(token, config.spreadsheetId);
  const tabSet = new Set(meta.sheets.map((s) => s.properties.title));

  const titulares: RegistroPessoaTitular[] = [];
  const informes: RegistroInformeRendimento[] = [];
  const comprovantes: RegistroComprovanteFiscal[] = [];

  if (tabSet.has(config.abaInformesRegistrados)) {
    const range = encodeURIComponent(`'${config.abaInformesRegistrados}'!A2:I500`);
    const res = await googleFetch<{ values?: string[][] }>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}`,
      token
    );
    (res.values || []).forEach((row, idx) => {
      if (!row[1]) return;
      informes.push({
        id: `sheet-inf-${idx + 2}`,
        dataInclusao: row[0] || '',
        instituicaoBanco: row[1] || '',
        tipoRendimento: (row[2] as RegistroInformeRendimento['tipoRendimento']) || 'Rendimento Bancário / Aplicação (Exclusivo ou Isento)',
        periodicidade: row[3] === 'Mensal' ? 'Mensal' : 'Anual',
        mesReferencia: row[4] || '',
        valor: parseSheetNumber(row[5]),
        impostoRetido: parseSheetNumber(row[6]),
        anexoNome: row[7] ? 'Arquivo no Google Drive' : '',
        anexoLinkDrive: row[7] || '',
        observacao: row[8] || '',
        sincronizadoSheets: true,
        sheetRowNumber: idx + 2,
      });
    });
  }

  if (tabSet.has(config.abaComprovantesRegistrados)) {
    const range = encodeURIComponent(`'${config.abaComprovantesRegistrados}'!A2:I500`);
    const res = await googleFetch<{ values?: string[][] }>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}`,
      token
    );
    (res.values || []).forEach((row, idx) => {
      if (!row[2]) return;
      comprovantes.push({
        id: `sheet-comp-${idx + 2}`,
        dataInclusao: row[0] || '',
        categoria: (row[1] as RegistroComprovanteFiscal['categoria']) || 'Outros Comprovantes / Notas Fiscais',
        descricaoEmitente: row[2] || '',
        cpfCnpjEmitente: row[3] || '',
        dataDocumento: row[4] || '',
        valor: parseSheetNumber(row[5]),
        impostoRetido: parseSheetNumber(row[6]),
        anexoNome: row[7] ? 'Arquivo no Google Drive' : '',
        anexoLinkDrive: row[7] || '',
        observacao: row[8] || '',
        sincronizadoSheets: true,
        sheetRowNumber: idx + 2,
      });
    });
  }

  if (tabSet.has(config.abaTitular)) {
    const range = encodeURIComponent(`'${config.abaTitular}'!A3:P200`);
    const res = await googleFetch<{ values?: string[][] }>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}`,
      token
    );
    (res.values || []).forEach((row, idx) => {
      if (!row[1] || !row[2]) return;
      titulares.push({
        id: `sheet-tit-${idx + 3}`,
        dataInclusao: row[0] || '',
        nomeCompleto: row[1] || '',
        cpf: row[2] || '',
        documentoOficial: row[3] || '',
        dataNascimento: row[4] || '',
        estadoCivil: (row[5] as RegistroPessoaTitular['estadoCivil']) || '',
        enderecoCompleto: row[6] || '',
        cep: row[7] || '',
        cidadeEstado: row[8] || '',
        telefone: row[9] || '',
        contatoPorApp: row[10] || '',
        email: row[11] || '',
        alteracaoEntregaAnterior: String(row[12]).toLowerCase() === 'sim',
        existeDependente: String(row[13]).toLowerCase() === 'sim',
        quantidadeDependentes: row[14] || '0',
        residenteExterior: String(row[15]).toLowerCase() === 'sim',
        sincronizadoSheets: true,
        sheetRowNumber: idx + 3,
      });
    });
  }

  return { titulares, informes, comprovantes };
}
