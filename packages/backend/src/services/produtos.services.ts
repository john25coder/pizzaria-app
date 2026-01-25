import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProdutosService {
    /**
     * Listar produtos com paginação e filtros
     */
    async listarComPaginacao(params: {
        page?: number;
        limit?: number;
        busca?: string;
        ativo?: boolean;
    }) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            const skip = (page - 1) * limit;

            // Construir filtro
            const where: any = {};

            if (params.ativo !== undefined) {
                where.ativo = params.ativo;
            }

            if (params.busca) {
                where.OR = [
                    { nome: { contains: params.busca, mode: 'insensitive' } },
                    { descricao: { contains: params.busca, mode: 'insensitive' } }
                ];
            }

            // Buscar produtos e total em paralelo
            const [produtos, total] = await Promise.all([
                prisma.produto.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { criadoEm: 'desc' }
                }),
                prisma.produto.count({ where })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                produtos,
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
            console.error('Erro ao listar produtos:', error);
            throw error;
        }
    }

    /**
     * Listar todos (sem paginação) - para uso interno
     */
    async listarTodos() {
        try {
            const produtos = await prisma.produto.findMany({
                where: { ativo: true },
                orderBy: { criadoEm: 'desc' }
            });
            return produtos;
        } catch (error) {
            console.error('Erro ao listar produtos:', error);
            throw error;
        }
    }

    /**
     * Buscar por ID
     */
    async buscarPorId(id: string) {
        try {
            const produto = await prisma.produto.findUnique({
                where: { id }
            });

            if (!produto) {
                throw new Error('Produto não encontrado');
            }

            return produto;
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            throw error;
        }
    }

    /**
     * Criar produto
     */
    async criar(dados: {
        nome: string;
        descricao?: string;
        preco: number;
        imagem?: string;
    }) {
        try {
            const produto = await prisma.produto.create({
                data: {
                    nome: dados.nome,
                    descricao: dados.descricao,
                    preco: dados.preco,
                    imagem: dados.imagem,
                    ativo: true
                }
            });
            return produto;
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            throw error;
        }
    }

    /**
     * Atualizar produto
     */
    async atualizar(id: string, dados: {
        nome?: string;
        descricao?: string;
        preco?: number;
        imagem?: string;
        ativo?: boolean;
    }) {
        try {
            const produto = await prisma.produto.update({
                where: { id },
                data: dados
            });
            return produto;
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    /**
     * Deletar produto
     */
    async deletar(id: string) {
        try {
            await prisma.produto.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            throw error;
        }
    }
}
