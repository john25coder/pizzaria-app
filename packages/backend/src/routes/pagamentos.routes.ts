// packages/backend/src/routes/pagamentos.routes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/stripe.sevice';
import { autenticar } from '../middlewares/auth.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const stripeService = new StripeService();
const prisma = new PrismaClient(); // 🆕 ADICIONAR ESTA LINHA

// ========================================
// POST /api/pagamentos/criar-intent
// Criar Payment Intent para um pedido
// ========================================
router.post('/criar-intent', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pedidoId } = req.body;

        if (!pedidoId) {
            return res.status(400).json({ error: 'pedidoId é obrigatório' });
        }

        // Verificar se usuário é owner do pedido
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (pedido.usuarioId !== req.usuario?.id && req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const result = await stripeService.criarPaymentIntent(pedidoId);

        res.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Erro ao criar payment intent:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// POST /api/pagamentos/webhook
// Webhook do Stripe (NÃO precisa autenticação)
// ========================================
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Signature ausente' });
        }

        // rawBody é necessário para validar a signature
        const rawBody = req.body;

        await stripeService.processarWebhook(signature, rawBody);

        res.json({ received: true });

    } catch (error: any) {
        console.error('Erro no webhook:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// POST /api/pagamentos/:pedidoId/reembolso
// Criar reembolso (admin ou owner)
// ========================================
router.post('/:pedidoId/reembolso', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pedidoId } = req.params;
        const { motivo } = req.body;

        // Verificar permissão
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (pedido.usuarioId !== req.usuario?.id && req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const result = await stripeService.criarReembolso(pedidoId, motivo);

        res.json({
            success: true,
            message: 'Reembolso criado com sucesso',
            data: result
        });

    } catch (error: any) {
        console.error('Erro ao criar reembolso:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/pagamentos/:pedidoId/status
// Buscar status do pagamento
// ========================================
router.get('/:pedidoId/status', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pedidoId } = req.params;

        // Verificar permissão
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (pedido.usuarioId !== req.usuario?.id && req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const status = await stripeService.buscarStatusPagamento(pedidoId);

        res.json({
            success: true,
            data: status
        });

    } catch (error: any) {
        console.error('Erro ao buscar status:', error);
        res.status(404).json({ error: error.message });
    }
});

export default router;
