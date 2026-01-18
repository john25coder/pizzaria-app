import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    usuario?: {
        id: string;
        email: string;
        papel: 'CLIENTE' | 'ADMIN';
    };
}

export interface CriarUsuarioDTO {
    email: string;
    senha: string;
    nome: string;
    telefone?: string;
    cpf?: string;
}

export interface AtualizarUsuarioDTO {
    nome?: string;
    telefone?: string;
    email?: string;
}

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
