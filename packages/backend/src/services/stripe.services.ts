import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

const prisma = new PrismaClient();

export class StripeService {
    /**
     * Criar intent de pagamento
     */
    async criarPaymentIntent(pedidoId: string, valor: number, email: string) {
        try {
            // ✅ Validar se pedido existe
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
                include: { usuario: true }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            // ✅ Criar intent no Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(valor * 100), // Stripe usa centavos
                currency: 'brl',
                automatic_payment_methods: {
                    enabled: true
                },
                receipt_email: email,
                metadata: {
                    pedidoId,
                    usuarioId: pedido.usuarioId
                },
                description: `Pizzaria - Pedido #${pedidoId}`
            });

            // ✅ Salvar payment record no BD
            const pagamento = await prisma.pagamento.create({
                data: {
                    pedidoId,
                    stripePaymentIntentId: paymentIntent.id,
                    status: 'PENDENTE',
                    valor,
                    metodo: 'CARTAO'
                }
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                pagamento
            };
        } catch (error) {
            console.error('Erro ao criar payment intent:', error);
            throw error;
        }
    }

    /**
     * Confirmar pagamento
     */
    async confirmarPagamento(paymentIntentId: string) {
        try {
            // ✅ Buscar intent no Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (!paymentIntent) {
                throw new Error('Payment intent não encontrado');
            }

            // ✅ Verificar status
            if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Pagamento não foi bem-sucedido. Status: ${paymentIntent.status}`);
            }

            const pedidoId = paymentIntent.metadata?.pedidoId as string;

            // ✅ Atualizar pagamento no BD
            const pagamento = await prisma.pagamento.update({
                where: { stripePaymentIntentId: paymentIntentId },
                data: {
                    status: 'SUCESSO'
                }
            });

            // ✅ Atualizar status do pedido para CONFIRMADO
            const pedido = await prisma.pedido.update({
                where: { id: pedidoId },
                data: { status: 'CONFIRMADO' },
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

            return {
                sucesso: true,
                pagamento,
                pedido
            };
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            throw error;
        }
    }

    /**
     * Obter status do pagamento
     */
    async obterStatusPagamento(paymentIntentId: string) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            const pagamento = await prisma.pagamento.findUnique({
                where: { stripePaymentIntentId: paymentIntentId }
            });

            return {
                stripeStatus: paymentIntent.status,
                bdStatus: pagamento?.status,
                pagamento
            };
        } catch (error) {
            console.error('Erro ao obter status:', error);
            throw error;
        }
    }

    /**
     * Cancelar pagamento
     */
    async cancelarPagamento(paymentIntentId: string, motivo?: string) {
        try {
            const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

            const pagamento = await prisma.pagamento.update({
                where: { stripePaymentIntentId: paymentIntentId },
                data: {
                    status: 'FALHOU'
                }
            });

            return {
                sucesso: true,
                motivo: motivo || 'Pagamento cancelado pelo usuário',
                pagamento
            };
        } catch (error) {
            console.error('Erro ao cancelar pagamento:', error);
            throw error;
        }
    }

    /**
     * Listar pagamentos do usuário
     */
    async listarPagamentosUsuario(usuarioId: string) {
        try {
            const pagamentos = await prisma.pagamento.findMany({
                where: {
                    pedido: {
                        usuarioId
                    }
                },
                include: {
                    pedido: {
                        include: {
                            itens: true
                        }
                    }
                },
                orderBy: { criadoEm: 'desc' }
            });

            return pagamentos;
        } catch (error) {
            console.error('Erro ao listar pagamentos:', error);
            throw error;
        }
    }

    /**
     * Webhook para atualizar status automaticamente
     */
    async processarWebhook(event: any) {
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.confirmarPagamento(event.data.object.id);
                    console.log('✅ Pagamento confirmado:', event.data.object.id);
                    break;

                case 'payment_intent.payment_failed':
                    const pedidoId = event.data.object.metadata?.pedidoId;
                    await prisma.pagamento.update({
                        where: { stripePaymentIntentId: event.data.object.id },
                        data: { status: 'FALHOU' }
                    });
                    console.log('❌ Pagamento falhou:', pedidoId);
                    break;

                default:
                    console.log('Evento não tratado:', event.type);
            }
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            throw error;
        }
    }
}
