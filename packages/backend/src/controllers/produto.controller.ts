import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtos.services';

const service = new ProdutosService();

export class ProdutoController {
    async listarTodos(req: Request, res: Response) {
        try {
            const produtos = await service.listarTodos();

            res.json({
                success: true,
                data: produtos,
                count: produtos.length
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({
                error: 'Erro ao buscar produtos',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }

    async buscarPorId(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const produto = await service.buscarPorId(id);

            res.json({
                success: true,
                data: produto
            });
        } catch (error: any) {
            console.error('Erro ao buscar produto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({
                error: 'Erro ao buscar produto',
                message: error.message || 'Erro desconhecido'
            });
        }
    }

    async criar(req: Request, res: Response) {
        try {
            const { nome, descricao, preco, imagem } = req.body;

            // ✅ Validações
            if (!nome || nome.trim() === '') {
                return res.status(400).json({ error: 'Nome do produto é obrigatório' });
            }

            if (preco === undefined || preco <= 0) {
                return res.status(400).json({ error: 'Preço deve ser maior que 0' });
            }

            const produto = await service.criar({
                nome: nome.trim(),
                descricao: descricao?.trim(),
                preco: parseFloat(preco),
                imagem
            });

            res.status(201).json({
                success: true,
                data: produto,
                message: 'Produto criado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao criar produto:', error);

            if (error.message.includes('já existe')) {
                return res.status(409).json({ error: error.message });
            }

            res.status(400).json({
                error: 'Erro ao criar produto',
                message: error.message
            });
        }
    }

    async atualizar(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { nome, descricao, preco, imagem } = req.body;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            // ✅ Validações
            if (nome !== undefined && (!nome || nome.trim() === '')) {
                return res.status(400).json({ error: 'Nome do produto não pode estar vazio' });
            }

            if (preco !== undefined && preco <= 0) {
                return res.status(400).json({ error: 'Preço deve ser maior que 0' });
            }

            const produto = await service.atualizar(id, {
                nome: nome?.trim(),
                descricao: descricao?.trim(),
                preco: preco ? parseFloat(preco) : undefined,
                imagem
            });

            res.json({
                success: true,
                data: produto,
                message: 'Produto atualizado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao atualizar produto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            if (error.message.includes('já existe')) {
                return res.status(409).json({ error: error.message });
            }

            res.status(400).json({
                error: 'Erro ao atualizar produto',
                message: error.message
            });
        }
    }

    async deletar(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            await service.deletar(id);

            res.json({
                success: true,
                message: 'Produto deletado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao deletar produto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({
                error: 'Erro ao deletar produto',
                message: error.message
            });
        }
    }

    async alternarAtivo(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const produto = await service.alternarAtivo(id);

            res.json({
                success: true,
                data: produto,
                message: `Produto ${produto.ativo ? 'ativado' : 'desativado'} com sucesso`
            });
        } catch (error: any) {
            console.error('Erro ao alternar status do produto:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({
                error: 'Erro ao alternar status',
                message: error.message
            });
        }
    }

    // ✅ NOVO: Buscar com filtros
    async buscarComFiltros(req: Request, res: Response) {
        try {
            const { ativo, busca } = req.query;

            const filtros = {
                ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
                busca: busca as string | undefined
            };

            const produtos = await service.buscarComFiltros(filtros);

            res.json({
                success: true,
                data: produtos,
                count: produtos.length
            });
        } catch (error: any) {
            console.error('Erro ao buscar com filtros:', error);
            res.status(500).json({
                error: 'Erro ao buscar produtos',
                message: error.message
            });
        }
    }
}
