import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * Enviar email de confirmação de pedido
     */
    async enviarConfirmacaoPedido(pedidoId: string) {
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
                    },
                    cupom: true
                }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            const valorFinal = pedido.valorTotal - pedido.valorDesconto;

            // Montar lista de itens
            const itensTexto = pedido.itens.map((item: any) =>
                `${item.quantidade}x ${item.produto.nome} (${item.tamanho.nome}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`
            ).join('\n');

            const textoSimples = `
Olá ${pedido.usuario.nome},

Seu pedido foi confirmado! 🎉

Número do Pedido: #${pedido.id.slice(0, 8)}
Status: ${pedido.status}
Endereço: ${pedido.enderecoEntrega}

ITENS DO PEDIDO:
${itensTexto}

Subtotal: R$ ${pedido.valorTotal.toFixed(2)}
${pedido.valorDesconto > 0 ? `Desconto (${pedido.cupom?.codigo}): -R$ ${pedido.valorDesconto.toFixed(2)}\n` : ''}
TOTAL: R$ ${valorFinal.toFixed(2)}

${pedido.observacoes ? `Observações: ${pedido.observacoes}\n` : ''}
Pizzaria App
            `.trim();

            await this.transporter.sendMail({
                from: `"Pizzaria App" <${process.env.SMTP_USER}>`,
                to: pedido.usuario.email,
                subject: `✅ Pedido #${pedido.id.slice(0, 8)} Confirmado!`,
                text: textoSimples
            });

            console.log(`📧 Email de confirmação enviado para ${pedido.usuario.email}`);
        } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error);
        }
    }

    /**
     * Enviar email de atualização de status
     */
    async enviarAtualizacaoStatus(pedidoId: string, novoStatus: string) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
                include: { usuario: true }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            const statusEmoji: { [key: string]: string } = {
                'PENDENTE': '⏳',
                'CONFIRMADO': '✅',
                'PREPARANDO': '👨‍🍳',
                'PRONTO': '🍕',
                'ENTREGUE': '🎉',
                'CANCELADO': '❌'
            };

            const statusMensagens: { [key: string]: string } = {
                'CONFIRMADO': 'Pagamento confirmado! Seu pedido já está na fila.',
                'PREPARANDO': 'Estamos preparando seu pedido!',
                'PRONTO': 'Seu pedido está pronto! O entregador já está a caminho.',
                'ENTREGUE': 'Pedido entregue! Bom apetite! 🍕',
                'CANCELADO': 'Seu pedido foi cancelado.'
            };

            const emoji = statusEmoji[novoStatus] || '📦';
            const mensagem = statusMensagens[novoStatus] || 'Status atualizado.';

            const textoSimples = `
Olá ${pedido.usuario.nome},

${mensagem}

Pedido: #${pedido.id.slice(0, 8)}
Status: ${novoStatus}

Pizzaria App
            `.trim();

            await this.transporter.sendMail({
                from: `"Pizzaria App" <${process.env.SMTP_USER}>`,
                to: pedido.usuario.email,
                subject: `${emoji} Pedido #${pedido.id.slice(0, 8)} - ${novoStatus}`,
                text: textoSimples
            });

            console.log(`📧 Email de status enviado para ${pedido.usuario.email}`);
        } catch (error) {
            console.error('Erro ao enviar email de status:', error);
        }
    }

    /**
     * Enviar email de falha no pagamento
     */
    async enviarFalhaPagamento(pedidoId: string, motivoFalha?: string) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
                include: { usuario: true }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            const textoSimples = `
Olá ${pedido.usuario.nome},

Infelizmente houve um problema com o pagamento do seu pedido.

Pedido: #${pedido.id.slice(0, 8)}
${motivoFalha ? `Motivo: ${motivoFalha}\n` : ''}
Por favor, tente novamente ou entre em contato conosco.

Pizzaria App
            `.trim();

            await this.transporter.sendMail({
                from: `"Pizzaria App" <${process.env.SMTP_USER}>`,
                to: pedido.usuario.email,
                subject: `❌ Problema com pagamento - Pedido #${pedido.id.slice(0, 8)}`,
                text: textoSimples
            });

            console.log(`📧 Email de falha enviado para ${pedido.usuario.email}`);
        } catch (error) {
            console.error('Erro ao enviar email de falha:', error);
        }
    }

    /**
     * Testar configuração de email
     */
    async testarConexao() {
        try {
            await this.transporter.verify();
            console.log('✅ Servidor de email configurado corretamente');
            return true;
        } catch (error) {
            console.error('❌ Erro na configuração do email:', error);
            return false;
        }
    }
}
