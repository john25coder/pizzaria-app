import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../types/auth.types';
import { CriarPaymentIntentDTO, ConfirmarPagamentoDTO } from '../types/dtos';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {

});

export async function criarPaymentIntent(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { amount, currency = 'brl', descricao } = req.body as CriarPaymentIntentDTO;

        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'Valor inválido' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
            description: descricao || 'Pagamento de pizzas',
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error: any) {
        console.error('Erro ao criar Payment Intent:', error.message);
        res.status(400).json({ error: error.message });
    }
}

// ✅ NOVO: Confirmar pagamento COM método de pagamento
export async function confirmarPagamento(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;

        if (!paymentIntentId) {
            res.status(400).json({ error: 'Payment Intent ID é obrigatório' });
            return;
        }

        // ✅ Se tiver paymentMethodId, confirma COM o método
        if (paymentMethodId) {
            const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });

            if (confirmedIntent.status === 'succeeded') {
                res.json({
                    success: true,
                    message: 'Pagamento confirmado com sucesso!',
                    paymentIntentId: confirmedIntent.id,
                });
                return;
            }
        }

        // ✅ Se não tiver método, apenas recupera o status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            res.json({
                success: true,
                message: 'Pagamento confirmado com sucesso!',
                paymentIntentId: paymentIntent.id,
            });
        } else {
            res.status(400).json({
                success: false,
                error: `Pagamento não foi bem-sucedido. Status: ${paymentIntent.status}`,
            });
        }
    } catch (error: any) {
        console.error('Erro ao confirmar pagamento:', error.message);
        res.status(400).json({ error: error.message });
    }
}

export async function listarPagamentos(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 10,
        });

        res.json({
            success: true,
            total: paymentIntents.data.length,
            pagamentos: paymentIntents.data.map((pi) => ({
                id: pi.id,
                valor: pi.amount / 100,
                moeda: pi.currency,
                status: pi.status,
                criadoEm: new Date(pi.created * 1000).toLocaleString('pt-BR'),
            })),
        });
    } catch (error: any) {
        console.error('Erro ao listar pagamentos:', error.message);
        res.status(400).json({ error: error.message });
    }
}
