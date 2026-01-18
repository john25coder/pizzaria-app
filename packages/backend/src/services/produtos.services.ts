import { PrismaClient } from '@prisma/client';
import { CriarProdutoDTO } from '../types/dtos';

const prisma = new PrismaClient();

export class ProdutosService {
    /**
     * Lista todos os produtos ativos
     */
    async listarTodos() {
        try {
            const produtos = await prisma.produto.findMany({
                where: { ativo: true },
                orderBy: { nome: 'asc' }
            });

            return produtos;
        } catch (error) {
            console.error('Erro ao listar todos os produtos:', error);
            throw error;
        }
    }

    /**
     * Busca um produto por ID
     */
    async buscarPorId(id: string) {
        try {
            const produto = await prisma.produto.findUnique({
                where: { id },
                include: {
                    itensPedidos: true
                }
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
     * Cria um novo produto
     */
    async criar(dados: CriarProdutoDTO) {
        try {
            // ✅ Validar se produto já existe
            const produtoExiste = await prisma.produto.findFirst({
                where: { nome: dados.nome }
            });

            if (produtoExiste) {
                throw new Error('Produto com este nome já existe');
            }

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
     * Atualiza um produto
     */
    async atualizar(
        id: string,
        dados: Partial<CriarProdutoDTO>
    ) {
        try {
            // ✅ Validar se produto existe
            const produtoExiste = await prisma.produto.findUnique({
                where: { id }
            });

            if (!produtoExiste) {
                throw new Error('Produto não encontrado');
            }

            // ✅ Se mudar nome, validar duplicidade
            if (dados.nome && dados.nome !== produtoExiste.nome) {
                const nomeEmUso = await prisma.produto.findFirst({
                    where: {
                        nome: dados.nome,
                        id: { not: id }
                    }
                });

                if (nomeEmUso) {
                    throw new Error('Produto com este nome já existe');
                }
            }

            const produto = await prisma.produto.update({
                where: { id },
                data: {
                    ...(dados.nome && { nome: dados.nome }),
                    ...(dados.descricao !== undefined && { descricao: dados.descricao }),
                    ...(dados.preco !== undefined && { preco: dados.preco }),
                    ...(dados.imagem !== undefined && { imagem: dados.imagem })
                }
            });

            return produto;
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    /**
     * Deleta um produto
     */
    async deletar(id: string) {
        try {
            const produtoExiste = await prisma.produto.findUnique({
                where: { id }
            });

            if (!produtoExiste) {
                throw new Error('Produto não encontrado');
            }

            await prisma.produto.delete({
                where: { id }
            });

            return { success: true, message: 'Produto deletado com sucesso' };
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            throw error;
        }
    }

    /**
     * Alterna entre ativo/inativo
     */
    async alternarAtivo(id: string) {
        try {
            const produto = await prisma.produto.findUnique({
                where: { id }
            });

            if (!produto) {
                throw new Error('Produto não encontrado');
            }

            const produtoAtualizado = await prisma.produto.update({
                where: { id },
                data: { ativo: !produto.ativo }
            });

            return produtoAtualizado;
        } catch (error) {
            console.error('Erro ao alternar ativo:', error);
            throw error;
        }
    }

    /**
     * Busca com filtros avançados
     */
    async buscarComFiltros(filtros: {
        ativo?: boolean;
        busca?: string;
    }) {
        try {
            const where: any = {};

            if (filtros.ativo !== undefined) {
                where.ativo = filtros.ativo;
            }

            if (filtros.busca) {
                where.OR = [
                    { nome: { contains: filtros.busca, mode: 'insensitive' } },
                    { descricao: { contains: filtros.busca, mode: 'insensitive' } }
                ];
            }

            const produtos = await prisma.produto.findMany({
                where,
                orderBy: { nome: 'asc' }
            });

            return produtos;
        } catch (error) {
            console.error('Erro ao buscar com filtros:', error);
            throw error;
        }
    }
}
