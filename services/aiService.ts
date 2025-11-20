
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, AIResponse, Category, Appointment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// Schema definition for the AI response
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      enum: ["add", "query", "filter", "clear_filter", "add_category", "remove_category", "list_categories", "add_appointment", "query_agenda", "reverse_last_transaction", "error"],
      description: "Determines the user's intent.",
    },
    transactionData: {
      type: Type.OBJECT,
      description: "Data if action is 'add' (Financial).",
      properties: {
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ["income", "expense"] },
        date: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
      },
    },
    categoryData: {
      type: Type.OBJECT,
      description: "Data if action is 'add_category' or 'remove_category'.",
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ["income", "expense", "both"] }
      }
    },
    appointmentData: {
      type: Type.OBJECT,
      description: "Data if action is 'add_appointment' (Agenda).",
      properties: {
        title: { type: Type.STRING, description: "Short title of the event" },
        description: { type: Type.STRING, description: "More details if provided" },
        date: { type: Type.STRING, description: "ISO 8601 date (YYYY-MM-DD)" },
        time: { type: Type.STRING, description: "HH:mm format" },
        repeat: { type: Type.STRING, enum: ["none", "daily", "weekly", "monthly"] },
        repeatEndDate: { type: Type.STRING, description: "ISO 8601 date (YYYY-MM-DD) if specified" }
      }
    },
    filterCriteria: {
      type: Type.OBJECT,
      description: "Criteria if action is 'filter'. Used for extracts/statements.",
      properties: {
        categories: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of categories to filter by" 
        },
        type: { type: Type.STRING, enum: ["income", "expense"] },
        startDate: { type: Type.STRING, description: "Start date YYYY-MM-DD" },
        endDate: { type: Type.STRING, description: "End date YYYY-MM-DD" }
      }
    },
    message: {
      type: Type.STRING,
      description: "The answer to the user's question, confirmation message, or error.",
    },
  },
  required: ["action"],
};

export const processUserInput = async (
  userInput: string,
  currentTransactions: Transaction[],
  availableCategories: Category[],
  currentAppointments: Appointment[]
): Promise<AIResponse> => {
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Context: Existing categories to help normalization
  const categoriesContext = availableCategories.map(c => c.name).join(", ");

  // Limit transaction context - EXCLUDE DELETED TRANSACTIONS from context
  const activeTransactions = currentTransactions.filter(t => !t.isDeleted && !t.isChargeback);
  const recentTransactions = activeTransactions.slice(0, 20);

  // Context: Recent/Upcoming appointments
  const upcomingAppointments = currentAppointments
    .filter(a => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  const contextData = JSON.stringify(recentTransactions.map(t => ({
    date: t.date,
    category: t.category,
    amount: t.amount,
    type: t.type,
    description: t.description
  })));

  const agendaContext = JSON.stringify(upcomingAppointments.map(a => ({
      title: a.title,
      date: a.date,
      time: a.time,
      repeat: a.repeat
  })));

  const systemInstruction = `
    Você é um assistente pessoal híbrido (Financeiro + Agenda) chamado "Finanças Voz".
    Hoje é: ${todayStr} (Dia da semana: ${today.toLocaleDateString('pt-BR', { weekday: 'long' })}).
    Hora atual: ${today.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}.
    
    CATEGORIAS FINANCEIRAS: [${categoriesContext}]
    
    O usuário vai falar um comando. Ignore a palavra chave "Finanças" ou "Agenda" no início se ela for apenas um gatilho.
    
    INTENÇÕES FINANCEIRAS:
    1. REGISTRAR GASTO/GANHO (action: 'add')
       - "gastei 50 na padaria", "recebi aluguel".
    2. CONSULTAR FINANÇAS (action: 'query')
       - "saldo", "quanto gastei".
    3. EXTRATO (action: 'filter')
       - "extrato de janeiro", "gastos com uber".
    4. CATEGORIAS (action: 'add_category', 'remove_category', 'list_categories').
    5. ESTORNO/CANCELAMENTO (action: 'reverse_last_transaction')
       - "estornar o último lançamento", "cancelar a última compra", "marcar como devolvido o ultimo item".
       - Isso deve ser usado quando o usuário quer marcar a transação mais recente como estornada/reembolsada.

    INTENÇÕES DE AGENDA (Palavras chave: Agendar, Marcar, Reunião, Compromisso, Lembrete, Agenda):
    1. CRIAR COMPROMISSO (action: 'add_appointment')
       - Ex: "Agendar dentista amanhã às 14h" -> date: [amanhã], time: "14:00".
       - Ex: "Reunião toda segunda às 9h" -> repeat: "weekly", date: [próxima segunda].
       - Ex: "Pagar boleto todo dia 5" -> repeat: "monthly", date: [próximo dia 5].
       - Se não disser hora, defina "08:00" ou null se o schema permitir (mas schema pede string). Use "09:00" padrão.
    2. CONSULTAR AGENDA (action: 'query_agenda')
       - Ex: "O que tenho para hoje?", "Minha agenda da semana".
       - Use o contexto de agenda fornecido para responder no campo 'message'.

    OUTROS:
    - LIMPAR (action: 'clear_filter') -> "sair", "voltar".

    CONTEXTO FINANCEIRO RECENTE: ${contextData}
    CONTEXTO AGENDA FUTURA: ${agendaContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userInput,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      action: "error",
      message: "Desculpe, tive um problema ao processar. Tente novamente.",
    };
  }
};
