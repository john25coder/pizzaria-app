import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/auth.middlewares';
import { UsuarioService } from '../services/usuario.service';
import { limiterLogin, limiterRegister } from '../middlewares/security.middleware';
import { registroSchema, loginSchema, validar } from '../util/validation';
import { AuthenticatedRequest } from '../types/auth.types';
import { CriarUsuarioDTO, LoginDTO } from '../types/dtos';

const router = Router();
const service = new UsuarioService();

// ========================================
// POST /api/auth/register
// Registrar novo usuário
// ========================================

router.post('/register', limiterRegister, async (req: Request, res: Response) => {
    try {
        // ✅ Validar dados com Zod
        const dados = await validar<CriarUsuarioDTO>(registroSchema, req.body as unknown);

        const usuario = await service.criar(dados);

        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso',
            data: { usuario }
        });
    } catch (error: any) {
        console.error('Erro ao registrar usuário:', error);

        if (error.message.includes('já está cadastrado')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(400).json({ error: error.message || 'Erro ao registrar usuário' });
    }
});

// ========================================
// POST /api/auth/login
// Login do usuário
// ========================================

router.post('/login', limiterLogin, async (req: Request, res: Response) => {
    try {
        // ✅ Validar dados com Zod
        const dados = await validar<LoginDTO>(loginSchema, req.body as unknown);

        // Buscar usuário pelo CPF ou email
        const usuario = await service.buscarPorCPF(dados.cpf);

        if (!usuario) {
            return res.status(401).json({ error: 'CPF ou senha inválidos' });
        }

        // Verificar senha (você deve ter um método para isso)
        const senhaValida = await service.verificarSenha(usuario.id, dados.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'CPF ou senha inválidos' });
        }

        // Verificar se usuário está ativo
        if (!usuario.ativo) {
            return res.status(403).json({ error: 'Usuário desativado' });
        }

        // Gerar token JWT (você precisa implementar isso)
        const token = gerarToken(usuario.id);

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    cpf: usuario.cpf,
                    telefone: usuario.telefone
                },
                token: token
            }
        });
    } catch (error: any) {
        console.error('Erro ao fazer login:', error);

        if (error.message.includes('não encontrado') || error.message.includes('inválida')) {
            return res.status(401).json({ error: 'CPF ou senha inválidos' });
        }

        if (error.message.includes('desativado')) {
            return res.status(403).json({ error: 'Usuário desativado' });
        }

        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// ========================================
// POST /api/auth/logout
// Logout do usuário
// ========================================

router.post('/logout', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

// ========================================
// GET /api/auth/me
// Obter dados do usuário autenticado
// ========================================

router.get('/me', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Buscar dados completos do usuário
        const usuario = await service.buscarPorId(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            data: {
                id: usuario.id,
                nome: usuario.nome,
                cpf: usuario.cpf,
                telefone: usuario.telefone,
                ativo: usuario.ativo
            }
        });
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        res.status(500).json({ error: 'Erro ao obter usuário' });
    }
});

// ========================================
// POST /api/auth/refresh
// Renovar token
// ========================================

router.post('/refresh', autenticar, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Gerar novo token
        const novoToken = gerarToken(req.usuario.id);

        res.json({
            success: true,
            message: 'Token renovado com sucesso',
            token: novoToken
        });
    } catch (error: any) {
        console.error('Erro ao renovar token:', error);
        res.status(500).json({ error: 'Erro ao renovar token' });
    }
});

// ========================================
// Função auxiliar para gerar token JWT
// ========================================

function gerarToken(usuarioId: number): string {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'bambinos_secret_key_2026';

    return jwt.sign(
        { id: usuarioId },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export default router;
