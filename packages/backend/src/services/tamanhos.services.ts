import { PrismaClient } from '@prisma/client';
import { CriarTamanhoDTO } from '../types/dtos';

const prisma = new PrismaClient();

export class TamanhosService {
    /**
     * Lista todos os tamanhos ativos
     */
    async listarTodos() {
        try {
            const tamanhos = await prisma.tamanho.findMany({
                where: { ativo: true },
                orderBy: { nome: 'asc' }
            });

            return tamanhos;
        } catch (error) {
            console.error('Erro ao listar tamanhos:', error);
            throw error;
        }
    }

    /**
     * Busca um tamanho por ID
     */
    async buscarPorId(id: string) {
        try {
            const tamanho = await prisma.tamanho.findUnique({
                where: { id }
            });

            if (!tamanho) {
                throw new Error('Tamanho não encontrado');
            }

            return tamanho;
        } catch (error) {
            console.error('Erro ao buscar tamanho:', error);
            throw error;
        }
    }

    /**
     * Cria um novo tamanho
     */
    async criar(dados: CriarTamanhoDTO) {
        try {
            // ✅ Validar se tamanho já existe
            const tamanhoExiste = await prisma.tamanho.findFirst({
                where: { nome: dados.nome }
            });

            if (tamanhoExiste) {
                throw new Error('Tamanho com este nome já existe');
            }

            const tamanho = await prisma.tamanho.create({
                data: {
                    nome: dados.nome,
                    descricao: dados.descricao,
                    preco: dados.preco,
                    ativo: true
                }
            });

            return tamanho;
        } catch (error) {
            console.error('Erro ao criar tamanho:', error);
            throw error;
        }
    }

    /**
     * Atualiza um tamanho
     */
    async atualizar(
        id: string,
        dados: Partial<CriarTamanhoDTO>
    ) {
        try {
            // ✅ Validar se tamanho existe
            const tamanhoExiste = await prisma.tamanho.findUnique({
                where: { id }
            });

            if (!tamanhoExiste) {
                throw new Error('Tamanho não encontrado');
            }

            // ✅ Se mudar nome, validar duplicidade
            if (dados.nome && dados.nome !== tamanhoExiste.nome) {
                const nomeEmUso = await prisma.tamanho.findFirst({
                    where: {
                        nome: dados.nome,
                        id: { not: id }
                    }
                });

                if (nomeEmUso) {
                    throw new Error('Tamanho com este nome já existe');
                }
            }

            const tamanho = await prisma.tamanho.update({
                where: { id },
                data: {
                    ...(dados.nome && { nome: dados.nome }),
                    ...(dados.descricao !== undefined && { descricao: dados.descricao }),
                    ...(dados.preco !== undefined && { preco: dados.preco })
                }
            });

            return tamanho;
        } catch (error) {
            console.error('Erro ao atualizar tamanho:', error);
            throw error;
        }
    }

    /**
     * Deleta um tamanho
     */
    async deletar(id: string) {
        try {
            const tamanhoExiste = await prisma.tamanho.findUnique({
                where: { id }
            });

            if (!tamanhoExiste) {
                throw new Error('Tamanho não encontrado');
            }

            await prisma.tamanho.delete({
                where: { id }
            });

            return { success: true, message: 'Tamanho deletado com sucesso' };
        } catch (error) {
            console.error('Erro ao deletar tamanho:', error);
            throw error;
        }
    }

    /**
     * Alterna entre ativo/inativo
     */
    async alternarAtivo(id: string) {
        try {
            const tamanho = await prisma.tamanho.findUnique({
                where: { id }
            });

            if (!tamanho) {
                throw new Error('Tamanho não encontrado');
            }

            const tamanhoAtualizado = await prisma.tamanho.update({
                where: { id },
                data: { ativo: !tamanho.ativo }
            });

            return tamanhoAtualizado;
        } catch (error) {
            console.error('Erro ao alternar ativo:', error);
            throw error;
        }
    }
}
