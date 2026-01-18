import { Request } from 'express';

// ✅ Request Autenticada
export interface AuthenticatedRequest extends Request {
    usuario?: {
        id: string;
        email: string;
        papel: 'CLIENTE' | 'ADMIN';
    };
}

// ✅ DTO para Criação de Usuário
export interface CriarUsuarioDTO {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    cpf?: string;
}

// ✅ DTO para Login (se não tiver em outro lugar)
export interface LoginDTO {
    email: string;
    senha: string;
}

// ✅ DTO para Atualização
export interface AtualizarUsuarioDTO {
    nome?: string;
    telefone?: string;
    email?: string;
}

// ✅ Interface do Modelo Usuário
export interface Usuario {
    id: string;
    email: string;
    nome: string;
    telefone?: string | null;
    cpf?: string | null;
    papel: 'CLIENTE' | 'ADMIN';
    ativo?: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
}
