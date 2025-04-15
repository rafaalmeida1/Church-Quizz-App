#!/usr/bin/env node

// /**
//  * Este script processa a fila de gerações de quizzes pendentes.
//  * Pode ser configurado para rodar como um cron job na Vercel ou em outro serviço.
//  * 
//  * Uso:
//  * - Para configurar como um cron job na Vercel, adicione ao arquivo vercel.json:
//  * 
//  * {
//  *   "crons": [
//  *     {
//  *       "path": "/api/quizzes/process-queue",
//  *       "schedule": "*/15 * * * *"
//  *     }
//  *   ]
//  * }
//  * 
//  * Isso executará o endpoint a cada 15 minutos.
//  * 
//  * - Para executar manualmente:
//  * node scripts/process-quiz-generation-queue.js
//  */

async function main() {
  // Obter a URL base (se executado localmente ou em produção)
  const BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const API_KEY = process.env.QUIZ_GENERATOR_API_KEY || '';
  
  try {
    // Fazer 3 tentativas para processar a fila (processa até 3 quizzes por execução)
    for (let i = 0; i < 3; i++) {
      console.log(`Tentativa ${i+1} de processar a fila...`);
      
      const response = await fetch(`${BASE_URL}/api/quizzes/process-queue?key=${API_KEY}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        console.error(`Erro ao processar fila: ${response.status} ${response.statusText}`);
        break;
      }
      
      const result = await response.json();
      console.log('Resultado:', result);
      
      // Se não há mais quizzes para processar, podemos parar
      if (result.message === "Nenhum quiz pendente na fila") {
        console.log('Não há mais quizzes pendentes. Finalizando.');
        break;
      }
      
      // Pausa de 3 segundos entre cada processamento para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('Processamento da fila concluído.');
  } catch (error) {
    console.error('Erro ao processar fila:', error);
  }
}

// Executar o script
main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
}); 