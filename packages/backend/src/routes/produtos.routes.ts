import { Router, Request, Response } from 'express';
import { ProdutosService } from '../services/produtos.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { CriarProdutoDTO } from '../types/dtos';
import { validar } from '../util/validation';
import { z } from 'zod';

const router = Router();
const service = new ProdutosService();

const produtoSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    descricao: z.string().optional(),
    preco: z.number().positive('Preço deve ser positivo'),
    imagem: z.string().optional()
});

// ========================================
// GET /api/produtos
// Listar todos os produtos
// ========================================

router.get('/', async (_req: Request, res: Response) => {
    try {
        const produtos = await service.listarTodos();
        res.json({
            success: true,
            data: produtos
        });
    } catch (error: any) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/produtos/:id
// Buscar produto por ID
// ========================================

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const produto = await service.buscarPorId(id);
        res.json({
            success: true,
            data: produto
        });
    } catch (error: any) {
        console.error('Erro ao buscar produto:', error);
        res.status(404).json({ error: error.message });
    }
});

// ========================================
// POST /api/produtos
// Criar novo produto (apenas admin)
// ========================================

router.post('/', autenticar, async (req: Request, res: Response) => {
    try {
        const dados = await validar<CriarProdutoDTO>(produtoSchema, req.body as unknown);
        const produto = await service.criar(dados);
        res.status(201).json({
            success: true,
            data: produto
        });
    } catch (error: any) {
        console.error('Erro ao criar produto:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// PUT /api/produtos/:id
// Atualizar produto (apenas admin)
// ========================================

router.put('/:id', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const dados = await validar<Partial<CriarProdutoDTO>>(
            produtoSchema.partial(),
            req.body as unknown
        );
        const produto = await service.atualizar(id, dados);
        res.json({
            success: true,
            data: produto
        });
    } catch (error: any) {
        console.error('Erro ao atualizar produto:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// DELETE /api/produtos/:id
// Deletar produto (apenas admin)
// ========================================
router.delete('/:id', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const resultado = await service.deletar(id);
        res.json(resultado); // ✅ Só retorna o resultado
    } catch (error: any) {
        console.error('Erro ao deletar produto:', error);
        res.status(400).json({ error: error.message });
    }
});


// ========================================
// PATCH /api/produtos/:id/toggle
// Alternar ativo/inativo (apenas admin)
// ========================================

router.patch('/:id/toggle', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const produto = await service.alternarAtivo(id);
        res.json({
            success: true,
            data: produto
        });
    } catch (error: any) {
        console.error('Erro ao alternar ativo:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// GET /api/produtos/search
// Buscar com filtros
// ========================================

router.get('/search', async (req: Request, res: Response) => {
    try {
        const { ativo, busca } = req.query;
        const produtos = await service.buscarComFiltros({
            ativo: ativo ? ativo === 'true' : undefined,
            busca: busca as string
        });
        res.json({
            success: true,
            data: produtos
        });
    } catch (error: any) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
