import { Router, Request, Response } from 'express';
import { PedidosService } from '../services/pedido.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';
import { validar } from '../util/validation';
import { z } from 'zod';

const router = Router();
const service = new PedidosService();

const criarPedidoSchema = z.object({
    itens: z.array(z.object({
        produtoId: z.string(),
        tamanhoId: z.string(),
        quantidade: z.number().positive()
    })).min(1, 'Pedido deve ter pelo menos um item'),
    observacoes: z.string().optional(),
    enderecoEntrega: z.string().min(10, 'Endereço inválido')
});

// ========================================
// POST /api/pedidos
// Criar novo pedido (cliente autenticado)
// ========================================

// ========================================
// POST /api/pedidos
// Criar novo pedido (cliente autenticado)
// ========================================

router.post('/', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // ✅ ADICIONE: as unknown
        const dados = await validar(criarPedidoSchema, req.body as unknown);

        // @ts-ignore
        const pedido = await service.criar({
            usuarioId: req.usuario.id,
            itens: dados.itens,
            observacoes: dados.observacoes,
            enderecoEntrega: dados.enderecoEntrega
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
});


// ========================================
// GET /api/pedidos/meus-pedidos
// Listar pedidos do usuário logado
// ========================================

router.get('/meus-pedidos', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const pedidos = await service.listarPorUsuario(req.usuario.id);

        res.json({
            success: true,
            data: pedidos
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

        // ✅ Verificar se usuário é owner ou admin
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
        // ✅ Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas admins podem atualizar status' });
        }

        const { id } = req.params;
        const { status } = req.body as { status: string }; // ✅ Type assertion

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

        // ✅ Verificar se usuário é owner ou admin
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
// Listar todos os pedidos (admin)
// ========================================

router.get('/admin/todos', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { status, dataInicio, dataFim } = req.query as {
            status?: string;
            dataInicio?: string;
            dataFim?: string;
        }; // ✅ Type assertion

        const pedidos = await service.listarTodos({
            status,
            dataInicio: dataInicio ? new Date(dataInicio) : undefined,
            dataFim: dataFim ? new Date(dataFim) : undefined
        });

        res.json({
            success: true,
            data: pedidos
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
