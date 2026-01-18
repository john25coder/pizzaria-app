import { Router, Request, Response } from 'express';
import { TamanhosService } from '../services/tamanhos.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { CriarTamanhoDTO } from '../types/dtos';
import { validar } from '../util/validation';
import { z } from 'zod';

const router = Router();
const service = new TamanhosService();

const tamanhoSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    descricao: z.string().optional(),
    preco: z.number().positive('Preço deve ser positivo')
});

// ========================================
// GET /api/tamanhos
// Listar todos os tamanhos
// ========================================

router.get('/', async (_req: Request, res: Response) => {
    try {
        const tamanhos = await service.listarTodos();
        res.json({
            success: true,
            data: tamanhos
        });
    } catch (error: any) {
        console.error('Erro ao listar tamanhos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/tamanhos/:id
// Buscar tamanho por ID
// ========================================

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tamanho = await service.buscarPorId(id);
        res.json({
            success: true,
            data: tamanho
        });
    } catch (error: any) {
        console.error('Erro ao buscar tamanho:', error);
        res.status(404).json({ error: error.message });
    }
});

// ========================================
// POST /api/tamanhos
// Criar novo tamanho (apenas admin)
// ========================================

router.post('/', autenticar, async (req: Request, res: Response) => {
    try {
        const dados = await validar<CriarTamanhoDTO>(tamanhoSchema, req.body as unknown);
        const tamanho = await service.criar(dados);
        res.status(201).json({
            success: true,
            data: tamanho
        });
    } catch (error: any) {
        console.error('Erro ao criar tamanho:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// PUT /api/tamanhos/:id
// Atualizar tamanho (apenas admin)
// ========================================

router.put('/:id', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const dados = await validar<Partial<CriarTamanhoDTO>>(
            tamanhoSchema.partial(),
            req.body as unknown
        );
        const tamanho = await service.atualizar(id, dados);
        res.json({
            success: true,
            data: tamanho
        });
    } catch (error: any) {
        console.error('Erro ao atualizar tamanho:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// DELETE /api/tamanhos/:id
// Deletar tamanho (apenas admin)
// ========================================

router.delete('/:id', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const resultado = await service.deletar(id);
        res.json(resultado); // ✅ Só retorna o resultado
    } catch (error: any) {
        console.error('Erro ao deletar tamanho:', error);
        res.status(400).json({ error: error.message });
    }
});


// ========================================
// PATCH /api/tamanhos/:id/toggle
// Alternar ativo/inativo (apenas admin)
// ========================================

router.patch('/:id/toggle', autenticar, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tamanho = await service.alternarAtivo(id);
        res.json({
            success: true,
            data: tamanho
        });
    } catch (error: any) {
        console.error('Erro ao alternar ativo:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
