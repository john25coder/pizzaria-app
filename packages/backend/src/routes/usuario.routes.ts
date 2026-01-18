import { Router, Response } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { autenticar, autorizarAdmin } from '../middlewares/auth.middlewares';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();
const controller = new UsuarioController();

// ✅ Listar todos (ADMIN)
router.get(
    '/',
    autenticar,
    autorizarAdmin,
    (req: AuthenticatedRequest, res: Response) => controller.listarTodos(req, res)
);

// ✅ Buscar por ID
router.get(
    '/:id',
    autenticar,
    (req: AuthenticatedRequest, res: Response) => controller.buscarPorId(req, res)
);

// ✅ Atualizar papel (ADMIN)
router.patch(
    '/:id/papel',
    autenticar,
    autorizarAdmin,
    (req: AuthenticatedRequest, res: Response) => controller.atualizarPapel(req, res)
);

// ✅ Alternar ativo (ADMIN)
router.patch(
    '/:id/ativo',
    autenticar,
    autorizarAdmin,
    (req: AuthenticatedRequest, res: Response) => controller.alternarAtivo(req, res)
);

// ✅ Resetar senha (ADMIN)
router.post(
    '/:id/resetar-senha',
    autenticar,
    autorizarAdmin,
    (req: AuthenticatedRequest, res: Response) => controller.resetarSenha(req, res)
);

// ✅ Deletar (ADMIN)
router.delete(
    '/:id',
    autenticar,
    autorizarAdmin,
    (req: AuthenticatedRequest, res: Response) => controller.deletar(req, res)
);

export default router;
