// packages/backend/src/services/cupom.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CupomService {
    /**
     * Validar cupom por código
     */
    async validarPorCodigo(codigo: string) {
        try {
            const cupom = await prisma.cupom.findUnique({
                where: { codigo: codigo.toUpperCase() }
            });

            if (!cupom) {
                return {
                    valido: false,
                    mensagem: 'Cupom não encontrado'
                };
            }

            if (!cupom.ativo) {
                return {
                    valido: false,
                    mensagem: 'Cupom inativo'
                };
            }

            if (cupom.validade && new Date() > cupom.validade) {
                return {
                    valido: false,
                    mensagem: 'Cupom expirado'
                };
            }

            if (cupom.usoMaximo && cupom.usosAtuais >= cupom.usoMaximo) {
                return {
                    valido: false,
                    mensagem: 'Cupom atingiu o limite de usos'
                };
            }

            return {
                valido: true,
                cupom,
                mensagem: 'Cupom válido'
            };
        } catch (error) {
            console.error('Erro ao validar cupom:', error);
            throw error;
        }
    }

    /**
     * Criar novo cupom (admin)
     */
    async criar(dados: {
        codigo: string;
        desconto: number;
        tipo: string;
        validade?: Date;
        usoMaximo?: number;
    }) {
        try {
            // Verificar se código já existe
            const existente = await prisma.cupom.findUnique({
                where: { codigo: dados.codigo.toUpperCase() }
            });

            if (existente) {
                throw new Error('Já existe um cupom com este código');
            }

            // Validar tipo
            if (!['PORCENTAGEM', 'FIXO'].includes(dados.tipo)) {
                throw new Error('Tipo deve ser PORCENTAGEM ou FIXO');
            }

            // Validar desconto
            if (dados.tipo === 'PORCENTAGEM' && (dados.desconto < 0 || dados.desconto > 100)) {
                throw new Error('Desconto em porcentagem deve estar entre 0 e 100');
            }

            if (dados.tipo === 'FIXO' && dados.desconto < 0) {
                throw new Error('Desconto em valor fixo não pode ser negativo');
            }

            const cupom = await prisma.cupom.create({
                data: {
                    codigo: dados.codigo.toUpperCase(),
                    desconto: dados.desconto,
                    tipo: dados.tipo,
                    validade: dados.validade,
                    usoMaximo: dados.usoMaximo,
                    ativo: true
                }
            });

            return cupom;
        } catch (error) {
            console.error('Erro ao criar cupom:', error);
            throw error;
        }
    }

    /**
     * Listar todos os cupons (admin)
     */
    async listarTodos() {
        try {
            const cupons = await prisma.cupom.findMany({
                orderBy: { criadoEm: 'desc' },
                include: {
                    _count: {
                        select: { pedidos: true }
                    }
                }
            });

            return cupons;
        } catch (error) {
            console.error('Erro ao listar cupons:', error);
            throw error;
        }
    }

    /**
     * Buscar cupom por ID (admin)
     */
    async buscarPorId(id: string) {
        try {
            const cupom = await prisma.cupom.findUnique({
                where: { id },
                include: {
                    pedidos: {
                        select: {
                            id: true,
                            valorTotal: true,
                            valorDesconto: true,
                            criadoEm: true
                        },
                        orderBy: { criadoEm: 'desc' },
                        take: 10
                    }
                }
            });

            if (!cupom) {
                throw new Error('Cupom não encontrado');
            }

            return cupom;
        } catch (error) {
            console.error('Erro ao buscar cupom:', error);
            throw error;
        }
    }

    /**
     * Atualizar cupom (admin)
     */
    async atualizar(id: string, dados: {
        codigo?: string;
        desconto?: number;
        tipo?: string;
        validade?: Date;
        ativo?: boolean;
        usoMaximo?: number;
    }) {
        try {
            const cupom = await prisma.cupom.findUnique({
                where: { id }
            });

            if (!cupom) {
                throw new Error('Cupom não encontrado');
            }

            // Se está mudando o código, verificar se já existe
            if (dados.codigo && dados.codigo !== cupom.codigo) {
                const existente = await prisma.cupom.findUnique({
                    where: { codigo: dados.codigo.toUpperCase() }
                });

                if (existente) {
                    throw new Error('Já existe um cupom com este código');
                }
            }

            const cupomAtualizado = await prisma.cupom.update({
                where: { id },
                data: {
                    codigo: dados.codigo ? dados.codigo.toUpperCase() : undefined,
                    desconto: dados.desconto,
                    tipo: dados.tipo,
                    validade: dados.validade,
                    ativo: dados.ativo,
                    usoMaximo: dados.usoMaximo
                }
            });

            return cupomAtualizado;
        } catch (error) {
            console.error('Erro ao atualizar cupom:', error);
            throw error;
        }
    }

    /**
     * Desativar cupom (admin)
     */
    async desativar(id: string) {
        try {
            const cupom = await prisma.cupom.findUnique({
                where: { id }
            });

            if (!cupom) {
                throw new Error('Cupom não encontrado');
            }

            const cupomDesativado = await prisma.cupom.update({
                where: { id },
                data: { ativo: false }
            });

            return cupomDesativado;
        } catch (error) {
            console.error('Erro ao desativar cupom:', error);
            throw error;
        }
    }

    /**
     * Obter estatísticas de uso (admin)
     */
    async obterEstatisticas(id: string) {
        try {
            const cupom = await prisma.cupom.findUnique({
                where: { id },
                include: {
                    pedidos: {
                        select: {
                            valorDesconto: true
                        }
                    }
                }
            });

            if (!cupom) {
                throw new Error('Cupom não encontrado');
            }

            const totalDescontoConcedido = cupom.pedidos.reduce(
                (total, pedido) => total + pedido.valorDesconto,
                0
            );

            return {
                codigo: cupom.codigo,
                totalUsos: cupom.usosAtuais,
                usoMaximo: cupom.usoMaximo,
                totalDescontoConcedido,
                ativo: cupom.ativo,
                validade: cupom.validade
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}
