// packages/backend/src/routes/pedidos.routes.ts
import { Router, Request, Response } from 'express'; // 🆕 Adicionar Request
import { PedidosService } from '../services/pedido.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { validate } from '../middlewares/validate.middlewares';
import { criarPedidoSchema } from '../schema/pedido.schema';
import { AuthenticatedRequest } from '../types/auth.types';
import { PrismaClient } from '@prisma/client';

const router = Router();
const service = new PedidosService();
const prisma = new PrismaClient(); // 🆕 Usar prisma diretamente

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

// ========================================
// POST /api/pedidos/web
// Criar pedido vindo do site (sem autenticação obrigatória)
// ========================================
router.post('/web', async (req: Request, res: Response) => {
    try {
        const { customerId, customer, items, deliveryFee, subtotal, total } = req.body;

        // Validações básicas
        if (!customer || !customer.name || !customer.phone || !customer.address) {
            return res.status(400).json({
                error: 'Dados do cliente são obrigatórios (name, phone, address)'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: 'Pedido precisa ter pelo menos 1 item'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                error: 'Total do pedido inválido'
            });
        }

        // Buscar ou criar cliente
        const phoneCleaned = customer.phone.replace(/\D/g, '');

        let cliente = await prisma.usuario.findFirst({
            where: { telefone: phoneCleaned }
        });

        if (!cliente) {
            cliente = await prisma.usuario.create({
                data: {
                    nome: customer.name,
                    telefone: phoneCleaned,
                    email: `${phoneCleaned}@cliente.bambinos`,
                    senha: 'sem-senha-web',
                    papel: 'CLIENTE',
                    ativo: true
                }
            });
        }

        // Montar observações detalhadas
        const observacoesDetalhadas = items.map((item: any, index: number) => {
            return `${index + 1}. ${item.size}
Sabores: ${item.flavors.join(', ')}
Borda: ${item.border}
Quantidade: ${item.quantity}x
Valor unitário: R$ ${item.unitPrice.toFixed(2)}
Subtotal: R$ ${(item.unitPrice * item.quantity).toFixed(2)}`;
        }).join('\n\n');

        // Criar pedido COM A SINTAXE CORRETA DO PRISMA
        const pedido = await prisma.pedido.create({
            data: {
                usuario: {
                    connect: { id: cliente.id }
                },
                status: 'PENDENTE',
                valorTotal: total,
                valorEntrega: deliveryFee,
                valorDesconto: 0,
                enderecoEntrega: customer.address,
                observacoes: `PEDIDO DO SITE WEB\n\n${observacoesDetalhadas}\n\nSubtotal: R$ ${subtotal.toFixed(2)}\nEntrega: R$ ${deliveryFee.toFixed(2)}\nTotal: R$ ${total.toFixed(2)}`,
                itens: {
                    create: items.map((item: any) => ({
                        quantidade: item.quantity,
                        precoUnitario: item.unitPrice,
                        observacoes: `${item.size} | Sabores: ${item.flavors.join(', ')} | Borda: ${item.border}`
                    }))
                }
            },
            include: {
                itens: true,
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true
                    }
                }
            }
        });

        console.log('📦 Novo pedido WEB criado:', {
            id: pedido.id,
            cliente: cliente.nome,
            telefone: cliente.telefone,
            endereco: customer.address,
            total: pedido.valorTotal,
            items: pedido.itens.length
        });

        return res.status(201).json({
            id: pedido.id,
            status: pedido.status,
            valorTotal: pedido.valorTotal,
            valorEntrega: pedido.valorEntrega,
            criadoEm: pedido.criadoEm,
            cliente: {
                nome: pedido.usuario.nome,
                telefone: pedido.usuario.telefone
            },
            items: pedido.itens
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido web:', error);
        return res.status(500).json({
            error: 'Erro ao processar pedido. Tente novamente.'
        });
    }
});

export default router;
