import { Router } from 'express';
import authRoutes from '../routes/auth.routes';
import produtosRoutes from '../routes/produtos.routes';
import tamanhosRoutes from '../routes/tamanhos.routes';
import pedidosRoutes from '../routes/pedidos.routes';
import healthRoutes from '../routes/health.routes';
import cuponsRoutes from '../routes/cupom.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/produtos', produtosRoutes);
router.use('/tamanhos', tamanhosRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/health', healthRoutes);
router.use('/cupons', cuponsRoutes);

export default router;

