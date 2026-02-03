import jwt from 'jsonwebtoken';

// ✅ Pegar secret do ambiente (ou usar fallback para desenvolvimento)
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';
const JWT_EXPIRES_IN = '7d'; // Token expira em 7 dias

// ✅ Interface para o payload do token
export interface TokenPayload {
    id: string;
    email: string;
    papel: 'CLIENTE' | 'ADMIN';
}

// ✅ Gerar token JWT
export function gerarToken(usuarioId: string, email?: string, papel?: 'CLIENTE' | 'ADMIN'): string {
    const payload: any = {
        id: usuarioId
    };

    if (email) payload.email = email;
    if (papel) payload.papel = papel;

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

// ✅ Verificar e decodificar token
export function verificarToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        throw new Error('Token inválido ou expirado');
    }
}

// ✅ Decodificar token sem verificar (útil para debug)
export function decodificarToken(token: string): any {
    return jwt.decode(token);
}
