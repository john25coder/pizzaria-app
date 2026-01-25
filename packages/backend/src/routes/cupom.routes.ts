// packages/backend/src/routes/cupons.routes.ts
import { Router, Response } from 'express';
import { CupomService } from '../services/cupom.sevices';
import { autenticar } from '../middlewares/auth.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const service = new CupomService();

// ========================================
// POST /api/cupons/validar
// Validar cupom por código (cliente)
// ========================================
router.post('/validar', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { codigo } = req.body;

        if (!codigo || typeof codigo !== 'string') {
            return res.status(400).json({ error: 'Código do cupom é obrigatório' });
        }

        const resultado = await service.validarPorCodigo(codigo);

        if (!resultado.valido) {
            return res.status(400).json({
                valido: false,
                mensagem: resultado.mensagem
            });
        }

        // Retornar dados do cupom sem expor ID
        res.json({
            valido: true,
            mensagem: resultado.mensagem,
            cupom: {
                id: resultado.cupom!.id,
                codigo: resultado.cupom!.codigo,
                desconto: resultado.cupom!.desconto,
                tipo: resultado.cupom!.tipo
            }
        });
    } catch (error: any) {
        console.error('Erro ao validar cupom:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// POST /api/cupons
// Criar novo cupom (admin)
// ========================================
router.post('/', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas admins podem criar cupons' });
        }

        const { codigo, desconto, tipo, validade, usoMaximo } = req.body;

        // Validações básicas
        if (!codigo || !desconto || !tipo) {
            return res.status(400).json({
                error: 'Campos obrigatórios: codigo, desconto, tipo'
            });
        }

        const cupom = await service.criar({
            codigo,
            desconto: parseFloat(desconto),
            tipo,
            validade: validade ? new Date(validade) : undefined,
            usoMaximo: usoMaximo ? parseInt(usoMaximo) : undefined
        });

        res.status(201).json({
            success: true,
            message: 'Cupom criado com sucesso',
            data: cupom
        });
    } catch (error: any) {
        console.error('Erro ao criar cupom:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/cupons
// Listar todos os cupons (admin)
// ========================================
router.get('/', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const cupons = await service.listarTodos();

        res.json({
            success: true,
            data: cupons
        });
    } catch (error: any) {
        console.error('Erro ao listar cupons:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/cupons/:id
// Buscar cupom por ID (admin)
// ========================================
router.get('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const cupom = await service.buscarPorId(id);

        res.json({
            success: true,
            data: cupom
        });
    } catch (error: any) {
        console.error('Erro ao buscar cupom:', error);
        res.status(404).json({ error: error.message });
    }
});

// ========================================
// PATCH /api/cupons/:id
// Atualizar cupom (admin)
// ========================================
router.patch('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const cupom = await service.atualizar(id, req.body);

        res.json({
            success: true,
            message: 'Cupom atualizado com sucesso',
            data: cupom
        });
    } catch (error: any) {
        console.error('Erro ao atualizar cupom:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// DELETE /api/cupons/:id
// Desativar cupom (admin)
// ========================================
router.delete('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const cupom = await service.desativar(id);

        res.json({
            success: true,
            message: 'Cupom desativado com sucesso',
            data: cupom
        });
    } catch (error: any) {
        console.error('Erro ao desativar cupom:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/cupons/:id/estatisticas
// Obter estatísticas de uso (admin)
// ========================================
router.get('/:id/estatisticas', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Verificar se é admin
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const stats = await service.obterEstatisticas(id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;

