import { PrismaClient } from '@prisma/client';
import { EmailService } from './email.services';

const prisma = new PrismaClient();
const emailService = new EmailService();


export class PedidosService {
    /**
     * Criar novo pedido
     */
    async criar(dados: {
        usuarioId: string;
        itens: Array<{
            produtoId: string;
            tamanhoId: string;
            quantidade: number;
        }>;
        observacoes?: string;
        enderecoEntrega: string;
        cupomId?: string;
    }) {
        try {
            // Validar se usuário existe
            const usuario = await prisma.usuario.findUnique({
                where: { id: dados.usuarioId }
            });

            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            // Validar e buscar produtos/tamanhos para calcular valor
            let valorTotal = 0;
            const itensComPreco = [];

            for (const item of dados.itens) {
                const produto = await prisma.produto.findUnique({
                    where: { id: item.produtoId }
                });

                const tamanho = await prisma.tamanho.findUnique({
                    where: { id: item.tamanhoId }
                });

                if (!produto || !tamanho) {
                    throw new Error('Produto ou tamanho não encontrado');
                }

                const preco = tamanho.preco;
                const subtotal = preco * item.quantidade;
                valorTotal += subtotal;

                itensComPreco.push({
                    produtoId: item.produtoId,
                    tamanhoId: item.tamanhoId,
                    quantidade: item.quantidade,
                    preco
                });
            }

            // Validar e aplicar cupom (se houver)
            let valorDesconto = 0;

            if (dados.cupomId) {
                const cupom = await prisma.cupom.findUnique({
                    where: { id: dados.cupomId }
                });

                if (!cupom) {
                    throw new Error('Cupom não encontrado');
                }

                if (!cupom.ativo) {
                    throw new Error('Cupom inativo');
                }

                if (cupom.validade && new Date() > cupom.validade) {
                    throw new Error('Cupom expirado');
                }

                if (cupom.usoMaximo && cupom.usosAtuais >= cupom.usoMaximo) {
                    throw new Error('Cupom atingiu o limite de usos');
                }

                // Calcular desconto
                if (cupom.tipo === 'PORCENTAGEM') {
                    valorDesconto = (valorTotal * cupom.desconto) / 100;
                } else if (cupom.tipo === 'FIXO') {
                    valorDesconto = cupom.desconto;
                }

                // Garantir que desconto não seja maior que o valor total
                if (valorDesconto > valorTotal) {
                    valorDesconto = valorTotal;
                }

                // Incrementar contador de uso do cupom
                await prisma.cupom.update({
                    where: { id: cupom.id },
                    data: { usosAtuais: { increment: 1 } }
                });
            }

            // Criar pedido
            const pedido = await prisma.pedido.create({
                data: {
                    usuarioId: dados.usuarioId,
                    status: 'PENDENTE',
                    valorTotal,
                    valorDesconto,
                    cupomId: dados.cupomId,
                    observacoes: dados.observacoes,
                    enderecoEntrega: dados.enderecoEntrega,
                    itens: {
                        create: itensComPreco.map(item => ({
                            produtoId: item.produtoId,
                            tamanhoId: item.tamanhoId,
                            quantidade: item.quantidade,
                            preco: item.preco
                        }))
                    }
                },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true
                        }
                    },
                    itens: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    cupom: true
                }
            });
            try {
                await emailService.enviarConfirmacaoPedido(pedido.id);
            } catch (error) {
                console.log('Não foi possível enviar email');
            }

            return pedido;
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            throw error;
        }
    }

    /**
     * Listar pedidos do usuário SEM paginação
     */
    async listarPorUsuario(usuarioId: string) {
        try {
            const pedidos = await prisma.pedido.findMany({
                where: { usuarioId },
                include: {
                    itens: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    cupom: true
                },
                orderBy: { criadoEm: 'desc' }
            });

            return pedidos;
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            throw error;
        }
    }

    /**
     * Listar pedidos por usuário COM paginação
     */
    async listarPorUsuarioComPaginacao(
        usuarioId: string,
        opcoes: {
            page?: number;
            limit?: number;
            status?: string;
        }
    ) {
        try {
            const page = opcoes.page || 1;
            const limit = opcoes.limit || 10;
            const skip = (page - 1) * limit;

            const where: any = { usuarioId };

            if (opcoes.status) {
                where.status = opcoes.status;
            }

            const [pedidos, total] = await Promise.all([
                prisma.pedido.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        itens: {
                            include: {
                                produto: true,
                                tamanho: true
                            }
                        },
                        cupom: true
                    },
                    orderBy: { criadoEm: 'desc' }
                }),
                prisma.pedido.count({ where })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                pedidos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Erro ao listar pedidos com paginação:', error);
            throw error;
        }
    }

    /**
     * Buscar pedido por ID
     */
    async buscarPorId(id: string) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true
                        }
                    },
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

            return pedido;
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            throw error;
        }
    }

    /**
     * Atualizar status do pedido
     */
    async atualizarStatus(id: string, novoStatus: string) {
        try {
            const statusValidos = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

            if (!statusValidos.includes(novoStatus)) {
                throw new Error(`Status inválido. Válidos: ${statusValidos.join(', ')}`);
            }

            const pedido = await prisma.pedido.findUnique({
                where: { id }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            const pedidoAtualizado = await prisma.pedido.update({
                where: { id },
                data: { status: novoStatus },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        }
                    },
                    itens: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    cupom: true
                }
            });

            return pedidoAtualizado;
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    }

    /**
     * Cancelar pedido
     */
    async cancelar(id: string) {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            if (['ENTREGUE', 'CANCELADO'].includes(pedido.status)) {
                throw new Error(`Não é possível cancelar um pedido com status ${pedido.status}`);
            }

            const pedidoCancelado = await prisma.pedido.update({
                where: { id },
                data: { status: 'CANCELADO' }
            });

            return pedidoCancelado;
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            throw error;
        }
    }

    /**
     * Listar todos os pedidos SEM paginação (admin)
     */
    async listarTodos(filtros?: {
        status?: string;
        dataInicio?: Date;
        dataFim?: Date;
    }) {
        try {
            const where: any = {};

            if (filtros?.status) {
                where.status = filtros.status;
            }

            if (filtros?.dataInicio || filtros?.dataFim) {
                where.criadoEm = {};
                if (filtros.dataInicio) {
                    where.criadoEm.gte = filtros.dataInicio;
                }
                if (filtros.dataFim) {
                    where.criadoEm.lte = filtros.dataFim;
                }
            }

            const pedidos = await prisma.pedido.findMany({
                where,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            telefone: true
                        }
                    },
                    itens: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    cupom: true
                },
                orderBy: { criadoEm: 'desc' }
            });

            return pedidos;
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            throw error;
        }
    }

    /**
     * Listar todos os pedidos COM paginação (admin)
     */
    async listarTodosComPaginacao(opcoes: {
        page?: number;
        limit?: number;
        status?: string;
        dataInicio?: Date;
        dataFim?: Date;
    }) {
        try {
            const page = opcoes.page || 1;
            const limit = opcoes.limit || 10;
            const skip = (page - 1) * limit;

            const where: any = {};

            if (opcoes.status) {
                where.status = opcoes.status;
            }

            if (opcoes.dataInicio || opcoes.dataFim) {
                where.criadoEm = {};
                if (opcoes.dataInicio) {
                    where.criadoEm.gte = opcoes.dataInicio;
                }
                if (opcoes.dataFim) {
                    where.criadoEm.lte = opcoes.dataFim;
                }
            }

            const [pedidos, total] = await Promise.all([
                prisma.pedido.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                email: true,
                                telefone: true
                            }
                        },
                        itens: {
                            include: {
                                produto: true,
                                tamanho: true
                            }
                        },
                        cupom: true
                    },
                    orderBy: { criadoEm: 'desc' }
                }),
                prisma.pedido.count({ where })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                pedidos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Erro ao listar pedidos com paginação:', error);
            throw error;
        }
    }

    /**
     * Obter estatísticas de vendas (admin)
     */
    async obterEstatisticas() {
        try {
            const total = await prisma.pedido.count();
            const pedidosPendentes = await prisma.pedido.count({
                where: { status: 'PENDENTE' }
            });
            const pedidosCancelados = await prisma.pedido.count({
                where: { status: 'CANCELADO' }
            });
            const pedidosEntregues = await prisma.pedido.count({
                where: { status: 'ENTREGUE' }
            });

            const receita = await prisma.pedido.aggregate({
                where: { status: 'ENTREGUE' },
                _sum: { valorTotal: true }
            });

            return {
                totalPedidos: total,
                pedidosPendentes,
                pedidosCancelados,
                pedidosEntregues,
                receitaTotal: receita._sum.valorTotal || 0
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}