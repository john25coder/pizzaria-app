// packages/backend/src/routes/produtos.routes.ts
import { Router, Response } from 'express';
import { ProdutosService } from '../services/produtos.services';
import { UploadService } from '../services/upload.services';
import { autenticar } from '../middlewares/auth.middlewares';
import { upload } from '../middlewares/upload.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const service = new ProdutosService();
const uploadService = new UploadService();

// ========================================
// GET /api/produtos
// Listar produtos com paginação (público)
// ========================================
router.get('/', async (req, res: Response) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const busca = req.query.busca as string | undefined;
        const ativo = req.query.ativo === 'true' ? true : req.query.ativo === 'false' ? false : undefined;

        const resultado = await service.listarComPaginacao({
            page,
            limit,
            busca,
            ativo
        });

        res.json({
            success: true,
            data: resultado.produtos,
            pagination: resultado.pagination
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GET /api/produtos/:id
// Buscar produto por ID (público)
// ========================================
router.get('/:id', async (req, res: Response) => {
    try {
        const { id } = req.params;
        const produto = await service.buscarPorId(id);
        res.json({
            success: true,
            data: produto
        });
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

// ========================================
// POST /api/produtos
// Criar produto com imagem (admin)
// ========================================
router.post(
    '/',
    autenticar,
    upload.single('imagem'),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (req.usuario?.papel !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { nome, descricao, preco } = req.body;

            if (!nome || !preco) {
                return res.status(400).json({
                    error: 'Nome e preço são obrigatórios'
                });
            }

            let imagemUrl: string | undefined;
            if (req.file) {
                imagemUrl = await uploadService.upload(req.file);
            }

            const produto = await service.criar({
                nome,
                descricao: descricao || undefined,
                preco: parseFloat(preco),
                imagem: imagemUrl
            });

            res.status(201).json({
                success: true,
                message: 'Produto criado com sucesso',
                data: produto
            });

        } catch (error: any) {
            console.error('Erro ao criar produto:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// ========================================
// PATCH /api/produtos/:id
// Atualizar produto (admin)
// ========================================
router.patch(
    '/:id',
    autenticar,
    upload.single('imagem'),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (req.usuario?.papel !== 'ADMIN') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { id } = req.params;
            const { nome, descricao, preco, ativo } = req.body;

            const produtoAtual = await service.buscarPorId(id);

            let imagemUrl = produtoAtual.imagem || undefined;

            if (req.file) {
                if (produtoAtual.imagem) {
                    try {
                        await uploadService.deletarDoS3(produtoAtual.imagem);
                    } catch (error) {
                        console.warn('Não foi possível deletar imagem antiga');
                    }
                }
                imagemUrl = await uploadService.upload(req.file);
            }

            const produtoAtualizado = await service.atualizar(id, {
                nome: nome || undefined,
                descricao: descricao !== undefined ? descricao : undefined,
                preco: preco ? parseFloat(preco) : undefined,
                imagem: imagemUrl,
                ativo: ativo !== undefined ? ativo === 'true' || ativo === true : undefined
            });

            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                data: produtoAtualizado
            });

        } catch (error: any) {
            console.error('Erro ao atualizar produto:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// ========================================
// DELETE /api/produtos/:id
// Deletar produto (admin)
// ========================================
router.delete('/:id', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;

        const produto = await service.buscarPorId(id);

        await service.deletar(id);

        if (produto.imagem) {
            try {
                await uploadService.deletarDoS3(produto.imagem);
            } catch (error) {
                console.warn('Não foi possível deletar imagem');
            }
        }

        res.json({
            success: true,
            message: 'Produto deletado com sucesso'
        });

    } catch (error: any) {
        console.error('Erro ao deletar produto:', error);
        res.status(400).json({ error: error.message });
    }
});

// ========================================
// PATCH /api/produtos/:id/ativar
// Ativar/Desativar produto (admin)
// ========================================
router.patch('/:id/ativar', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.usuario?.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const { ativo } = req.body;

        if (typeof ativo !== 'boolean') {
            return res.status(400).json({ error: 'Campo ativo deve ser boolean' });
        }

        const produto = await service.atualizar(id, { ativo });

        res.json({
            success: true,
            message: `Produto ${ativo ? 'ativado' : 'desativado'} com sucesso`,
            data: produto
        });

    } catch (error: any) {
        console.error('Erro ao ativar/desativar produto:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
