import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './email.services';

const emailService = new EmailService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {

});

const prisma = new PrismaClient();

export class StripeService {
    /**
     * Criar Payment Intent para um pedido
     */
    async criarPaymentIntent(pedidoId: string) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
                include: {
                    usuario: true,
                    itens: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    }
                }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            // Calcular valor final (total - desconto)
            const valorFinal = pedido.valorTotal - pedido.valorDesconto;

            // Criar Payment Intent no Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(valorFinal * 100), // Converter para centavos
                currency: 'brl',
                metadata: {
                    pedidoId: pedido.id,
                    usuarioId: pedido.usuarioId,
                    usuarioEmail: pedido.usuario.email
                },
                description: `Pedido #${pedido.id} - Pizzaria App`
            });

            // Criar registro de pagamento no banco
            const pagamento = await prisma.pagamento.create({
                data: {
                    pedidoId: pedido.id,
                    stripePaymentIntentId: paymentIntent.id,
                    status: 'PENDENTE',
                    valor: valorFinal,
                    metodo: 'CARTAO'
                }
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                pagamentoId: pagamento.id
            };
        } catch (error) {
            console.error('Erro ao criar payment intent:', error);
            throw error;
        }
    }

    /**
     * Processar webhook do Stripe
     */
    async processarWebhook(signature: string, rawBody: Buffer) {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

            // Verificar assinatura do webhook
            const event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret
            );

            console.log('Webhook recebido:', event.type);

            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                    break;

                case 'charge.refunded':
                    await this.handleRefund(event.data.object as Stripe.Charge);
                    break;

                default:
                    console.log(`Evento não tratado: ${event.type}`);
            }

            return { received: true };
        } catch (error: any) {
            console.error('Erro ao processar webhook:', error);
            throw new Error(`Webhook Error: ${error.message}`);
        }
    }

    /**
     * Handler para pagamento bem-sucedido
     */
    private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
        try {
            const pedidoId = paymentIntent.metadata.pedidoId;

            await prisma.pagamento.update({
                where: { stripePaymentIntentId: paymentIntent.id },
                data: {
                    status: 'SUCESSO',
                    descricao: 'Pagamento confirmado'
                }
            });

            await prisma.pedido.update({
                where: { id: pedidoId },
                data: { status: 'CONFIRMADO' }
            });

            console.log(`✅ Pagamento confirmado para pedido ${pedidoId}`);

            // Enviar email de confirmação
            try {
                await emailService.enviarConfirmacaoPedido(pedidoId);
            } catch (error) {
                console.log('Não foi possível enviar email');
            }

        } catch (error) {
            console.error('Erro ao processar pagamento bem-sucedido:', error);
            throw error;
        }
    }
    /**
     * Handler para pagamento falhou
     */
    private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
        try {
            const pedidoId = paymentIntent.metadata.pedidoId;
            const motivo = paymentIntent.last_payment_error?.message || 'Pagamento recusado';

            await prisma.pagamento.update({
                where: { stripePaymentIntentId: paymentIntent.id },
                data: {
                    status: 'FALHOU',
                    descricao: motivo
                }
            });

            await prisma.pedido.update({
                where: { id: pedidoId },
                data: { status: 'CANCELADO' }
            });

            console.log(`❌ Pagamento falhou para pedido ${pedidoId}`);

            // Enviar email de falha
            try {
                await emailService.enviarFalhaPagamento(pedidoId, motivo);
            } catch (error) {
                console.log('Não foi possível enviar email');
            }

        } catch (error) {
            console.error('Erro ao processar falha de pagamento:', error);
            throw error;
        }
    }


    /**
     * Handler para reembolso
     */
    private async handleRefund(charge: Stripe.Charge) {
        try {
            const paymentIntentId = charge.payment_intent as string;

            await prisma.pagamento.update({
                where: { stripePaymentIntentId: paymentIntentId },
                data: {
                    status: 'REEMBOLSADO',
                    descricao: 'Pagamento reembolsado'
                }
            });

            console.log(`💰 Reembolso processado para payment intent ${paymentIntentId}`);

        } catch (error) {
            console.error('Erro ao processar reembolso:', error);
            throw error;
        }
    }

    /**
     * Criar reembolso
     */
    async criarReembolso(pedidoId: string, motivo?: string) {
        try {
            const pagamento = await prisma.pagamento.findFirst({
                where: { pedidoId },
                include: { pedido: true }
            });

            if (!pagamento) {
                throw new Error('Pagamento não encontrado');
            }

            if (pagamento.status !== 'SUCESSO') {
                throw new Error('Apenas pagamentos bem-sucedidos podem ser reembolsados');
            }

            // Criar reembolso no Stripe
            const refund = await stripe.refunds.create({
                payment_intent: pagamento.stripePaymentIntentId,
                reason: 'requested_by_customer',
                metadata: {
                    pedidoId,
                    motivo: motivo || 'Cancelamento solicitado'
                }
            });

            // Atualizar pagamento
            await prisma.pagamento.update({
                where: { id: pagamento.id },
                data: {
                    status: 'PROCESSANDO',
                    descricao: 'Reembolso em processamento'
                }
            });

            // Cancelar pedido
            await prisma.pedido.update({
                where: { id: pedidoId },
                data: { status: 'CANCELADO' }
            });

            return {
                refundId: refund.id,
                status: refund.status,
                valor: refund.amount / 100
            };

        } catch (error) {
            console.error('Erro ao criar reembolso:', error);
            throw error;
        }
    }

    /**
     * Buscar status do pagamento
     */
    async buscarStatusPagamento(pedidoId: string) {
        try {
            const pagamento = await prisma.pagamento.findFirst({
                where: { pedidoId },
                include: {
                    pedido: {
                        select: {
                            id: true,
                            status: true,
                            valorTotal: true,
                            valorDesconto: true
                        }
                    }
                }
            });

            if (!pagamento) {
                throw new Error('Pagamento não encontrado');
            }

            // Buscar detalhes no Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(
                pagamento.stripePaymentIntentId
            );

            return {
                pagamentoId: pagamento.id,
                status: pagamento.status,
                statusStripe: paymentIntent.status,
                valor: pagamento.valor,
                metodo: pagamento.metodo,
                descricao: pagamento.descricao,
                criadoEm: pagamento.criadoEm,
                pedido: pagamento.pedido
            };

        } catch (error) {
            console.error('Erro ao buscar status do pagamento:', error);
            throw error;
        }
    }
}
