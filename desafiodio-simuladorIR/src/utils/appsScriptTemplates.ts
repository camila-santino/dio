import type { WorkspaceConfig } from '../types/ir';
import { RECEITA_FEDERAL_IR_URL } from '../types/ir';

export interface ScriptModuleFile {
  id: string;
  filename: string;
  title: string;
  responsibility: string;
  buttonFunction?: string;
  code: string;
}

export function gerarModulosAppsScript(config: WorkspaceConfig): ScriptModuleFile[] {
  const folderId = config.driveFolderId || 'COLE_AQUI_O_ID_DA_PASTA_NO_GOOGLE_DRIVE';
  const abaTitular = config.abaTitular || 'Dados da Pessoa Titular';
  const abaEntrada = config.abaEntrada || 'Entrada de Registros';
  const abaInformes = config.abaInformesRegistrados || 'Informes de Rendimentos registrados';
  const abaComprovantes = config.abaComprovantesRegistrados || 'Comprovantes fiscais registrados';

  return [
    {
      id: 'config-menu',
      filename: 'ConfiguracaoEMenu.gs',
      title: '1. Configuração Geral e Menu da Planilha',
      responsibility:
        'Centraliza os nomes das abas, intervalos das tabelas de entrada, ID da pasta de anexos no Google Drive e cria o menu acessível no Google Sheets.',
      code: `/**
 * ConfiguracaoEMenu.gs
 * Centraliza as configurações da planilha Simulador de IR Acessível.
 * Compatível com qualquer conta pessoal gratuita do Google Sheets e Google Drive.
 */

const CONFIG_IR = {
  // ID da pasta específica no Google Drive onde os anexos serão salvos
  PASTA_ANEXOS_DRIVE_ID: '${folderId}',

  // Nomes exatos das abas da planilha
  ABAS: {
    TITULAR: '${abaTitular}',
    ENTRADA: '${abaEntrada}',
    INFORMES_REGISTRADOS: '${abaInformes}',
    COMPROVANTES_REGISTRADOS: '${abaComprovantes}',
  },

  // Células da tabela "Dados da Pessoa Titular" (coluna B, linhas 5 a 19)
  CELULAS_TITULAR: {
    NOME: 'B5',
    CPF: 'B6',
    DOCUMENTO: 'B7',
    NASCIMENTO: 'B8',
    ESTADO_CIVIL: 'B9',
    ENDERECO: 'B10',
    CEP: 'B11',
    CIDADE_ESTADO: 'B12',
    TELEFONE: 'B13',
    CONTATO_APP: 'B14',
    EMAIL: 'B15',
    ALTERACAO_ANTERIOR: 'B16',
    EXISTE_DEPENDENTE: 'B17',
    QTD_DEPENDENTES: 'B18',
    RESIDENTE_EXTERIOR: 'B19',
  },

  // Células da Tabela 1 na aba "Entrada de Registros": Informes de Rendimentos
  CELULAS_INFORME: {
    INSTITUICAO: 'B4',
    TIPO: 'B5',
    PERIODICIDADE: 'B6',
    MES_REF: 'B7',
    VALOR: 'B8',
    IR_RETIDO: 'B9',
    ANEXO_LINK: 'B10',
    OBSERVACAO: 'B11',
  },

  // Células da Tabela 2 na aba "Entrada de Registros": Comprovantes Fiscais
  CELULAS_COMPROVANTE: {
    CATEGORIA: 'B16',
    DESCRICAO: 'B17',
    CPF_CNPJ: 'B18',
    DATA_DOC: 'B19',
    VALOR: 'B20',
    IR_RETIDO: 'B21',
    ANEXO_LINK: 'B22',
    OBSERVACAO: 'B23',
  },

  URL_RECEITA_FEDERAL: '${RECEITA_FEDERAL_IR_URL}',
};

/**
 * Executado automaticamente ao abrir a planilha.
 * Cria um menu claro para pessoas usuárias operarem sem depender apenas de botões desenhados.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Simulador de IR')
    .addItem('Anexar arquivo ao Google Drive (gerar link)', 'abrirPainelUploadAnexo')
    .addSeparator()
    .addItem('Salvar Dados da Pessoa Titular', 'salvarDadosPessoaTitular')
    .addItem('Limpar Dados da Pessoa Titular', 'limparDadosPessoaTitular')
    .addSeparator()
    .addItem('Salvar Informe de Rendimentos', 'salvarInformeRendimentos')
    .addItem('Limpar Informe de Rendimentos', 'limparInformeRendimentos')
    .addSeparator()
    .addItem('Salvar Comprovante Fiscal', 'salvarComprovanteFiscal')
    .addItem('Limpar Comprovante Fiscal', 'limparComprovanteFiscal')
    .addToUi();
}

/**
 * Carimba data e hora fixas no fuso da planilha (substitui fórmulas voláteis como =HOJE()).
 */
function gerarDataInclusaoFixa() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );
}
`,
    },
    {
      id: 'validacao',
      filename: 'ValidacaoCampos.gs',
      title: '2. Validação de Campos e Alerta de Dados Incompletos',
      responsibility:
        'Valida campos obrigatórios, dígitos do CPF, formato de e-mail, valores numéricos e presença do link do anexo antes de permitir qualquer gravação.',
      code: `/**
 * ValidacaoCampos.gs
 * Funções separadas exclusivamente para validar dados antes de salvar
 * e impedir o envio de registros incompletos.
 */

function exibirAlertaValidacao(titulo, pendencias) {
  const ui = SpreadsheetApp.getUi();
  const mensagem =
    'Não foi possível salvar porque existem dados incompletos ou inválidos:\\n\\n' +
    pendencias.map((item, idx) => (idx + 1) + '. ' + item).join('\\n') +
    '\\n\\nRevise os campos destacados e tente salvar novamente.';
  ui.alert(titulo, mensagem, ui.ButtonSet.OK);
}

function validarCpfDigitos(cpfTexto) {
  const cpf = String(cpfTexto || '').replace(/\\D/g, '');
  if (cpf.length !== 11 || /^(\\d)\\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

function validarCamposTitular(dados) {
  const erros = [];
  if (!dados.nome || String(dados.nome).trim().split(/\\s+/).length < 2) {
    erros.push('Informe o Nome completo (nome e sobrenome).');
  }
  if (!dados.cpf || !validarCpfDigitos(dados.cpf)) {
    erros.push('Informe um CPF válido com 11 dígitos.');
  }
  if (!dados.documento) erros.push('Informe o Documento de Identificação Oficial.');
  if (!dados.nascimento) erros.push('Informe a Data de Nascimento.');
  if (!dados.estadoCivil) erros.push('Informe o Estado Civil.');
  if (!dados.endereco) erros.push('Informe o Endereço completo.');
  if (!dados.cep || String(dados.cep).replace(/\\D/g, '').length !== 8) {
    erros.push('Informe um CEP válido com 8 dígitos.');
  }
  if (!dados.cidadeEstado) erros.push('Informe a Cidade/Estado.');
  if (!dados.telefone) erros.push('Informe o Telefone.');
  if (!dados.email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(dados.email).trim())) {
    erros.push('Informe um endereço de E-mail válido.');
  }
  if (dados.existeDependente === true && (!Number(dados.qtdDependentes) || Number(dados.qtdDependentes) < 1)) {
    erros.push('Como há dependente marcado, informe a quantidade de pessoas dependentes.');
  }
  return erros;
}

function validarCamposInforme(dados) {
  const erros = [];
  if (!dados.instituicao) erros.push('Informe o Banco ou Fonte Pagadora.');
  if (!dados.tipo) erros.push('Selecione o Tipo de Rendimento.');
  if (!dados.periodicidade) erros.push('Informe a Periodicidade (Anual ou Mensal).');
  if (dados.periodicidade === 'Mensal' && !dados.mesRef) {
    erros.push('Informe o Mês de referência para rendimentos mensais.');
  }
  if (!dados.valor || isNaN(Number(dados.valor)) || Number(dados.valor) <= 0) {
    erros.push('Informe um Valor atual/anual válido maior que zero.');
  }
  if (!dados.anexoLink || String(dados.anexoLink).indexOf('https://') !== 0) {
    erros.push('Envie o anexo pelo painel do Google Drive para incluir o link do arquivo.');
  }
  return erros;
}

function validarCamposComprovante(dados) {
  const erros = [];
  if (!dados.categoria) erros.push('Selecione a Categoria do Comprovante Fiscal.');
  if (!dados.descricao) erros.push('Informe a Descrição ou pessoa/empresa emitente.');
  if (
    (dados.categoria === 'Saúde (Dedutível)' || dados.categoria === 'Educação (Dedutível)') &&
    !dados.cpfCnpj
  ) {
    erros.push('Informe o CPF ou CNPJ do emitente para despesas dedutíveis.');
  }
  if (!dados.dataDoc) erros.push('Informe a Data do documento.');
  if (!dados.valor || isNaN(Number(dados.valor)) || Number(dados.valor) <= 0) {
    erros.push('Informe um Valor válido maior que zero.');
  }
  if (!dados.anexoLink || String(dados.anexoLink).indexOf('https://') !== 0) {
    erros.push('Envie o anexo pelo painel do Google Drive para incluir o link do arquivo.');
  }
  return erros;
}
`,
    },
    {
      id: 'upload-drive',
      filename: 'UploadAnexosDrive.gs',
      title: '3. Upload Automático de Anexos no Google Drive (Somente Link)',
      responsibility:
        'Envia o arquivo selecionado para a pasta específica do Google Drive, grava exclusivamente o link na célula de anexo e permite descartar arquivo temporário se a pessoa usuária desistir.',
      buttonFunction: 'abrirPainelUploadAnexo',
      code: `/**
 * UploadAnexosDrive.gs
 * Envia arquivos para a pasta específica no Google Drive e escreve SOMENTE o link na célula.
 */

function abrirPainelUploadAnexo() {
  const html = HtmlService.createHtmlOutputFromFile('UploadSidebar')
    .setTitle('Enviar Anexo para o Google Drive');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Chamada pela barra lateral UploadSidebar.html.
 * Salva o arquivo na pasta configurada e devolve exclusivamente o link (file.getUrl()).
 */
function enviarAnexoParaDrive(destinoTabela, nomeArquivo, mimeType, base64Dados) {
  if (!CONFIG_IR.PASTA_ANEXOS_DRIVE_ID || CONFIG_IR.PASTA_ANEXOS_DRIVE_ID.indexOf('COLE_AQUI') === 0) {
    throw new Error('Configure primeiro o ID da pasta do Google Drive em ConfiguracaoEMenu.gs.');
  }

  const pasta = DriveApp.getFolderById(CONFIG_IR.PASTA_ANEXOS_DRIVE_ID);
  const bytes = Utilities.base64Decode(base64Dados);
  const carimbo = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
  const blob = Utilities.newBlob(bytes, mimeType, carimbo + '_' + nomeArquivo);

  const arquivoCriado = pasta.createFile(blob);
  const linkApenas = arquivoCriado.getUrl();

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaEntrada = planilha.getSheetByName(CONFIG_IR.ABAS.ENTRADA);
  if (!abaEntrada) {
    throw new Error('Aba "' + CONFIG_IR.ABAS.ENTRADA + '" não encontrada.');
  }

  const celulaDestino =
    destinoTabela === 'comprovante'
      ? CONFIG_IR.CELULAS_COMPROVANTE.ANEXO_LINK
      : CONFIG_IR.CELULAS_INFORME.ANEXO_LINK;

  // Insere SOMENTE o link do arquivo na célula de anexo
  abaEntrada.getRange(celulaDestino).setValue(linkApenas);

  return {
    nome: arquivoCriado.getName(),
    link: linkApenas,
    celula: celulaDestino,
  };
}

/**
 * Se a pessoa usuária desistir e limpar o formulário antes de salvar,
 * esta função opcional move o arquivo temporário para a lixeira do Drive.
 */
function descartarAnexoTemporarioDoDrive(urlArquivo) {
  if (!urlArquivo || typeof urlArquivo !== 'string') return false;
  const match = urlArquivo.match(/\\/d\\/([a-zA-Z0-9-_]+)/) || urlArquivo.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) return false;

  try {
    DriveApp.getFileById(match[1]).setTrashed(true);
    return true;
  } catch (e) {
    return false;
  }
}
`,
    },
    {
      id: 'upload-html',
      filename: 'UploadSidebar.html',
      title: '4. Painel Acessível de Envio de Anexo (HTML da Planilha)',
      responsibility:
        'Interface acessível exibida na barra lateral do Google Sheets para selecionar o PDF/imagem do informe ou comprovante e enviá-lo automaticamente ao Google Drive.',
      code: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <base target="_top" />
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: #f3f5f7;
        color: #0f172a;
        padding: 16px;
        line-height: 1.5;
      }
      label { display: block; font-weight: 600; margin-top: 12px; margin-bottom: 4px; }
      select, input[type="file"], button {
        width: 100%;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #94a3b8;
        box-sizing: border-box;
        font-size: 14px;
      }
      button {
        margin-top: 16px;
        background: #0f4c81;
        color: #f8fafc;
        border: none;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      #status { margin-top: 14px; font-size: 13px; padding: 10px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h2>Enviar anexo ao Google Drive</h2>
    <p>O arquivo será salvo na pasta configurada e somente o link será inserido na planilha.</p>

    <label for="destino">Tabela de destino</label>
    <select id="destino">
      <option value="informe">Informes de Rendimentos</option>
      <option value="comprovante">Comprovantes Fiscais</option>
    </select>

    <label for="arquivo">Selecione o arquivo (PDF ou imagem)</label>
    <input id="arquivo" type="file" accept=".pdf,image/*" />

    <button id="btnEnviar" type="button" onclick="enviar()">Enviar e preencher link</button>
    <div id="status" role="status" aria-live="polite"></div>

    <script>
      function enviar() {
        const input = document.getElementById('arquivo');
        const destino = document.getElementById('destino').value;
        const status = document.getElementById('status');
        const btn = document.getElementById('btnEnviar');

        if (!input.files || !input.files[0]) {
          status.textContent = 'Selecione um arquivo antes de enviar.';
          return;
        }

        const file = input.files[0];
        btn.disabled = true;
        status.textContent = 'Enviando arquivo para o Google Drive...';

        const reader = new FileReader();
        reader.onload = function (e) {
          const base64 = e.target.result.split(',')[1];
          google.script.run
            .withSuccessHandler(function (res) {
              btn.disabled = false;
              status.textContent = 'Concluído! Somente o link foi gravado na célula ' + res.celula + '.';
            })
            .withFailureHandler(function (err) {
              btn.disabled = false;
              status.textContent = 'Erro ao enviar: ' + err.message;
            })
            .enviarAnexoParaDrive(destino, file.name, file.type || 'application/octet-stream', base64);
        };
        reader.readAsDataURL(file);
      }
    </script>
  </body>
</html>
`,
    },
    {
      id: 'salvar-titular',
      filename: 'SalvarDadosTitular.gs',
      title: '5. Salvar Dados da Pessoa Titular',
      responsibility:
        'Lê a tabela Dados da Pessoa Titular, executa a validação, confirma a gravação, carimba a data automática fixa na tabela de registro e limpa o formulário imediatamente.',
      buttonFunction: 'salvarDadosPessoaTitular',
      code: `/**
 * SalvarDadosTitular.gs
 * Vinculado ao botão "Salvar" abaixo da tabela Dados da Pessoa Titular.
 */

function salvarDadosPessoaTitular() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaTitular = ss.getSheetByName(CONFIG_IR.ABAS.TITULAR);

  if (!abaTitular) {
    ui.alert('Aba "' + CONFIG_IR.ABAS.TITULAR + '" não encontrada.');
    return;
  }

  const c = CONFIG_IR.CELULAS_TITULAR;
  const dados = {
    nome: abaTitular.getRange(c.NOME).getValue(),
    cpf: abaTitular.getRange(c.CPF).getValue(),
    documento: abaTitular.getRange(c.DOCUMENTO).getValue(),
    nascimento: abaTitular.getRange(c.NASCIMENTO).getDisplayValue(),
    estadoCivil: abaTitular.getRange(c.ESTADO_CIVIL).getValue(),
    endereco: abaTitular.getRange(c.ENDERECO).getValue(),
    cep: abaTitular.getRange(c.CEP).getValue(),
    cidadeEstado: abaTitular.getRange(c.CIDADE_ESTADO).getValue(),
    telefone: abaTitular.getRange(c.TELEFONE).getValue(),
    contatoApp: abaTitular.getRange(c.CONTATO_APP).getValue(),
    email: abaTitular.getRange(c.EMAIL).getValue(),
    alteracaoAnterior: Boolean(abaTitular.getRange(c.ALTERACAO_ANTERIOR).getValue()),
    existeDependente: Boolean(abaTitular.getRange(c.EXISTE_DEPENDENTE).getValue()),
    qtdDependentes: abaTitular.getRange(c.QTD_DEPENDENTES).getValue(),
    residenteExterior: Boolean(abaTitular.getRange(c.RESIDENTE_EXTERIOR).getValue()),
  };

  // 1. Validação contra dados incompletos
  const erros = validarCamposTitular(dados);
  if (erros.length > 0) {
    exibirAlertaValidacao('Dados da Pessoa Titular incompletos', erros);
    return;
  }

  // 2. Confirmação antes de gravar
  const resposta = ui.alert(
    'Confirmar salvamento',
    'Deseja salvar os Dados da Pessoa Titular na tabela de registro e limpar o formulário em seguida?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) return;

  // 3. Garantir aba de histórico/registro da Pessoa Titular
  const nomeAbaDestino = 'Registros - Pessoa Titular';
  let abaDestino = ss.getSheetByName(nomeAbaDestino);
  if (!abaDestino) {
    abaDestino = ss.insertSheet(nomeAbaDestino);
    abaDestino.appendRow([
      'Data de Inclusão', 'Nome completo', 'CPF', 'Documento Oficial',
      'Data de Nascimento', 'Estado Civil', 'Endereço completo', 'CEP',
      'Cidade/Estado', 'Telefone', 'Contato por app', 'E-mail',
      'Alteração entrega anterior?', 'Existe dependente?', 'Qtd. Dependentes',
      'Residente no exterior?'
    ]);
  }

  // 4. Gravar com data/hora automática fixa
  abaDestino.appendRow([
    gerarDataInclusaoFixa(),
    dados.nome,
    dados.cpf,
    dados.documento,
    dados.nascimento,
    dados.estadoCivil,
    dados.endereco,
    dados.cep,
    dados.cidadeEstado,
    dados.telefone,
    dados.contatoApp,
    dados.email,
    dados.alteracaoAnterior ? 'Sim' : 'Não',
    dados.existeDependente ? 'Sim' : 'Não',
    dados.existeDependente ? Number(dados.qtdDependentes) : 0,
    dados.residenteExterior ? 'Sim' : 'Não',
  ]);

  // 5. Limpar imediatamente após a confirmação da operação
  limparDadosPessoaTitular(true);
  ui.alert('Sucesso', 'Dados da Pessoa Titular registrados e formulário limpo com sucesso!', ui.ButtonSet.OK);
}
`,
    },
    {
      id: 'salvar-informes',
      filename: 'SalvarInformesRendimentos.gs',
      title: '6. Salvar Informes de Rendimentos',
      responsibility:
        'Valida os campos da tabela Informes de Rendimentos, confirma a operação, registra na aba "Informes de Rendimentos registrados" com data automática fixa e apenas o link do Drive, e limpa imediatamente.',
      buttonFunction: 'salvarInformeRendimentos',
      code: `/**
 * SalvarInformesRendimentos.gs
 * Vinculado ao botão "Salvar" abaixo da tabela Informes de Rendimentos.
 */

function salvarInformeRendimentos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaEntrada = ss.getSheetByName(CONFIG_IR.ABAS.ENTRADA);
  const abaDestino = ss.getSheetByName(CONFIG_IR.ABAS.INFORMES_REGISTRADOS);

  if (!abaEntrada || !abaDestino) {
    ui.alert('Verifique se as abas "' + CONFIG_IR.ABAS.ENTRADA + '" e "' + CONFIG_IR.ABAS.INFORMES_REGISTRADOS + '" existem.');
    return;
  }

  const c = CONFIG_IR.CELULAS_INFORME;
  const dados = {
    instituicao: abaEntrada.getRange(c.INSTITUICAO).getValue(),
    tipo: abaEntrada.getRange(c.TIPO).getValue(),
    periodicidade: abaEntrada.getRange(c.PERIODICIDADE).getValue(),
    mesRef: abaEntrada.getRange(c.MES_REF).getValue(),
    valor: abaEntrada.getRange(c.VALOR).getValue(),
    irRetido: abaEntrada.getRange(c.IR_RETIDO).getValue() || 0,
    anexoLink: abaEntrada.getRange(c.ANEXO_LINK).getValue(),
    observacao: abaEntrada.getRange(c.OBSERVACAO).getValue(),
  };

  // 1. Validação contra envio incompleto
  const erros = validarCamposInforme(dados);
  if (erros.length > 0) {
    exibirAlertaValidacao('Informe de Rendimentos incompleto', erros);
    return;
  }

  // 2. Confirmação da pessoa usuária
  const confirmacao = ui.alert(
    'Confirmar registro do Informe',
    'Deseja adicionar este Informe de Rendimentos à tabela de registros (com apenas o link do anexo no Drive) e limpar o formulário?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacao !== ui.Button.YES) return;

  // 3. Adiciona à tabela de registro com data automática fixa e SOMENTE o link do Drive
  abaDestino.appendRow([
    gerarDataInclusaoFixa(),
    dados.instituicao,
    dados.tipo,
    dados.periodicidade,
    dados.periodicidade === 'Mensal' ? dados.mesRef : 'Anual',
    Number(dados.valor),
    Number(dados.irRetido),
    String(dados.anexoLink).trim(),
    dados.observacao || '',
  ]);

  // 4. Limpa o formulário imediatamente após confirmação (preservando o arquivo salvo no Drive)
  limparInformeRendimentos(true);
  ui.alert('Sucesso', 'Informe de Rendimentos registrado com o link do Drive e formulário limpo!', ui.ButtonSet.OK);
}
`,
    },
    {
      id: 'salvar-comprovantes',
      filename: 'SalvarComprovantesFiscais.gs',
      title: '7. Salvar Comprovantes Fiscais (Holerites e Notas)',
      responsibility:
        'Valida os campos da tabela Comprovantes Fiscais (Holerites mensais, Saúde, Educação, Previdência e Notas), registra com data fixa e somente o link do Drive e limpa imediatamente.',
      buttonFunction: 'salvarComprovanteFiscal',
      code: `/**
 * SalvarComprovantesFiscais.gs
 * Vinculado ao botão "Salvar" abaixo da tabela Comprovantes Fiscais.
 */

function salvarComprovanteFiscal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaEntrada = ss.getSheetByName(CONFIG_IR.ABAS.ENTRADA);
  const abaDestino = ss.getSheetByName(CONFIG_IR.ABAS.COMPROVANTES_REGISTRADOS);

  if (!abaEntrada || !abaDestino) {
    ui.alert('Verifique se as abas "' + CONFIG_IR.ABAS.ENTRADA + '" e "' + CONFIG_IR.ABAS.COMPROVANTES_REGISTRADOS + '" existem.');
    return;
  }

  const c = CONFIG_IR.CELULAS_COMPROVANTE;
  const dados = {
    categoria: abaEntrada.getRange(c.CATEGORIA).getValue(),
    descricao: abaEntrada.getRange(c.DESCRICAO).getValue(),
    cpfCnpj: abaEntrada.getRange(c.CPF_CNPJ).getValue(),
    dataDoc: abaEntrada.getRange(c.DATA_DOC).getDisplayValue(),
    valor: abaEntrada.getRange(c.VALOR).getValue(),
    irRetido: abaEntrada.getRange(c.IR_RETIDO).getValue() || 0,
    anexoLink: abaEntrada.getRange(c.ANEXO_LINK).getValue(),
    observacao: abaEntrada.getRange(c.OBSERVACAO).getValue(),
  };

  // 1. Validação contra dados incompletos
  const erros = validarCamposComprovante(dados);
  if (erros.length > 0) {
    exibirAlertaValidacao('Comprovante Fiscal incompleto', erros);
    return;
  }

  // 2. Confirmação antes de registrar
  const confirmacao = ui.alert(
    'Confirmar registro do Comprovante',
    'Deseja adicionar este Comprovante Fiscal à tabela de registros (com apenas o link do anexo no Drive) e limpar o formulário?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacao !== ui.Button.YES) return;

  // 3. Adiciona na aba de registro com data automática fixa e SOMENTE o link do Drive
  abaDestino.appendRow([
    gerarDataInclusaoFixa(),
    dados.categoria,
    dados.descricao,
    dados.cpfCnpj || '',
    dados.dataDoc,
    Number(dados.valor),
    Number(dados.irRetido),
    String(dados.anexoLink).trim(),
    dados.observacao || '',
  ]);

  // 4. Limpa imediatamente após confirmação
  limparComprovanteFiscal(true);
  ui.alert('Sucesso', 'Comprovante Fiscal registrado com o link do Drive e formulário limpo!', ui.ButtonSet.OK);
}
`,
    },
    {
      id: 'limpar-formularios',
      filename: 'LimparFormularios.gs',
      title: '8. Limpar Campos (Desistência e Pós-Salvamento)',
      responsibility:
        'Funções independentes vinculáveis aos botões "Limpar" abaixo de cada tabela. Quando acionadas por desistência, confirmam a limpeza e oferecem descartar eventuais anexos temporários do Drive.',
      buttonFunction: 'limparInformeRendimentos / limparComprovanteFiscal / limparDadosPessoaTitular',
      code: `/**
 * LimparFormularios.gs
 * Funções separadas para limpar cada tabela de entrada em caso de desistência
 * ou imediatamente após o salvamento confirmado.
 */

function limparDadosPessoaTitular(silencioso) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaTitular = ss.getSheetByName(CONFIG_IR.ABAS.TITULAR);
  if (!abaTitular) return;

  if (!silencioso) {
    const resp = ui.alert(
      'Limpar Dados da Pessoa Titular',
      'Deseja limpar todos os campos preenchidos desta tabela?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  const c = CONFIG_IR.CELULAS_TITULAR;
  const camposTexto = [
    c.NOME, c.CPF, c.DOCUMENTO, c.NASCIMENTO, c.ESTADO_CIVIL,
    c.ENDERECO, c.CEP, c.CIDADE_ESTADO, c.TELEFONE, c.CONTATO_APP,
    c.EMAIL, c.QTD_DEPENDENTES,
  ];
  camposTexto.forEach((cel) => abaTitular.getRange(cel).clearContent());

  // Restaura caixas de seleção booleanas para FALSE
  abaTitular.getRange(c.ALTERACAO_ANTERIOR).setValue(false);
  abaTitular.getRange(c.EXISTE_DEPENDENTE).setValue(false);
  abaTitular.getRange(c.RESIDENTE_EXTERIOR).setValue(false);
}

function limparInformeRendimentos(silencioso) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaEntrada = ss.getSheetByName(CONFIG_IR.ABAS.ENTRADA);
  if (!abaEntrada) return;

  const c = CONFIG_IR.CELULAS_INFORME;
  const linkAtual = abaEntrada.getRange(c.ANEXO_LINK).getValue();

  if (!silencioso) {
    const resp = ui.alert(
      'Limpar Informe de Rendimentos',
      'Você desistiu de salvar? Os campos preenchidos serão apagados.',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;

    // Se havia um anexo enviado antes da desistência, pergunta se deve enviá-lo à lixeira do Drive
    if (linkAtual && String(linkAtual).indexOf('https://') === 0) {
      const apagarDrive = ui.alert(
        'Remover anexo não salvo do Drive?',
        'Existe um link de anexo preenchido que ainda não foi registrado. Deseja mover esse arquivo para a lixeira do Google Drive para evitar arquivos soltos?',
        ui.ButtonSet.YES_NO
      );
      if (apagarDrive === ui.Button.YES) {
        descartarAnexoTemporarioDoDrive(String(linkAtual));
      }
    }
  }

  Object.values(c).forEach((cel) => abaEntrada.getRange(cel).clearContent());
}

function limparComprovanteFiscal(silencioso) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const abaEntrada = ss.getSheetByName(CONFIG_IR.ABAS.ENTRADA);
  if (!abaEntrada) return;

  const c = CONFIG_IR.CELULAS_COMPROVANTE;
  const linkAtual = abaEntrada.getRange(c.ANEXO_LINK).getValue();

  if (!silencioso) {
    const resp = ui.alert(
      'Limpar Comprovante Fiscal',
      'Você desistiu de salvar? Os campos preenchidos serão apagados.',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;

    if (linkAtual && String(linkAtual).indexOf('https://') === 0) {
      const apagarDrive = ui.alert(
        'Remover anexo não salvo do Drive?',
        'Existe um link de anexo preenchido que ainda não foi registrado. Deseja mover esse arquivo para a lixeira do Google Drive?',
        ui.ButtonSet.YES_NO
      );
      if (apagarDrive === ui.Button.YES) {
        descartarAnexoTemporarioDoDrive(String(linkAtual));
      }
    }
  }

  Object.values(c).forEach((cel) => abaEntrada.getRange(cel).clearContent());
}
`,
    },
  ];
}
