# Desafio de Projeto — Simulador de Investimentos em FIIs

[![DIO - Simulador Financeiro](https://img.shields.io/badge/DIO-Simulador%20Financeiro-blue)](https://dio.me)
![Feito com Inteligência Artificial](https://img.shields.io/badge/feito_com-Intelig%C3%AAncia%20Artificial-blue?style=plastic)
![Status do projeto: pronto para publicação](https://img.shields.io/badge/Status-v3.1%20%282026%29-brightgreen?style=plastic)

---

## Painel de navegação

### Estrutura do repositório

```text
desafio-simulador-investimentos/
├── readme-simulador.md
└── recursos/
    ├── arquivos/
    │   ├── Do Grão à Xícara de Café.pdf
    │   ├── Simulador de Investimentos V3.1 - Camila Santino - 2026.csv
    │   ├── Simulador de Investimentos V3.1 - Camila Santino - 2026.ods
    │   ├── Simulador de Investimentos V3.1 - Camila Santino - 2026.xlsx
    │   └── Simulador de Investimentos V3.1 - Camila Santino - 2026.zip
    ├── artefatos/
    │   ├── construcao-simulador.md
    │   ├── do-grao-a-xicara-de-cafe.md
    │   └── tutorial-simulador.md
    └── midia/
        ├── metafora.jpg
        ├── printaba12.png
        └── printaba2full.png
```

### Navegação guiada

* [Visão geral e objetivos](#visão-geral)
* [Por dentro da planilha (fórmulas, variáveis, versões e perfis)](#por-dentro-da-planilha)
* [Como usar o simulador (Tutorial completo com telas e vídeos)](recursos/artefatos/tutorial-simulador.md)
* [Guia prático de criação do zero (Construção e acessibilidade)](recursos/artefatos/construcao-simulador.md)
* [Do Grão à Xícara de Café — Entendendo o ETL](recursos/artefatos/do-grao-a-xicara-de-cafe.md)
* [Tecnologias e ferramentas utilizadas](#tecnologias-e-ferramentas-utilizadas)
* [Materiais e links para download](#materiais-e-links)

---

## Visão geral

Este projeto foi desenvolvido para o desafio prático do bootcamp **Reclame AQUI — Dados e IA na Prática**, em parceria com a **Digital Innovation One (DIO)**. O objetivo foi construir do zero uma planilha de simulação de investimentos em **Fundos de Investimento Imobiliário (FIIs)** com visual e navegação próximos aos de um aplicativo, priorizando clareza matemática, acessibilidade digital nativa e linguagem simples.

A ferramenta responde a cinco perguntas centrais de planejamento financeiro, projeta o crescimento do patrimônio e dos dividendos mensais em prazos de 2 a 30 anos (além de um campo para prazo personalizado) e divide o aporte mensal entre seis categorias de FIIs conforme o perfil de investidor selecionado.

### Planilha tradicional vs. Simulador tipo app

| Aspecto | Planilha comum (tradicional) | Simulador tipo app (este projeto) |
| :--- | :--- | :--- |
| **Visual** | Linhas de grade visíveis e blocos misturados, aumentando o ruído visual. | Interface limpa, sem linhas de grade, com leitura linear vertical e alto contraste. |
| **Organização** | Dados de entrada e cálculos misturados sem hierarquia clara. | Separação explícita entre entradas (campos dimensionais) e resultados (campos fato). |
| **Fórmulas** | Coordenadas genéricas difíceis de auditar (ex.: `=C5*(1+B12)`). | Fórmulas semânticas com intervalos nomeados e função nomeada (`TAXAMENSAL` no Google Planilhas). |
| **Segurança** | Alto risco de apagar fórmulas por acidente. | Validação de dados por lista suspensa e proteção das células calculadas. |
| **Acessibilidade** | Células mescladas e dependência exclusiva de cor para sinalização. | Sem células mescladas, tabelas estruturadas, textos alternativos e links de navegação entre abas. |

---

## Por dentro da planilha

O projeto mantém **versões equivalentes da planilha V3.1**, desenvolvidas para respeitar as particularidades de cada plataforma: uma versão nativa no **Google Planilhas** (online), uma versão adaptada no **Microsoft Excel para Web** (`.xlsx`) e uma versão compatível com **LibreOffice Calc** (`.ods`), todas pré-preenchidas com o cenário ilustrativo (`R$ 1.650,00`, `12` anos, `10,00% a.a.`) para evitar gráficos vazios na primeira abertura.

### Equivalência entre Google Planilhas, Excel para Web e LibreOffice Calc (V3.1)

| Aspecto | Google Planilhas (V3.1 online) | Microsoft Excel para Web (`.xlsx` V3.1) | LibreOffice Calc (`.ods` V3.1) |
| :--- | :--- | :--- | :--- |
| **Nome da Aba 2** | `Painel de evolução do investimento` | `Simulador de Rendimento` *(adaptado ao limite de 31 caracteres do Excel)* | `Painel de evolução do investimento` |
| **Taxa mensal (`B21`)** | `=TAXAMENSAL(taxa_anual)` *(Função Nomeada)* | `=SEERRO((1 + taxa_anual)^(1/12) - 1; 0)` *(fórmula composta direta)* | `=SEERRO((1 + taxa_anual)^(1/12) - 1; 0)` *(compatível sem `LAMBDA`)* |
| **Busca `PROCV` (`B3:B8`)** | `=SEERRO(PROCV((perfil_user & "-" & A3); T5_Perfis_de_risco_e_percentagens; 4; FALSO); 0)` | `=SEERRO(PROCV((perfil_user & "-" & A3); 'Perfis e Porcentagens'!$A$2:$D$19; 4; FALSO); 0)` | `=SEERRO(PROCV((perfil_user & "-" & A3); 'Perfis e Porcentagens'!$A$2:$D$19; 4; 0); 0)` |
| **Limitação de interface** | Não permite ocultar títulos de linhas/colunas. | Não permite excluir linhas e colunas sobressalentes (usa `"n/a"` como delimitador). | Protege abas nativamente com células editáveis desbloqueadas (`C1`, `B12:B16`, `A7`). |

### As 5 perguntas de negócio respondidas

| Pergunta de negócio | Onde aparece na planilha |
| :--- | :--- |
| **1. Quanto investir por mês?** | Aba `Simulador de Investimentos`: a pessoa usuária pode informar um valor próprio (`aporte_user`) para as projeções e para a divisão por FIIs (`C3:C8`), ou deixar em branco para usar a sugestão automática de 30% da renda (`sugestao_aporte`). |
| **2. Por quantos anos o capital será aportado?** | Aba `Simulador de Investimentos`: campo de prazo em anos (`prazo_ano_user`), convertido automaticamente em meses (`prazo_mes_user`). |
| **3. Qual a taxa de rendimento esperada?** | Aba `Simulador de Investimentos`: campo de taxa anual (`taxa_anual`), convertido em taxa mensal efetiva composta (`taxa_mensal`). |
| **4. Quanto patrimônio será acumulado?** | Aba `Simulador de Investimentos` (`patrimonio_estimado`) e Aba 2 (`Painel de evolução do investimento` no Google Planilhas / `.ods` e `Simulador de Rendimento` no `.xlsx` — marcos de 2, 5, 10, 20, 30 anos e prazo personalizado). |
| **5. Quanto será gerado em dividendos mensais?** | Aba `Simulador de Investimentos` (`valor_mensal`) e coluna `Rendimento Bruto Médio Mensal` na Aba 2. |

### Estrutura das 4 abas (V3.1)

| Aba | Função | Principais componentes |
| :--- | :--- | :--- |
| **Simulador de Investimentos** | Painel principal | Seletor de perfil, tabela de alocação por FII, campos de entrada, tabela de estimativas e gráfico de pizza. |
| **Painel de evolução do investimento** / **Simulador de Rendimento** | Projeção temporal | Cenários de 2, 5, 10, 20 e 30 anos, linha de simulação personalizada em anos e gráfico de evolução patrimonial. |
| **Perfis e Porcentagens** | Tabela de apoio | Matriz de 18 linhas (3 perfis × 6 categorias de FIIs) com chave composta e soma exata de 100% por perfil. |
| **Glossário** | Dicionário de dados | Mapeamento de intervalos nomeados, fórmulas, formatos numéricos e localização na planilha. |

### Engenharia financeira e fórmulas principais

* **Equivalência de juros compostos (`TAXAMENSAL` no Google Planilhas / fórmula direta no Excel e LibreOffice):** converte a taxa anual em taxa efetiva mensal sem superestimar juros, protegida por `SEERRO`.
  ```excel
  =SEERRO((1 + taxa_anual)^(1/12) - 1; 0)
  ```
  Exemplo: 10% ao ano equivale a aproximadamente **0,7974% ao mês** (exibido como 0,80%).
* **Patrimônio acumulado (`VF` com aporte opcional):** calcula o valor futuro a juros compostos; se o campo manual de aporte (`aporte_user`) estiver vazio, aplica automaticamente 30% da renda mensal (`sugestao_aporte`). O sinal negativo antes de `VF` apenas converte o resultado final para valor positivo, mantendo aporte mensal e capital inicial com o mesmo sinal para que sejam somados corretamente.
  ```excel
  =SEERRO(-VF(taxa_mensal; prazo_mes_user; SE(ÉCÉL.VAZIA(aporte_user); sugestao_aporte; aporte_user); capital_inicial; 0); 0)
  ```
* **Renda passiva mensal estimada (dividendos):** multiplica o patrimônio acumulado pela taxa mensal equivalente.
  ```excel
  =SEERRO(patrimonio_estimado * taxa_mensal; 0)
  ```
  *Premissa didática de modelagem:* essa simplificação assume que **100% da taxa anual informada** é distribuída como dividendos mensais (sem separar ganho de capital na cota de <span lang="en">dividend yield</span>) e integralmente reinvestida até o fim do prazo, sem descontar inflação, vacância ou oscilação de mercado.
* **Alocação por perfil (`PROCV` com chave composta e valor por categoria):** concatena o perfil escolhido (`perfil_user`, apontando para `$C$1`) com o tipo de FII (`Perfil-Tipo_FII`) para buscar o percentual exato na aba `Perfis e Porcentagens`. A tabela de distribuição monetária por FII (`C3:C8`) acompanha dinamicamente o aporte personalizado (`aporte_user`) quando preenchido, ou usa `sugestao_aporte` (30% da renda) quando vazio:
  ```excel
  # Busca percentual (Google Planilhas com tabela estruturada):
  =SEERRO(PROCV((perfil_user & "-" & A3); T5_Perfis_de_risco_e_percentagens; 4; FALSO); 0)

  # Busca percentual (Microsoft Excel para Web .xlsx e LibreOffice .ods):
  =SEERRO(PROCV((perfil_user & "-" & A3); 'Perfis e Porcentagens'!$A$2:$D$19; 4; FALSO); 0)

  # Valor alocado por categoria em C3:C8:
  =SEERRO(SE(ÉCÉL.VAZIA(aporte_user); sugestao_aporte; aporte_user) * B3; 0)
  ```

### Intervalos e funções nomeados principais

| Nome | Tipo | Função |
| :--- | :--- | :--- |
| `perfil_user` | Entrada (lista, `$C$1`) | Seleciona o perfil de investidor (`Conservador`, `Moderado` ou `Arrojado`). |
| `salario_mensal` | Entrada (moeda) | Renda mensal informada pela pessoa usuária (`>= 0`). |
| `capital_inicial` | Entrada (moeda) | Valor já guardado para iniciar a simulação (`>= 0`). |
| `prazo_ano_user` | Entrada (número) | Prazo total de investimento em anos inteiros (`1` a `100`). |
| `taxa_anual` | Entrada (percentual) | Taxa anual esperada de retorno (`0%` a `100%`). |
| `aporte_user` | Entrada (moeda, opcional) | Valor mensal personalizado (`>= 0`) usado nas projeções de patrimônio, dividendos e divisão por FIIs (`C3:C8`). |
| `sugestao_aporte` | Cálculo (moeda) | Sugestão automática de 30% da renda (`=SEERRO(salario_mensal * 0,30; 0)`). |
| `prazo_mes_user` | Cálculo (número) | Conversão do prazo em anos para meses (`=SEERRO(prazo_ano_user * 12; 0)`). |
| `TAXAMENSAL` | Função nomeada *(Google Planilhas)* | Fórmula reutilizável `=(1 + cell)^(1/12) - 1`. |
| `taxa_mensal` | Cálculo (percentual) | Taxa mensal equivalente (`=TAXAMENSAL(taxa_anual)` no Sheets / `=SEERRO((1 + taxa_anual)^(1/12) - 1; 0)` no `.xlsx` e `.ods`). |
| `patrimonio_estimado` | Cálculo (moeda) | Patrimônio total acumulado via função `VF`. |
| `valor_mensal` | Cálculo (moeda) | Estimativa de dividendos mensais (`B22`). |
| `simulador_personalizado` | Entrada (número) | Campo livre em anos inteiros (`1` a `100`) na Aba 2 (`A7`). |

### Percentuais de alocação por perfil de investidor

Os percentuais abaixo são estritamente didáticos e ilustrativos (inspirados no gabarito da aula, sem constituir recomendação de investimento), somando rigorosamente **100%** em cada perfil:

| Categoria de FII | Conservador | Moderado | Arrojado |
| :--- | :---: | :---: | :---: |
| **Logística** | 25% | 20% | 15% |
| **Papel** | 40% | 25% | 10% |
| **Tijolo** | 20% | 25% | 20% |
| **Shoppings** | 10% | 15% | 25% |
| **FOFs** | 5% | 10% | 20% |
| **Outros** | 0% | 5% | 10% |
| **Total** | **100%** | **100%** | **100%** |

### O que evoluiu em relação à versão do Expert

1. **Equivalência real de juros compostos:** substituição da divisão simples (`taxa_anual / 12`) pela conversão composta exata `(1 + taxa)^(1/12) - 1` (encapsulada na função nomeada `TAXAMENSAL` no Google Planilhas e aplicada diretamente no `.xlsx` e `.ods`), com tratamento de erros `SEERRO`.
2. **Aporte mensal flexível em todo o painel:** uso de `SE(ÉCÉL.VAZIA(aporte_user); sugestao_aporte; aporte_user)` tanto no patrimônio/dividendos quanto na tabela de divisão por FIIs (`C3:C8`) e gráfico de pizza.
3. **Prazo personalizado e visualização fiel no painel temporal:** inclusão da linha extra editável (`A7`) na Aba 2 e remoção de linha de tendência estatística (linear ou exponencial <span lang="en">OLS</span>) sobre a curva determinística de `VF` nas versões `.xlsx`, `.ods` e <span lang="en">HTML5</span>, evitando distorções visuais nos marcos intermediários.
4. **Acessibilidade digital nativa (WCAG 2.1 / 2.2):** eliminação de células mescladas, leitura linear vertical, tabelas nativas estruturadas, validações em todos os campos de entrada, textos alternativos nos gráficos, links bidirecionais de navegação no rodapé de cada aba e aba `Glossário` alinhada.
5. **Documentação modular e dados prontos para <span lang="en">ETL</span>:** separação entre vitrine técnica ([readme-simulador.md](readme-simulador.md)), guia de uso ([tutorial-simulador.md](recursos/artefatos/tutorial-simulador.md)), manual didático de construção ([construcao-simulador.md](recursos/artefatos/construcao-simulador.md)), leitura sobre <span lang="en">ETL</span> ([do-grao-a-xicara-de-cafe.md](recursos/artefatos/do-grao-a-xicara-de-cafe.md)), matriz limpa de perfis em `.csv` e versão offline acessível em `.zip` (<span lang="en">HTML5</span>).

> [!NOTE]
> **Demonstração visual e vídeos em funcionamento:**
> Confira as capturas da versão V3.1 com tabela acessível em [O Simulador em ação](recursos/artefatos/tutorial-simulador.md#o-simulador-em-ação) ou assista diretamente às gravações no Google Drive:
> - ▶ [Vídeo 1 — Demonstração na versão Google Planilhas](https://drive.google.com/file/d/1blcwtjo6E72cOQcXb6c4EFewJb1WAgnP/view)
> - ▶ [Vídeo 2 — Demonstração na versão Microsoft Excel](https://drive.google.com/file/d/1F4SCxKiVHnZK2WlhZdFNHrq6glFBDZ6n/view)

---

## Processo criativo e princípios

A construção ocorreu em cinco etapas: planejamento e estruturação, modelagem das planilhas, auditoria e tratamento de acessibilidade, criação dos artefatos de documentação e publicação.

O ecossistema Google Gemini (incluindo NotebookLM e extensões no Workspace) e o Microsoft Copilot (Excel para Web) atuaram como apoio técnico na conferência de fórmulas, auditoria de acessibilidade e revisão textual em linguagem simples. Todo o passo a passo didático de construção está detalhado em [Guia Prático de Criação](recursos/artefatos/construcao-simulador.md), e a analogia introdutória do fluxo de dados em [Do Grão à Xícara de Café](recursos/artefatos/do-grao-a-xicara-de-cafe.md).

### Princípios adotados

* **Transparência:** fórmulas, variáveis e premissas abertas e documentadas.
* **Reprodutibilidade:** qualquer pessoa pode auditar e adaptar os cálculos.
* **Acessibilidade:** estrutura pensada para navegação por teclado e leitores de tela (NVDA, JAWS, TalkBack).
* **Democratização do conhecimento:** explicação de termos financeiros sem depender de jargões técnicos.
* **Autonomia:** uso independente para testar cenários sem suporte especializado.

---

## Tecnologias e ferramentas utilizadas

1. **Desenvolvimento e versionamento:** [Visual Studio Code](https://code.visualstudio.com/), [GitHub Desktop](https://docs.github.com/pt/desktop/overview/about-github-desktop)
2. **Planilhas:** [Google Planilhas](https://docs.google.com/spreadsheets/), [Microsoft Excel para Web](https://excel.cloud.microsoft/)
3. **Organização e escrita:** [Notion](https://www.notion.com/pt), [Google Docs](https://docs.google.com/), [Google Keep](https://keep.google.com/), [Samsung Notes](https://www.samsung.com/br/apps/samsung-notes/)
4. **Inteligência artificial:** [Google Gemini](https://gemini.google.com/), [NotebookLM](https://notebook.google.com/), [Microsoft Copilot](https://copilot.com/pt-br/)
5. **Acessibilidade e legibilidade:** [Grackle Sheets](https://workspace.google.com/u/0/marketplace/app/grackle_sheets/974235888140), [Verificador de Acessibilidade do Excel](https://support.microsoft.com/pt-br/accessibility/excel/accessibility-tools-for-excel), [FocusFlow Smart Reader](https://chromewebstore.google.com/detail/focusflow-smart-reader-ac/kgifnbinkpgeomapdbmgibiofenahlkk), [Hemingway Editor](https://hemingwayapp.com/), diretrizes [Google Acessibilidade](https://www.google.com/accessibility/) e [Microsoft Acessibilidade](https://www.microsoft.com/pt-br/accessibility)
6. **Captura e edição de mídia:** [Microsoft Clipchamp](https://clipchamp.com/pt-br/), [Movavi Video Editor](https://www.movavi.com/pt/), [Apowersoft Gravador de Tela](https://www.apowersoft.com.br/gravador-de-tela-gratis)

---

## Como usar o simulador

O passo a passo completo — incluindo instruções para fazer sua cópia privada, descrição dos perfis de investidor, leitura dos resultados, telas e demonstrações em vídeo — está no tutorial dedicado:

→ **[Acessar Tutorial de Uso e Demonstração Visual](recursos/artefatos/tutorial-simulador.md)**

### Sobre os resultados mostrados

Este simulador tem finalidade estritamente educacional e utiliza parâmetros fixos informados pela pessoa usuária. Os FIIs **não** têm garantia de rentabilidade fixa e o preço das cotas oscila na bolsa. Embora a maioria das corretoras não cobre taxa de corretagem para FIIs, os fundos possuem taxas de administração e gestão já descontadas antes do pagamento dos dividendos. Além disso, os cálculos **não** descontam inflação ou eventuais impostos sobre ganho de capital — e lembre-se de montar uma **reserva de emergência em renda fixa de liquidez diária** antes de alocar na bolsa.

---

## Materiais e links

* **Planilha online e arquivos exportados:**
  * **Google Planilhas (V3.1 — abrir e fazer uma cópia):** [Simulador de Investimentos V3.1 - Camila Santino - 2026](https://docs.google.com/spreadsheets/d/1hxfx57uandBsunFlzJu_pOY_2pP2ur25bw2XiaCZx1Y/edit)
  * **Planilha Microsoft Excel (.xlsx):** [Simulador de Investimentos V3.1 - Camila Santino - 2026.xlsx](recursos/arquivos/Simulador%20de%20Investimentos%20V3.1%20-%20Camila%20Santino%20-%202026.xlsx)
  * **Planilha OpenDocument / LibreOffice (.ods):** [Simulador de Investimentos V3.1 - Camila Santino - 2026.ods](recursos/arquivos/Simulador%20de%20Investimentos%20V3.1%20-%20Camila%20Santino%20-%202026.ods)
  * **Matriz tabular de perfis pronta para <span lang="en">ETL</span> (.csv):** [Simulador de Investimentos V3.1 - Camila Santino - 2026.csv](recursos/arquivos/Simulador%20de%20Investimentos%20V3.1%20-%20Camila%20Santino%20-%202026.csv)
  * **Versão acessível em <span lang="en">HTML5</span> com navegação offline (.zip):** [Simulador de Investimentos V3.1 - Camila Santino - 2026.zip](recursos/arquivos/Simulador%20de%20Investimentos%20V3.1%20-%20Camila%20Santino%20-%202026.zip)
* **Vídeos de demonstração (Google Drive):**
  * [Vídeo 1 — Demonstração na versão Google Planilhas](https://drive.google.com/file/d/1blcwtjo6E72cOQcXb6c4EFewJb1WAgnP/view)
  * [Vídeo 2 — Demonstração na versão Microsoft Excel](https://drive.google.com/file/d/1F4SCxKiVHnZK2WlhZdFNHrq6glFBDZ6n/view)
* **Documentação oficial do repositório:**
  * [Tutorial de uso e demonstração visual](recursos/artefatos/tutorial-simulador.md)
  * [Guia prático de criação do simulador do zero](recursos/artefatos/construcao-simulador.md)
  * [Do Grão à Xícara de Café — Entendendo o processo de ETL (Markdown)](recursos/artefatos/do-grao-a-xicara-de-cafe.md) | [versão em PDF](recursos/arquivos/Do%20Gr%C3%A3o%20%C3%A0%20X%C3%ADcara%20de%20Caf%C3%A9.pdf)
  * [Referências de acessibilidade (coleção OneTab)](https://www.one-tab.com/page/hXlZXtryQpiPS0gNdNUk9A)

---

## Licença e uso

Consulte o arquivo de licença do repositório ([Licença MIT](../LICENSE)) para informações sobre distribuição, reutilização e adaptação. Ao compartilhar a planilha, mantenha esta documentação junto ao arquivo para preservar o contexto, a transparência dos cálculos e os recursos de acessibilidade.

---

Feedbacks e sugestões são bem-vindos pelo e-mail [camila_santino@hotmail.com](mailto:camila_santino@hotmail.com) ou pelo [formulário de feedback](https://app.notion.com/p/feijaodecordacultural/4189357d8b608063b691fb98c95dcc1b?source=copy_link).

Feito por [Camila Santino](https://github.com/camila-santino)  
[![LinkedIn de Camila Santino](https://img.shields.io/badge/LinkedIn-Camila%20Santino-black?style=plastic&labelColor=blue)](https://www.linkedin.com/in/camilasantino) [![Linklist de Camila Santino](https://img.shields.io/badge/Linklist.bio-camila__santino-9cf?style=plastic&logo=linktree)](https://linklist.bio/camila_santino)

> *Este README foi estruturado seguindo boas práticas de acessibilidade do GitHub ([Tips for Making your GitHub Profile Page Accessible](https://github.blog/developer-skills/github/5-tips-for-making-your-github-profile-page-accessible/)).*
