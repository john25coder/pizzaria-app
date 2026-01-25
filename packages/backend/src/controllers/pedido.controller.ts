
    import { Request, Response } from 'express';
import { PedidosService } from '../services/pedido.services';
import { AuthenticatedRequest } from '../types/auth.types'; // Importe seu tipo customizado

const service = new PedidosService();

export class PedidoController {
    async criar(req: Request, res: Response) {
        try {
            // Type Casting seguro pois o middleware já validou
            const usuarioId = (req as AuthenticatedRequest).usuario?.id;

            if (!usuarioId) {
                return res.status(401).json({ error: 'Usuário não identificado' });
            }

            const pedido = await service.criar({
                ...req.body,
                usuarioId
            });

            return res.status(201).json({
                success: true,
                data: pedido
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async buscarPorId(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const pedido = await service.buscarPorId(id);

            res.json({
                success: true,
                data: pedido
            });
        } catch (error: any) {
            console.error('Erro ao buscar pedido:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao buscar pedido' });
        }
    }

    async listarTodos(req: Request, res: Response) {
        try {
            // ✅ CORRIGIDO: sem page e limit, apenas chama service.listarTodos()
            const pedidos = await service.listarTodos();

            res.json({
                success: true,
                data: pedidos,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.status(500).json({ error: 'Erro ao listar pedidos' });
        }
    }

    async listarPorUsuario(req: Request, res: Response) {
        try {
            const usuarioId = req.params.usuarioId as string;

            if (!usuarioId || usuarioId.trim() === '') {
                return res.status(400).json({ error: 'ID de usuário inválido' });
            }

            const pedidos = await service.listarPorUsuario(usuarioId);

            res.json({
                success: true,
                data: pedidos
            });
        } catch (error: any) {
            console.error('Erro ao listar pedidos do usuário:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao listar pedidos' });
        }
    }

    async atualizarStatus(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { status } = req.body;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            if (!status || typeof status !== 'string') {
                return res.status(400).json({ error: 'Status é obrigatório e deve ser string' });
            }

            const pedido = await service.atualizarStatus(id, status);

            res.json({
                success: true,
                data: pedido,
                message: 'Status atualizado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            if (error.message.includes('inválido')) {
                return res.status(400).json({ error: error.message });
            }

            res.status(400).json({
                error: error.message || 'Erro ao atualizar status'
            });
        }
    }

    async cancelar(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            // ✅ CORRIGIDO: sem argumentos extras
            await service.cancelar(id);

            res.json({
                success: true,
                message: 'Pedido cancelado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao cancelar pedido:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            if (error.message.includes('não é possível')) {
                return res.status(400).json({
                    error: error.message
                });
            }

            res.status(500).json({
                error: error.message || 'Erro ao cancelar pedido'
            });
        }
    }
}
