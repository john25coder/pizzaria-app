import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './index';
import { securityHeaders, limiterAPI } from '../middlewares/security.middleware';

const app: Express = express();

// ========================================
// MIDDLEWARES DE SEGURANÇA
// ========================================

// ✅ Helmet - Headers de segurança HTTP
app.use(securityHeaders);

// ✅ CORS - Proteção contra requisições indevidas
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// ✅ JSON Parser
app.use(express.json());

// ✅ Rate Limiting Global
app.use(limiterAPI);

// ========================================
// ROTAS
// ========================================

app.use('/api', routes);

// Rota raiz
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'API Pizzaria - Bem-vindo!',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            produtos: '/api/produtos',
            pedidos: '/api/pedidos',
            tamanhos: '/api/tamanhos'
        }
    });
});

// ========================================
// TRATAMENTO DE ERROS 404
// ========================================

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: _req.path
    });
});

// ========================================
// TRATAMENTO DE ERROS GLOBAL
// ========================================

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
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Segurança: ATIVADA (Helmet + Rate Limiting + Validação)`);
});
