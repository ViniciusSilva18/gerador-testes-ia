'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
app.use(cors()); app.use(express.json({ limit: '50kb' }));
app.use(express.static('public'));

app.post('/api/generate-tests', async (req, res) => {
  const { code, language = 'javascript', framework = 'jest' } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: 'Código é obrigatório.' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configure GEMINI_API_KEY no .env' });
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Gera uma suite de testes unitários completa em ${language} usando ${framework} para o seguinte código.
Inclui: casos de sucesso, casos de erro, edge cases, mocks necessários.
Comenta cada teste em português.
Retorna APENAS o código de testes, sem explicações adicionais.

CÓDIGO A TESTAR:
\`\`\`${language}
${code.slice(0, 4000)}
\`\`\``;
    const result = await model.generateContent(prompt);
    const tests = result.response.text().replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
    res.json({ tests, language, framework, linesGenerated: tests.split('\n').length });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao gerar testes.', details: e.message });
  }
});

app.listen(3000, () => console.log('🧪 Gerador de Testes IA em http://localhost:3000'));
