import axios from 'axios';
import { AIService } from './ia.services';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'pizzaria-bot';

export class WhatsAppService {
    private aiService: AIService;

    constructor() {
        this.aiService = new AIService();
    }

    // ✅ Enviar mensagem
    async enviarMensagem(telefone: string, mensagem: string) {
        try {
            await axios.post(
                `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
                {
                    number: telefone,
                    text: mensagem
                },
                {
                    headers: {
                        'apikey': EVOLUTION_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`Mensagem enviada para ${telefone}`);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // ✅ Processar mensagem recebida
    async processarMensagemRecebida(telefone: string, mensagem: string) {
        try {
            // Processar com IA
            const resposta = await this.aiService.processarMensagem(telefone, mensagem);

            // Enviar resposta
            await this.enviarMensagem(telefone, resposta);

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            await this.enviarMensagem(
                telefone,
                'Desculpe, ocorreu um erro. Por favor, tente novamente.'
            );
        }
    }

    // ✅ Marcar como lido
    async marcarComoLido(messageId: string) {
        try {
            await axios.post(
                `${EVOLUTION_API_URL}/chat/markMessageAsRead/${INSTANCE_NAME}`,
                { messageId },
                {
                    headers: {
                        'apikey': EVOLUTION_API_KEY
                    }
                }
            );
        } catch (error) {
            console.error('Erro ao marcar como lido:', error);
        }
    }
}
