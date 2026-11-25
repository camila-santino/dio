import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function stripSensitivePII(input: string): string {
  return input
    // CPF formatado ou 11 dígitos seguidos
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF REMOVIDO]')
    // CNPJ formatado ou 14 dígitos seguidos
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[CNPJ REMOVIDO]')
    // E-mail
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[E-MAIL REMOVIDO]')
    // Telefone brasileiro
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}-?\d{4})\b/g, '[TELEFONE REMOVIDO]')
    // CEP
    .replace(/\b\d{5}-\d{3}\b/g, '[CEP REMOVIDO]');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/ai/assist', async (req: Request, res: Response) => {
    try {
      const { question, mode, anonymizedSummary } = req.body ?? {};

      if (typeof question !== 'string' || question.trim().length < 3) {
        res.status(400).json({
          error: 'Escreva uma pergunta com pelo menos 3 caracteres para receber orientação.',
        });
        return;
      }

      if (question.length > 2000) {
        res.status(400).json({
          error: 'A pergunta ultrapassou o limite de 2.000 caracteres. Tente resumi-la.',
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          error:
            'O assistente opcional de linguagem simples não está disponível neste ambiente no momento. Todo o Simulador de IR, a Revisão de Malha Fina e os scripts Apps Script continuam funcionando normalmente sem IA.',
        });
        return;
      }

      const cleanQuestion = stripSensitivePII(question.trim());
      const cleanSummary =
        typeof anonymizedSummary === 'string' && anonymizedSummary.trim()
          ? stripSensitivePII(anonymizedSummary.trim()).slice(0, 1200)
          : '';

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction =
        mode === 'apps-script'
          ? [
              'Você é uma pessoa especialista em Google Apps Script para planilhas de Imposto de Renda no Brasil.',
              'Regras obrigatórias:',
              '1. Use sempre linguagem neutra e inclusiva em português do Brasil (ex.: "pessoa usuária", "pessoa titular", "quem utiliza").',
              '2. Explique com clareza, passo a passo e sem jargões desnecessários.',
              '3. Mantenha funções separadas por responsabilidade (validação, salvamento, upload ao Drive retornando apenas o link, limpeza imediata).',
              '4. Nunca solicite CPF, nome completo, endereço ou dados pessoais reais.',
              '5. Responda de forma objetiva e bem organizada.',
            ].join('\n')
          : [
              'Você é uma pessoa orientadora educativa de Imposto de Renda Pessoa Física (IRPF) no Brasil, focada em acessibilidade e democratização.',
              'Regras obrigatórias:',
              '1. Use sempre linguagem neutra e inclusiva em português do Brasil (ex.: "pessoa usuária", "pessoa contribuinte", "pessoa titular", "pessoa dependente").',
              '2. Explique em linguagem simples e acolhedora, evitando "economês".',
              '3. Nunca peça CPF, RG, endereço, nome completo ou documentos pessoais.',
              '4. Sempre lembre, quando pertinente, de conferir os valores oficiais vigentes no portal Meu Imposto de Renda da Receita Federal.',
              '5. Organize a resposta em tópicos curtos e fáceis de ler inclusive por leitores de tela.',
            ].join('\n');

      const promptParts = [
        `Pergunta da pessoa usuária:\n${cleanQuestion}`,
        cleanSummary
          ? `\nContexto numérico 100% anonimizado (autorizado explicitamente pela pessoa usuária):\n${cleanSummary}`
          : '\nNenhum dado da planilha foi enviado (modo de pergunta genérica).',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptParts,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({
          error: 'Não foi possível gerar uma resposta agora. Tente reformular sua pergunta.',
        });
        return;
      }

      res.json({
        answer,
        piiScrubbed: cleanQuestion !== question.trim(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro interno ao consultar o assistente.';
      console.error('Erro em /api/ai/assist:', message);
      res.status(500).json({
        error:
          'Ocorreu uma falha temporária ao consultar o assistente opcional. Os cálculos e verificações locais continuam ativos.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Simulador de IR Acessível rodando na porta ${PORT}`);
  });
}

startServer();
