import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();

// ========================================
// IMPORTANTE: Webhook precisa de rawBody
// ========================================
app.use('/api/pagamentos/webhook',
    express.raw({ type: 'application/json' })
);

// ========================================
// Middlewares gerais
// ========================================
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// Rotas
// ========================================
app.use('/api', routes);

// ========================================
// Health check
// ========================================
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// Iniciar servidor
// ========================================
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

export default app;
