import { Router } from 'express';
import authRoutes from '../routes/auth.routes';
import produtosRoutes from '../routes/produtos.routes';
import tamanhosRoutes from '../routes/tamanhos.routes';
import pedidosRoutes from '../routes/pedidos.routes';
import pagamentosRoutes from '../routes/pagamentos.routes';
import healthRoutes from '../routes/health.routes';
import clientesRoutes from './cliente.routes';
import whatsappRoutes from '../routes/whatsapp.routes';
import pedidosWhatsappRoutes from '../routes/pedidos-whatsapp.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/produtos', produtosRoutes);
router.use('/tamanhos', tamanhosRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/pagamentos', pagamentosRoutes);
router.use('/health', healthRoutes);
router.use('/clientes', clientesRoutes);

// ✅ rotas do WhatsApp
router.use('/whatsapp', whatsappRoutes);

// ✅ pedidos vindos do bot do WhatsApp
router.use('/pedidos/whatsapp', pedidosWhatsappRoutes);

export default router;
