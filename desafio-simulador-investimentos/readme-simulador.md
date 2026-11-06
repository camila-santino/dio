
# Desafio de Projeto DIO - Simulador de investimentos em planilha em estilo *app*

```markdown
Badge Status
!Static Badge
Badge Dio
<p align="center">
		<a href="https://dio.me/"><img src="https://img.shields.io/badge/DIO-Course-28DA77?logo=youtube" alt="DIO - course"></a>
		<a href="https://dio.me/"><img src="https://img.shields.io/badge/DIO-Course-28DA77?logo=youtube" alt="DIO - course"></a>
</p>
```

## Sugestões de navegação

### Estrutura de arquivos

```markdown
desafio-simulador-investimentos/
    ├── readme-simulador.md
    ├── recursos
        ├── arquivos
        ├── artefatos
        ├── midia
```

### Navegação guiada

→ Vá direto para o minitutorial.

→ Vá direto para a construção do simulador.

→ Vá direto para a sessão de tecnologias utilizadas.

→ Vá direto para a sessão do simulador.

→ Vá direto para o material de download.

→ Vá direto para os relatórios gerados.

## Visão geral

Projeto desenvolvido como parte do desafio prático do bootcamp Reclame AQUI - Dados e IA na Prática, em parceria com a Digital Innovation One (DIO). Esta ferramenta foi criada do zero no Google Planilhas como uma ferramenta interativa para ajudar no planejamento financeiro, com foco na projeção de patrimônio e dividendos mensais com Fundos Imobiliários (FIIs). A planilha, com usabilidade, estética e navegação semelhantes às de um aplicativo, responde à cinco perguntas de negócio, projeta o patrimônio em cenários de 2 a 30 anos e divide o aporte entre seis tipos de FIIs, conforme o perfil de investidor escolhido numa lista.

Segundo o instrutor Felipe Aguiar, o que separa o uso comum de planilhas de sua aplicação como ferramenta de soluções dinâmicas é a capacidade de estruturar dados de forma estratégica. Em vez de utilizar o Excel apenas como um bloco de notas digital com linhas e colunas desconectadas, a proposta serviu para ensinar a arquitetura matemática e a modelagem lógica por trás de cada fórmula. 

### Tabela 1 - Planilha comum vs Simulador

| 📊 Planilha Comum (Tradicional) | 📱 Simulador Tipo App (Profissional) |
| --- | --- |
| **Estrutura Poluída:** Células e fórmulas expostas sem hierarquia visual clara, misturando dados e resultados. | **Interface Limpa:** Sem linhas de grade, com banner superior estilizado e blocos delimitados de leitura. |
| **Visual Genérico:** Grade de linhas padrão visível, causando poluição visual e dificultando a leitura. | **Campos Destacados:** Separação clara entre entradas (campos dimensionais) e resultados (campos fato). |
| **Vulnerabilidade:** Risco constante de exclusão acidental de fórmulas por falta de sinalização visual. | **Interatividade UI/UX:** Uso de menus suspensos (Validação de Dados) para seleção dinâmica de perfis. |
| **Fórmulas Ilegíveis:** Coordenadas numéricas diretas e genéricas (ex: =C5*(1+B12)). | **Fórmulas Semânticas:** Uso de Intervalos Nomeados, facilitando a auditoria e manutenção do modelo. |
| **Sem Foco Gerencial:** Ausência de fluxo de navegação ou orientação para apoio à tomada de decisão. | **Foco em Decisão:** Estrutura totalmente orientada a responder Perguntas de Negócio reais. |

## Criação e desenvolvimento

### Fase 1 - Termos técnico-financeiros

Antes de iniciar a construção da ferramenta, para que a planilha fosse utilizada por qualquer pessoa, foi preciso pesquisar e estudar alguns termos que seriam utilizados. Com o auxílio do Notebook Gemini e do Modo IA, consegui entender os conceitos atrás de cada palavra utilizada pelo instrutor. Com esta base, foi possível fazer substituições de nomenclatura sem perder o significado, além de ser capaz de saber, entender, escolher e estruturar as fórmulas para os cálculos necessários.  Esses termos e mudanças estão na tabela 2, logo abaixo.

#### Tabela 2 - Conceitos

| Conceito / Função | Definição Simplificada | Substituições |
| --- | --- | --- |
| Alocação | Distribuir o dinheiro entre diferentes tipos de investimentos para diminuir riscos e equilibrar a carteira de investimentos. | Divisão do aporte mensal |
| Aporte | Valor em dinheiro que se adiciona com uma frequência específica (ex. anuais, mensais) aos investimentos para fazer o patrimônio crescer. | dinheiro, investimento, aplicação |
| Capital Inicial | Quantia de dinheiro ou bens utilizada para começar uma empresa ou iniciar um investimento. | valor total de recursos financeiros atuais |
| Carteira de investimentos | Distribuição de aportes por categoria de FII / Divisão do aporte mensal | O conjunto de todos os investimentos que uma pessoa possui (ações, renda fixa, fundos etc.). |
| Juros Compostos | Painel de evolução do investimento / Estimativa de patrimônio total | Efeito em que os juros rendem sobre os próprios juros acumulados, acelerando o crescimento do capital. |
| Taxa Mensal Equivalente | Taxa mensal equivalente / tx_mensal | Taxa proporcional calculada mês a mês que equivale exatamente ao rendimento total esperado no ano. |
| Regra dos 30% | Sugestão de aplicação (30%) / dica_aporte | Estratégia de poupar e aplicar 30% dos seus rendimentos a cada mês para investir. |
| Dividendos | Valor pago em dinheiro proporcional à quantidade de ações possuídas. | dividendos por mês - a planilha manteve o termo apenas contextualizando e associando a rendimentos mensais/renda passiva |
| Fundos de Investimento Imobiliário - FIIs | Investimento com foco no mercado de imóveis (como prédios comerciais e shoppings) que vem dos recebimentos de aluguéis. | FII |
| Patrimônio acumulado | Estimativa de patrimônio total / Patrimônio Acumulado | Soma de todos os seus bens e investimentos menos as dívidas que você possui. |
| Perfil de investidor | Classificação que indica quanto risco você aceita correr ao investir (conservador, moderado ou arrojado). | não substituído. |
| Perfil de risco | O nível de tolerância **emocional e financeira** que uma pessoa tem para lidar com oscilações e possíveis perdas financeiras. | não substituído: contextualizado em chave composta que determina a distribuição de investimentos dentro dos FIIs. |
| Projeção temporal | Tempo que você pretende deixar o dinheiro investido antes de resgatá-lo. | evolução do investimento, Projeções da evolução patrimonial |
| Rentabilidade | Percentual de retorno de um investimento antes de descontar taxas administrativas e impostos. | Qual a taxa anual esperada de rendimento? / Rendimento Bruto Médio Mensal |
| Retorno | O resultado obtido em uma aplicação, indicando se houve lucro ou prejuízo sobre o valor investido. | Taxa anual esperada de rendimento |
| Renda passiva | Qualquer dinheiro que cai na sua conta regularmente sem que você precise trabalhar ativamente todos os dias por ele. Todo dividendo é uma renda passiva, mas nem toda renda passiva é um dividendo. | Dividendos por mês |
| Taxa | conferir Rentabilidade e Retorno. O simulador foco exclusivamente em quanto o dinheiro rende ao longo de um período especificado (taxa de rendimentos/juros) e deixou de fora taxas de custo e índices externos. | aplicada para traduzir os conceitos de Rentabilidade e Retorno. |
| Valor Futuro - VF | Estimativa de quanto um valor investido hoje valerá no futuro com o efeito dos juros. | Estimativa, Estimativa de patrimônio total / Patrimônio Acumulado |

- Apesar de não ser estritamente necessário, foi-me útil saber sobre as categorias que seriam utilizadas no exercício. (?) (não ser se entra mesmo…. Talvez depois como adendo)
    
    Tabela 3 - Categorias de FII
    
    | Categoria de FII | Definição simplificada | Exemplos |
    | --- | --- | --- |
    | **FII de Tijolo** | Fundo imobiliário que compra imóveis físicos para ganhar dinheiro com aluguel e valorização. | "investir em um FII de tijolo me permite receber rendimentos mensais provenientes do aluguel de diversos escritórios e galpões." |
    | **FII de Papel** | Fundo imobiliário que investe em títulos de dívida imobiliária que pagam juros e correção. | "os FIIs de papel costumam acompanhar a inflação ou taxas de juros, distribuindo os rendimentos dessas dívidas imobiliárias." |
    | **FII de Logística** | Fundo imobiliário focado em galpões de armazenagem e centros de distribuição para locação. | "com o crescimento das compras online, os galpões de logística locados para grandes distribuidoras se tornaram muito demandados." |
    | **FII de Shoppings** | Fundo imobiliário dono de shopping centers que distribui aos cotistas os ganhos com locação. | "o fundo imobiliário é proprietário de participações em grandes shoppings e repassa os aluguéis das lojas aos cotistas." |
    | **FOFs** | Fundo imobiliário que investe em cotas de outros fundos imobiliários para diversificar a carteira. | "ao comprar cotas de um FOF, você se expõe a dezenas de fundos imobiliários diferentes administrados por gestores especialistas." |

### Fase 2 - Estrutura geral das tabelas

Com essa base resolvida, o próximo passo foi desenhar como as tabelas funcionariam. Usei a inteligência artificial para adiantar o desenvolvimento no meu próprio ritmo e, junto com o Gemini, montei um plano guia para estruturar a lógica da planilha. Usei essa etapa para organizar o fluxo dos dados, o que acabou gerando um manual prático, um infográfico visual e um mapa mental antes de eu partir para a construção direta.

#### Infográfico com o passo a passo de criação

!Infográfico em português com cinco fases para criar no Excel um simulador profissional de investimentos: mapear dados e resultados, organizar a interface, calcular patrimônio e dividendos, modelar cenários e simular carteiras diversificadas.

Infográfico gerado no Gemini Notebook com base nos materiais encontrados, no manual já criado e nas instruções do desafio.

A escolha de usar o Google Planilhas, em vez do Microsoft Excel, resolveu dois pontos centrais do projeto: o público e a tecnologia. Primeiro pela plataforma ser totalmente gratuita e muito popular, o que torna o acesso muito mais simples para qualquer um. E, ao mesmo tempo, trabalhar direto na nuvem foi fundamental para garantir a agilidade necessária e integrar a estrutura aos recursos de inteligência artificial do Gemini, onde foi estruturado todo o planejamento.

Com o plano de desenvolvimento estabelecido, iniciei a criação das tabelas de dados, que precisavam responder às perguntas e métricas já estabelecidas pelo exercício:

- Tabela de entrada: informações inseridas pela pessoa usuária;
- Tabela de investimento: informações automáticas sobre o investimento, de acordo com os dados da pessoa usuária;
- Tabela de projeção: informações automáticas com períodos específicos;
- Tabela de apoio: informações sobre os fundos de investimentos e suas percentagens (exatamente como descrito no exercício);

#### Tabela de entrada

Nesta tabela ficaram as perguntas de negócio solicitadas, traduzidas e pensadas para serem versões mais acessíveis e democráticas.

| Versão DIO | Versão intermediária | Versão final |
| --- | --- | --- |
| N/A | Qual a soma total dos seus rendimentos mensais? | Qual a soma total dos seus rendimentos mensais? |
| Quanto investir por mês | Qual a quantia que deseja aplicar por mês? | campo excluído. Incluída como sugestão na tabela de investimento. |
| Qual a taxa de rendimento mensal | Qual o valor total de recursos atuais acumulados? | Qual o valor total de seus recursos financeiros atuais? |
| Por quantos anos | Por quanto tempo você pretende investir (anos) ? | Por quantos anos você pretende investir? |
| N/A | Qual o seu perfil de investidor? | retirada da tabela e colocada como campo inicial do simulador. |

#### Tabela de investimento

Com os campos de dados da pessoa usuária criados, foi possível gerar os cálculos do investimento e as respostas para as perguntas de negócio que faltavam. A tabela realiza o processamento dos cálculos matemáticos, automatizando a entrega das respostas de forma direta::

| Versão DIO | Versão final | Fórmula | Motivo do cálculo |
| --- | --- | --- | --- |
| Quanto investir por mês | Sugestão de aplicação (30%) | =salario_mensal*0,3 | Incluído como um campo informativo baseado na regra dos 30% sobre os rendimentos mensais, servindo como um parâmetro visual para a pessoa usuária comparar com o valor que ela realmente pretende aportar. |
| Quanto de patrimônio vai acumular | Estimativa de patrimônio total | =-VF(tx_mensal;prazo_mes_user;dica_aporte;capital_inicial;0) | A função `VF` (Valor Futuro) foi utilizada para projetar o crescimento do que se aplica mensalmente sob o efeito dos juros compostos. |
| Quanto vai receber de dividendos por mês | Dividendos por mês | =valor_total*tx_mensal | Calcula o retorno financeiro com base no patrimônio acumulado multiplicado pela taxa de rendimento estimada. |

Para realizar alguns cálculos, foi necessário converter alguns dos dados para que as fórmulas não causassem erro e ficassem de melhor entendimento à pessoa usuária:

| Dados | Conversão | Fórmula |
| --- | --- | --- |
| Período do investimento em anos | Período no qual se faz aplicações regulares de dinheiro para juntar patrimônio antes de começar a usá-lo. Em fórmulas matemáticas se usa em unidades mensais. | =prazo_ano_user*12 |
| Taxa mensal equivalente | Taxa proporcional calculada mês a mês que equivale exatamente ao rendimento total esperado no ano. Para simplificar e facilitar a leitura, o cálculo original `(1 + taxa_anual)^(1/12) - 1` foi substituído por uma função nomeada personalizada. | =TAXAMENSAL(tx_anual) |

<aside>
<img src="/icons/info-alternate_blue.svg" alt="/icons/info-alternate_blue.svg" width="40px" />

#### Regra dos 30%

Essa regra é uma recomendação comum na prática do planejamento financeiro. Ela orienta a pessoa a destinar 30% dos seus rendimentos mensais para investimentos e construção de patrimônio..

</aside>

#### Tabela de projeção

O exercício também pedia que fossem geradas projeções temporais para o investimento, ou seja, mostrar à pessoa usuária como o dinheiro que ela investiu iria evoluir ao longo do tempo (2, 5, 10, 20 e 30 anos), se as quantias mensais fossem as mesmas e o dinheiro não fosse utilizado. Para isso, foi utilizada a mesma fórmula da tabela anterior, com pequenas modificações:

`=-VF(tx_mensal; ANOS * 12; aporte; capital_inicial; 0)` *(onde ANOS corresponde à linha de cada cenário fixado: 2, 5, 10, 20 ou 30).*

Assim, teríamos vários cenários temporais, permitindo comparar o efeito dos juros compostos a curto, médio e longo prazo.

Na última versão do simulador, foi incluído um campo de entrada na tabela, para que a pessoa usuária pudesse escolher outro período que não estivesse na tabela.

#### Tabela de apoio

Esta tabela funciona como a base da distribuição do investimento da pessoa usuária entre as categorias de FIIs. Para isso, foram utilizados:

- Três perfis básicos de investidor: Conservador, Moderado e Arrojado;
- Seis categorias de FIIs: Logística, Papel, Tijolo, Shoppings, FOFs, Outros (exatamente como descritos no exercício);

Com o cruzamento entre os perfis e as categorias de FIIs, foi criada uma chave-composta que nomeamos no simulador como Perfil de Risco, e à cada chave foi inserida uma percentagem.

| Dados de Apoio | Função no Simulador | Estrutura Técnica |
| --- | --- | --- |
| **Perfis e Fundos** | Mapear a distribuição de 100% dos aportes entre os diferentes tipos de ativos com base na escolha da pessoa usuária. | Organizada em uma matriz de suporte que cruza a escolha da lista de validação com as regras de alocação de cada perfil. |
| **Busca por Chave Composta** | Localizar o percentual exato correspondente ao ativo e ao perfil selecionado de forma automática. | Utiliza a combinação de `PROCV` com uma chave composta para cruzar as variáveis e retornar o valor correto sem falhas. |

### Glossário

A tabela de glossário foi construída na etapa final do projeto e passou por diversas modificações ao longo do desenvolvimento. Com o suporte do Gemini e do Modo IA, pesquisei e refinei os termos técnicos originais para criar substituições claras e acessíveis, garantindo que a planilha possa ser compreendida e utilizada por qualquer pessoa.

| Conceito Original | Nomenclatura Adotada | Significado Prático |
| --- | --- | --- |
| **Aporte Mensal** | *Sugestão de aplicação (30%)* / *Valor a aplicar* | A quantia em dinheiro que a pessoa usuária pretende investir periodicamente na formação de seu patrimônio. |
| **Patrimônio Acumulado** | *Estimativa de patrimônio total* | O valor financeiro total somado e guardado ao longo do tempo, considerando o efeito dos juros compostos. |
| **Rendimento da Carteira** | *Taxa mensal equivalente* | A porcentagem de ganho ou retorno financeiro calculada proporcionalmente mês a mês sobre o valor investido. |

## Tecnologias e Ferramentas Utilizadas

1. **Plataformas de desenvolvimento**
    - Vs Code for Web in app
    - GitHub
2. **Softwares de planilhas**
    - https://excel.cloud.microsoft/
    - https://docs.google.com/spreadsheets/
3. **Editores de texto**
    - https://www.notion.com/pt
    - https://www.samsung.com/br/apps/samsung-notes/
4. **Google IA**
    - https://gemini.google.com/
    - https://notebook.google.com/
    - https://search.google/intl/pt-BR/google-app/desktop/
    - https://support.google.com/mail/answer/13952129#zippy=%2Coutros-requisitos
5. **Acessibilidade**
    - https://chromewebstore.google.com/detail/focusflow-smart-reader-ac/kgifnbinkpgeomapdbmgibiofenahlkk
    - https://www.google.com/accessibility/
    - https://www.microsoft.com/pt-br/accessibility
    - https://support.microsoft.com/pt-br/accessibility/excel/accessibility-tools-for-excel
    - https://workspace.google.com/u/0/marketplace/app/grackle_sheets/974235888140?flow_type=2
    - https://workspace.google.com/u/0/marketplace/app/accessibility_checker_for_docs_slides_an/620872258362?flow_type=3
    - https://hemingwayapp.com/
6. Mídia
    - https://clipchamp.com/pt-br/
    - https://www.movavi.com/pt/#tab1
    - https://apps.microsoft.com/detail/9NHJKCDVBLWD?hl=pt-br&gl=BR&ocid=pdpshare

---

# Simulador de investimentos

---

Uma ferramenta de uso simples e acessível a qualquer pessoa! O simulador ajuda a planejar seu futuro sem complicações: você só precisa colocar o valor dos seus rendimentos e taxas que ele transforma automaticamente em gráficos visuais intuitivos. 

---

## O que você vai encontrar

- Estruturada para responder a cinco perguntas centrais de planejamento financeiro: quanto, por quanto tempo, taxas, e estimativas de rendimento mensal e patrimônio final.
- Foco em Fundos de Investimentos Imobiliários - FIIs.
- Divide automaticamente o investimento em percentagens por classe de FII (Logística, Papel, Tijolo, Shoppings, FOFs e Outros), de acordo com a seleção de perfil de investidor.
- Faz uma sugestão de investimento mensal, conforme a renda inserida.
- Demonstra como o investimento irá evoluir em períodos de 2 a 30 anos.
- Criada com a expectativa de suporte a leitores de tela.

---

## Como usar o simulador

1. **Escolha sua versão:** Vá até a seção "Materiais e Links" e escolha se prefere usar o **Microsoft Excel** ou o **Google Planilhas**.
2. **Baixe ou copie o arquivo:**
    - Se escolheu **Excel**, faça o download do arquivo para o seu computador.
    - Se escolheu **Google Planilhas**, clique em *Arquivo > Fazer uma cópia* para conseguir editar (o link original serve apenas para visualização).
3. **Abra o arquivo** no seu programa de planilhas favorito.
4. **Defina seu estilo:** Na aba `Simulador de Investimentos`, clique na caixinha de opções e escolha o seu perfil de investidor.
5. **Coloque as suas informações:** Preencha os campos da tabela explicando o seu momento atual:
    - **Renda mensal:** Quanto você ganha por mês.
    - **Recurso inicial:** O dinheiro que você já tem guardado hoje para começar.
    - **Prazo desejado:** Por quantos anos você pretende deixar o dinheiro rendendo.
    - **Taxa anual esperada:** O quanto você acha que seu dinheiro vai render por ano (se não souber, pode deixar o valor que já vem sugerido na planilha).
6. **Veja as sugestões automáticas:** Sem que você precise calcular nada, a ferramenta calcula e te mostra quanto investir por mês, como dividir suas escolhas entre os fundos e o valor total que você pode juntar.
7. **Acompanhe o crescimento:** Na aba `Painel de evolução`, você consegue ver **em um gráfico e em uma tabela** como o seu dinheiro vai crescer ao longo do tempo (nos marcos de 2, 5, 10, 20 e 30 anos). Se quiser, você também pode digitar um período anual específico para testar.
8. Se precisar de mais detalhes, só ir ao Tutorial disponibilizado aqui e na planilha.

---

## O Simulador em ação

1. Tirar prints da ferramenta:
    - Faça 1 print com o perfil Conservador selecionado.
    - Faça 1 print alternando para o perfil Moderado ou Arrojado (para demonstrar no portfólio que os valores e o gráfico de pizza mudam dinamicamente).

desafiodio1.mp4

desafiodio2.mp4

!printsumulador.png

*Preenchendo seus dados na aba principal.* 

Simulador de Investimentos - Camila Santino - 2026

Notas

[1] Os gráficos desta planilha estão com seus respectivos textos alternativos em nota.
[2] As células aparentemente vazia, estão com a expressão "n/a" para melhorar a navegação em
leitores de texto.
[3] Fundos de Investimento Imobiliario - abbr FII

[1] Quer fazer outra projeção? Preencha a célula com o tempo que pretende investir e veja a evolução do
seu investimento.

!Aba 2 - Painel de Evolução do Investimento. *Tabela 3 - Projeção temporal ajustada automaticamente com a evolução do seu dinheiro.*

Aba 2 - Painel de Evolução do Investimento. *Tabela 3 - Projeção temporal ajustada automaticamente com a evolução do seu dinheiro.*

!Aba 3 - Perfis de Risco e percentagens. *Tabela 4 - Perfis de Risco cadastrados e suas respectivas porcentagens.*

Aba 3 - Perfis de Risco e percentagens. *Tabela 4 - Perfis de Risco cadastrados e suas respectivas porcentagens.*

!Aba 4 - Glossário. *Tabela 5 - Nomenclatura usada em funções e intervalos nomeados.*

Aba 4 - Glossário. *Tabela 5 - Nomenclatura usada em funções e intervalos nomeados.*

!Gráfico 1 - Gráfico com os dados gerados na tabela 1 - Divisão do Aporte por Categoria de FII, na Aba Simulador de Investimentos.

Gráfico 1 - Gráfico com os dados gerados na tabela 1 - Divisão do Aporte por Categoria de FII, na Aba Simulador de Investimentos.

!Gráfico 2 - Gráfico com os dados gerados na tabela 4 - Projeção temporal do investimento, na Aba Painel de Evolução do Investimento.

Gráfico 2 - Gráfico com os dados gerados na tabela 4 - Projeção temporal do investimento, na Aba Painel de Evolução do Investimento.

## **📚 Materiais e Links**

- Planilha do projeto: <span style=“color:red”>**[Indicação: Adicione aqui o link direto para download do arquivo .xlsx no seu repositório]**</span>
- **Referências em acessibilidade**: https://www.one-tab.com/page/hXlZXtryQpiPS0gNdNUk9A
- ‣

—

<p align=center> Feito com curiosidade, café e poesia por <a href=“https://github.com/camila-santino”>Camila Santino</a> ✨

Obrigada por visitar meu espaço! </p>

Crie uma fórmula que identifique o perfil de risco dentro da aba “Perfis de risco” a partir do que o usuário selecionou em C5 e C9 da aba do painel

<p align=center> Feito com curiosidade, café e poesia por <a href="https://github.com/camila-santino">Camila Santino</a> ✨

```
This README has been optimized for accessibility based on GitHub's blogpost "Tips for Making your GitHub Profile Page Accessible".
```

Obrigada por visitar meu espaço! </p>
