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
//  *       "schedule": "*/5 * * * *"
//  *     }
//  *   ]
//  * }
//  * 
//  * Isso executará o endpoint a cada 5 minutos.
//  * 
//  * - Para executar manualmente:
//  * node scripts/process-quiz-generation-queue.js
//  */

async function main() {
  // Obter a URL base (se executado localmente ou em produção)
  let BASE_URL;
  
  if (process.env.VERCEL_URL) {
    // Garantir que temos o protocolo https para URLs da Vercel
    BASE_URL = process.env.VERCEL_URL.startsWith('http') 
      ? process.env.VERCEL_URL 
      : `https://${process.env.VERCEL_URL}`;
  } else {
    BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  console.log(`Usando base URL: ${BASE_URL}`);
  
  const API_KEY = process.env.QUIZ_GENERATOR_API_KEY || '';
  
  try {
    // Fazer 3 tentativas para processar a fila (processa até 3 quizzes por execução)
    for (let i = 0; i < 3; i++) {
      console.log(`Tentativa ${i+1} de processar a fila...`);
      
      const url = `${BASE_URL}/api/quizzes/process-queue?key=${API_KEY}`;
      console.log(`Chamando endpoint: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'QuizGenerator/1.0'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ao processar fila: ${response.status} ${response.statusText} - ${errorText}`);
          
          // Se for um erro grave (não 404), enviar notificação de erro
          if (response.status !== 404) {
            await sendErrorNotification(BASE_URL, `Erro ao processar fila: ${response.status} ${response.statusText}`);
          }
          
          break;
        }
        
        const result = await response.json();
        console.log('Resultado:', result);
        
        // Se não há mais quizzes para processar, podemos parar
        if (result.message === "Nenhum quiz pendente na fila") {
          console.log('Não há mais quizzes pendentes. Finalizando.');
          break;
        }
        
        // Se processamos um quiz com sucesso, enviar notificação
        if (result.status === "success" && result.data && result.data.quizId) {
          try {
            // Enviar notificação de sucesso
            await sendQuizReadyNotification(BASE_URL, result.data.quizId);
            console.log(`Notificação enviada para o quiz ${result.data.quizId}`);
          } catch (notifError) {
            console.error('Erro ao enviar notificação:', notifError);
          }
        } else if (result.status === "success" && result.message && result.message.includes("Questões geradas com sucesso")) {
          // Retrocompatibilidade com o formato anterior
          const quizId = result.message.split("quiz ")[1];
          if (quizId) {
            try {
              await sendQuizReadyNotification(BASE_URL, quizId);
              console.log(`Notificação enviada para o quiz ${quizId}`);
            } catch (notifError) {
              console.error('Erro ao enviar notificação:', notifError);
            }
          }
        } else if (result.status === "error" && result.data && result.data.quizId) {
          // Enviar notificação de erro na geração
          await sendErrorNotification(BASE_URL, `Falha na geração do quiz: ${result.message}`, result.data.quizId);
        }
      } catch (fetchError) {
        console.error('Erro ao fazer requisição:', fetchError);
        await sendErrorNotification(BASE_URL, `Erro ao processar quiz: ${fetchError.message}`);
        break;
      }
      
      // Pausa de 5 segundos entre cada processamento para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('Processamento da fila concluído.');
  } catch (error) {
    console.error('Erro ao processar fila:', error);
    await sendErrorNotification(BASE_URL, `Erro fatal no processamento: ${error.message}`);
  }
}

// Função para enviar notificação de quiz pronto
async function sendQuizReadyNotification(baseUrl, quizId) {
  const response = await fetch(`${baseUrl}/api/notifications/quiz-ready`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quizId }),
  });
  
  if (!response.ok) {
    console.error(`Erro ao enviar notificação: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

// Função para enviar notificação de erro
async function sendErrorNotification(baseUrl, errorMessage, quizId = null) {
  try {
    const payload = {
      message: errorMessage,
      type: 'error'
    };
    
    if (quizId) {
      payload.quizId = quizId;
    }
    
    const response = await fetch(`${baseUrl}/api/notifications/quiz-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`Erro ao enviar notificação de erro: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Falha ao enviar notificação de erro:', error);
  }
}

// Executar o script
main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
}); 