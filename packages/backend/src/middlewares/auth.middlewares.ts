import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
    usuario?: {
        id: string;
        email: string;
        papel: string;
    };
}

const prisma = new PrismaClient();

export async function autenticar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers?.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ error: 'Formato de token inválido' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET não configurado');
            return res.status(500).json({ error: 'Erro de configuração' });
        }

        const decoded = jwt.verify(token, jwtSecret) as any;

        if (!decoded.id) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, papel: true }
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.usuario = usuario;
        next();
    } catch (error: any) {
        console.error('Erro ao autenticar:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }

        res.status(401).json({ error: 'Falha na autenticação' });
    }
}

// ✅ NOVO: Middleware para verificar se é ADMIN
export async function autorizarAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        if (req.usuario.papel !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas admins podem acessar' });
        }

        next();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
