// packages/backend/src/routes/pedidos.routes.ts
import { Router, Response } from 'express';
import { PedidosService } from '../services/pedido.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { validate } from '../middlewares/validate.middlewares';
import { criarPedidoSchema } from '../schema/pedido.schema';
import { AuthenticatedRequest } from '../types/auth.types';
import { PrismaClient } from '@prisma/client';

const router = Router();
const service = new PedidosService();
const prisma = new PrismaClient();

// ========================================
// POST /api/pedidos
// Criar novo pedido (cliente autenticado)
// ========================================
router.post(
    '/',
    autenticar,
    validate(criarPedidoSchema),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const pedido = await service.criar({
                usuarioId: req.usuario.id,
                itens: req.body.itens,
                observacoes: req.body.observacoes,
                enderecoEntrega: req.body.enderecoEntrega,
                cupomId: req.body.cupomId
            });

            res.status(201).json({
                success: true,
                message: 'Pedido criado com sucesso',
                data: pedido
            });
        } catch (error: any) {
            console.error('Erro ao criar pedido:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// ========================================
// GET /api/pedidos/meus-pedidos
// Listar pedidos do usuário logado COM PAGINAÇÃO
// ========================================
router.get('/meus-pedidos', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const page = req.query.page ? parseInt(req.query.page as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const status = req.query.status as string;

        // Se não tem paginação, usa método sem paginação
        if (!page && !limit) {
            const pedidos = await service.listarPorUsuario(req.usuario.id);
            return res.json({
                success: true,
                data: pedidos
            });
        }

        // Com paginação
        const resultado = await service.listarPorUsuarioComPaginacao(
            req.usuario.id,
            { page, limit, status }
        );

        res.json({
            success: true,
            data: resultado.pedidos,
            pagination: resultado.pagination
        });
    } catch (error: any) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/pedidos/:id
// Buscar pedido por ID
// ========================================
router.get('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const pedido = await service.buscarPorId(id);

        // Verificar se usuário é owner ou admin
        if (req.usuario?.id !== pedido.usuarioId && req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json({
            success: true,
            data: pedido
        });
    } catch (error: any) {
        console.error('Erro ao buscar pedido:', error);
        res.status(404).json({ error: error.message });
    }
});

// ========================================
// PATCH /api/pedidos/:id/status
// Atualizar status do pedido (admin)
// ========================================
router.patch('/:id/status', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas admins podem atualizar status' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status é obrigatório' });
        }

        const pedido = await service.atualizarStatus(id, status);

        res.json({
            success: true,
            message: `Pedido atualizado para ${status}`,
            data: pedido
        });
    } catch (error: any) {
        console.error('Erro ao atualizar status:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// DELETE /api/pedidos/:id
// Cancelar pedido
// ========================================
router.delete('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const { id } = req.params;
        const pedido = await service.buscarPorId(id);

        // Verificar se usuário é owner ou admin
        if (req.usuario.id !== pedido.usuarioId && req.usuario.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const resultado = await service.cancelar(id);

        res.json({
            success: true,
            message: 'Pedido cancelado com sucesso',
            data: resultado
        });
    } catch (error: any) {
        console.error('Erro ao cancelar pedido:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/pedidos/admin/todos
// Listar todos os pedidos COM PAGINAÇÃO (admin)
// ========================================
router.get('/admin/todos', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const page = req.query.page ? parseInt(req.query.page as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const status = req.query.status as string;
        const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
        const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;

        // Se não tem paginação, usa método sem paginação
        if (!page && !limit) {
            const pedidos = await service.listarTodos({ status, dataInicio, dataFim });
            return res.json({
                success: true,
                data: pedidos
            });
        }

        // Com paginação
        const resultado = await service.listarTodosComPaginacao({
            page,
            limit,
            status,
            dataInicio,
            dataFim
        });

        res.json({
            success: true,
            data: resultado.pedidos,
            pagination: resultado.pagination
        });
    } catch (error: any) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/pedidos/admin/estatisticas
// Obter estatísticas (admin)
// ========================================
router.get('/admin/estatisticas', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const stats = await service.obterEstatisticas();

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
