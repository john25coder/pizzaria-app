import { Response } from 'express';
import { TamanhosService } from '../services/tamanhos.services';
import { AuthenticatedRequest } from '../types/auth.types';

const service = new TamanhosService();

export class TamanhoController {
    // ✅ Listar todos
    async listarTodos(req: any, res: Response) {
        try {
            const tamanhos = await service.listarTodos();

            res.json({
                success: true,
                data: tamanhos,
                count: tamanhos.length
            });
        } catch (error) {
            console.error('Erro ao listar tamanhos:', error);
            res.status(500).json({ error: 'Erro ao listar tamanhos' });
        }
    }

    // ✅ Buscar por ID
    async buscarPorId(req: any, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const tamanho = await service.buscarPorId(id);

            res.json({
                success: true,
                data: tamanho
            });
        } catch (error: any) {
            console.error('Erro ao buscar tamanho:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao buscar tamanho' });
        }
    }

    // ✅ Criar tamanho
    async criar(req: AuthenticatedRequest, res: Response) {
        try {
            const { nome, descricao, preco } = req.body;

            if (!nome || !preco) {
                return res.status(400).json({
                    error: 'Nome e preço são obrigatórios'
                });
            }

            if (typeof preco !== 'number' || preco <= 0) {
                return res.status(400).json({
                    error: 'Preço deve ser um número positivo'
                });
            }

            const tamanho = await service.criar({
                nome,
                descricao,
                preco,
            });

            res.status(201).json({
                success: true,
                data: tamanho,
                message: 'Tamanho criado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao criar tamanho:', error);
            res.status(400).json({ error: error.message || 'Erro ao criar tamanho' });
        }
    }

    // ✅ Atualizar tamanho
    async atualizar(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const { nome, descricao, preco, ativo } = req.body;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            if (preco !== undefined && (typeof preco !== 'number' || preco <= 0)) {
                return res.status(400).json({
                    error: 'Preço deve ser um número positivo'
                });
            }

            const tamanho = await service.atualizar(id, {
                nome,
                descricao,
                preco,
            });

            res.json({
                success: true,
                data: tamanho,
                message: 'Tamanho atualizado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao atualizar tamanho:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao atualizar tamanho' });
        }
    }

    // ✅ Deletar tamanho
    async deletar(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            await service.deletar(id);

            res.json({
                success: true,
                message: 'Tamanho deletado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao deletar tamanho:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            if (error.message.includes('pedidos associados')) {
                return res.status(400).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao deletar tamanho' });
        }
    }
}
