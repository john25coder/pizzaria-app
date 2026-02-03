import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.services';

const router = Router();
const whatsappService = new WhatsAppService();

// ✅ Webhook para receber mensagens
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { event, data } = req.body;

        // Verificar se é uma mensagem recebida
        if (event === 'messages.upsert') {
            const message = data.messages[0];

            // Ignorar mensagens enviadas por nós
            if (message.key.fromMe) {
                return res.sendStatus(200);
            }

            const telefone = message.key.remoteJid.replace('@s.whatsapp.net', '');
            const mensagem = message.message?.conversation ||
                message.message?.extendedTextMessage?.text || '';

            // Marcar como lido
            await whatsappService.marcarComoLido(message.key.id);

            // Processar mensagem
            await whatsappService.processarMensagemRecebida(telefone, mensagem);
        }

        res.sendStatus(200);

    } catch (error) {
        console.error('Erro no webhook:', error);
        res.sendStatus(500);
    }
});

// ✅ Verificação do webhook (para WhatsApp Cloud API)
router.get('/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

export default router;
