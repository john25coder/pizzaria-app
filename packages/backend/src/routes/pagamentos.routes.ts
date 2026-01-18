import { Router, Request, Response } from 'express';
import { StripeService } from '../services/stripe.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';
import Stripe from 'stripe';

const router = Router();
const service = new StripeService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ========================================
// POST /api/pagamentos/criar-intent
// Criar payment intent
// ========================================

router.post('/criar-intent', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const { pedidoId, valor } = req.body;

        if (!pedidoId || !valor) {
            return res.status(400).json({ error: 'pedidoId e valor são obrigatórios' });
        }

        const resultado = await service.criarPaymentIntent(
            pedidoId,
            valor,
            req.usuario.email
        );

        res.json({
            success: true,
            message: 'Payment intent criado com sucesso',
            data: resultado
        });
    } catch (error: any) {
        console.error('Erro ao criar intent:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// POST /api/pagamentos/confirmar
// Confirmar pagamento
// ========================================

router.post('/confirmar', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'paymentIntentId é obrigatório' });
        }

        const resultado = await service.confirmarPagamento(paymentIntentId);

        res.json({
            success: true,
            message: 'Pagamento confirmado com sucesso',
            data: resultado
        });
    } catch (error: any) {
        console.error('Erro ao confirmar pagamento:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/pagamentos/status/:paymentIntentId
// Obter status do pagamento
// ========================================

router.get('/status/:paymentIntentId', autenticar, async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.params;

        const resultado = await service.obterStatusPagamento(paymentIntentId);

        res.json({
            success: true,
            data: resultado
        });
    } catch (error: any) {
        console.error('Erro ao obter status:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// DELETE /api/pagamentos/cancelar/:paymentIntentId
// Cancelar pagamento
// ========================================

router.delete('/cancelar/:paymentIntentId', autenticar, async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.params;
        const { motivo } = req.body;

        const resultado = await service.cancelarPagamento(paymentIntentId, motivo);

        res.json({
            success: true,
            message: 'Pagamento cancelado',
            data: resultado
        });
    } catch (error: any) {
        console.error('Erro ao cancelar pagamento:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/pagamentos/meus-pagamentos
// Listar pagamentos do usuário
// ========================================

router.get('/meus-pagamentos', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const pagamentos = await service.listarPagamentosUsuario(req.usuario.id);

        res.json({
            success: true,
            data: pagamentos
        });
    } catch (error: any) {
        console.error('Erro ao listar pagamentos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// POST /api/pagamentos/webhook
// Webhook do Stripe (sem autenticação)
// ========================================

router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const sig = req.headers['stripe-signature'] as string;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!endpointSecret) {
            console.warn('STRIPE_WEBHOOK_SECRET não configurado');
            return res.status(400).json({ error: 'Webhook não configurado' });
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                endpointSecret
            );
        } catch (err: any) {
            console.error('Erro ao validar webhook:', err);
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }

        // ✅ Processar evento
        await service.processarWebhook(event);

        res.json({
            received: true
        });
    } catch (error: any) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
