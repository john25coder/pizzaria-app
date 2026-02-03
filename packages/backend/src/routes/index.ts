import { Router } from 'express';
import authRoutes from '../routes/auth.routes';
import produtosRoutes from '../routes/produtos.routes';
import tamanhosRoutes from '../routes/tamanhos.routes';
import pedidosRoutes from '../routes/pedidos.routes';
import pagamentosRoutes from '../routes/pagamentos.routes';
import healthRoutes from '../routes/health.routes';
import clientesRoutes from './cliente.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/produtos', produtosRoutes);
router.use('/tamanhos', tamanhosRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/pagamentos', pagamentosRoutes);
router.use('/health', healthRoutes);
router.use('/clientes', clientesRoutes);

export default router;
