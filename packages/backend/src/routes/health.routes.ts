import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ========================================
// GET /api/health
// Health check básico
// ========================================

router.get('/', async (_req: Request, res: Response) => {
    try {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Erro no health check:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            message: 'Health check failed'
        });
    }
});

// ========================================
// GET /api/health/db
// Verificar conexão com banco de dados
// ========================================

router.get('/db', async (_req: Request, res: Response) => {
    try {
        // ✅ Testar conexão com banco
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao conectar com banco:', error);
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            timestamp: new Date().toISOString(),
            error: 'Falha ao conectar com o banco de dados'
        });
    }
});

// ========================================
// GET /api/health/detailed
// Health check detalhado
// ========================================

router.get('/detailed', async (_req: Request, res: Response) => {
    try {
        // ✅ Testar conexão com banco
        await prisma.$queryRaw`SELECT 1`;

        // ✅ Contar registros nas tabelas principais
        const usuariosCount = await prisma.usuario.count();
        const produtosCount = await prisma.produto.count();
        const pedidosCount = await prisma.pedido.count();
        const tamanhosCount = await prisma.tamanho.count();

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: 'Connected',
                usuario: usuariosCount,
                produtos: produtosCount,
                pedidos: pedidosCount,
                tamanhos: tamanhosCount
            },
            api: {
                name: 'Pizzaria API',
                version: '1.0.0',
                nodejs: process.version
            }
        });
    } catch (error) {
        console.error('Erro no health check detalhado:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
