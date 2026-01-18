import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { securityHeaders, limiterAPI } from './middlewares/security.middleware';
import pagamentoRoutes from './routes/pagamentos.routes';

const app: Express = express();

// ========================================
// MIDDLEWARES DE SEGURANÇA
// ========================================

app.use(securityHeaders);
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// ✅ IMPORTANTE: Raw body para Stripe webhook
app.post('/api/pagamentos/webhook', express.raw({ type: 'application/json' }));

// ✅ JSON Parser (depois do webhook)
app.use(express.json());

app.use(limiterAPI);

// ========================================
// ROTAS
// ========================================

app.use('/api', routes);
app.use('/api/pagamentos', pagamentoRoutes); // ✅ NOVO

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'API Pizzaria - Bem-vindo!',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            produtos: '/api/produtos',
            pedidos: '/api/pedidos',
            pagamentos: '/api/pagamentos',
            tamanhos: '/api/tamanhos'
        }
    });
});

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: _req.path
    });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Erro:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`💳 Sistema de Pagamento: ATIVO (Stripe)`);
});
