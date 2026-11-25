export type TabId =
  | 'titular'
  | 'entrada'
  | 'registros'
  | 'simulador'
  | 'scripts'
  | 'tutorial';

export type TemaVisual = 'suave' | 'sepia' | 'alto-contraste';
export type TamanhoTexto = 'padrao' | 'ampliado';

export interface PreferenciasAcessibilidade {
  temaVisual: TemaVisual;
  tamanhoTexto: TamanhoTexto;
  modoSemIA: boolean;
}

export type EstadoCivil =
  | ''
  | 'Solteira / Solteiro'
  | 'Casada / Casado'
  | 'União Estável'
  | 'Divorciada / Divorciado'
  | 'Separada / Separado'
  | 'Viúva / Viúvo';

export interface DadosPessoaTitularForm {
  nomeCompleto: string;
  cpf: string;
  documentoOficial: string;
  dataNascimento: string;
  estadoCivil: EstadoCivil;
  enderecoCompleto: string;
  cep: string;
  cidadeEstado: string;
  telefone: string;
  contatoPorApp: string;
  email: string;
  alteracaoEntregaAnterior: boolean;
  existeDependente: boolean;
  quantidadeDependentes: string;
  residenteExterior: boolean;
}

export interface RegistroPessoaTitular extends DadosPessoaTitularForm {
  id: string;
  dataInclusao: string;
  sincronizadoSheets: boolean;
  sheetRowNumber?: number;
}

export type TipoRendimento =
  | 'Salário / Pró-labore (Tributável)'
  | 'Rendimento Bancário / Aplicação (Exclusivo ou Isento)'
  | 'Aposentadoria / Pensão (Tributável)'
  | 'Aluguel Recebido (Tributável)'
  | 'Trabalho Autônomo / MEI (Tributável)'
  | 'Poupança / LCI / LCA / Dividendos (Isento)'
  | 'Outros Rendimentos Tributáveis';

export type PeriodicidadeRendimento = 'Anual' | 'Mensal';

export interface InformeRendimentoForm {
  instituicaoBanco: string;
  tipoRendimento: TipoRendimento;
  periodicidade: PeriodicidadeRendimento;
  mesReferencia: string;
  valor: string;
  impostoRetido: string;
  observacao: string;
  anexoFile: File | null;
}

export interface RegistroInformeRendimento {
  id: string;
  dataInclusao: string;
  instituicaoBanco: string;
  tipoRendimento: TipoRendimento;
  periodicidade: PeriodicidadeRendimento;
  mesReferencia: string;
  valor: number;
  impostoRetido: number;
  anexoNome: string;
  anexoLinkDrive: string;
  observacao: string;
  sincronizadoSheets: boolean;
  sheetRowNumber?: number;
}

export type CategoriaComprovante =
  | 'Holerite / Contracheque (Salário Mensal)'
  | 'Saúde (Dedutível)'
  | 'Educação (Dedutível)'
  | 'Previdência Privada (PGBL)'
  | 'Pensão Alimentícia Judicial'
  | 'Outros Comprovantes / Notas Fiscais';

export interface ComprovanteFiscalForm {
  categoria: CategoriaComprovante;
  descricaoEmitente: string;
  cpfCnpjEmitente: string;
  dataDocumento: string;
  valor: string;
  impostoRetido: string;
  observacao: string;
  anexoFile: File | null;
}

export interface RegistroComprovanteFiscal {
  id: string;
  dataInclusao: string;
  categoria: CategoriaComprovante;
  descricaoEmitente: string;
  cpfCnpjEmitente: string;
  dataDocumento: string;
  valor: number;
  impostoRetido: number;
  anexoNome: string;
  anexoLinkDrive: string;
  observacao: string;
  sincronizadoSheets: boolean;
  sheetRowNumber?: number;
}

export interface FaixaTabelaIR {
  limiteSuperior: number | null; // null = última faixa (acima de...)
  aliquota: number; // ex: 0.075 para 7,5%
  parcelaDeduzir: number;
}

export interface ParametrosFiscaisAnuais {
  anoCalendario: number;
  limiteObrigatoriedadeTributavel: number;
  limiteObrigatoriedadeIsento: number;
  deducaoPorDependente: number;
  tetoEducacaoAnual: number;
  percentualDescontoSimplificado: number; // ex: 0.20
  tetoDescontoSimplificado: number;
  faixasAnuais: FaixaTabelaIR[];
}

export interface WorkspaceConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  driveFolderId: string;
  driveFolderName: string;
  driveFolderUrl: string;
  abaTitular: string;
  abaEntrada: string;
  abaInformesRegistrados: string;
  abaComprovantesRegistrados: string;
  abaParametros: string;
}

export interface ConfirmModalConfig {
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => Promise<void> | void;
}

export const RECEITA_FEDERAL_IR_URL =
  'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda';
