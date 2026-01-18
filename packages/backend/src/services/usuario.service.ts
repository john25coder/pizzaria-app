import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CriarUsuarioDTO, AtualizarUsuarioDTO, Usuario } from '../types/auth.types';

const prisma = new PrismaClient();

export class UsuarioService {
    // ✅ Criar usuário
    async criar(dados: CriarUsuarioDTO): Promise<Usuario> {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { email: dados.email }
        });

        if (usuarioExiste) {
            throw new Error('Esse email já está cadastrado');
        }

        const senhaHash = await bcrypt.hash(dados.senha, 10);

        const usuario = await prisma.usuario.create({
            data: {
                email: dados.email,
                senha: senhaHash,
                nome: dados.nome,
                telefone: dados.telefone,
                papel: 'CLIENTE',
                ativo: true
            }
        });

        return this.removerSenha(usuario) as Usuario;
    }

    // ✅ Listar todos
    async listarTodos(filtros?: {
        papel?: string;
        ativo?: boolean;
    }): Promise<Usuario[]> {
        const usuarios = await prisma.usuario.findMany({
            where: {
                papel: filtros?.papel as any,
                ativo: filtros?.ativo
            }
        });

        return usuarios.map(u => this.removerSenha(u)) as Usuario[];
    }

    // ✅ Buscar por ID
    async buscarPorId(id: string): Promise<Usuario> {
        const usuario = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        return this.removerSenha(usuario) as Usuario;
    }

    // ✅ Buscar por email
    async buscarPorEmail(email: string) {
        return await prisma.usuario.findUnique({
            where: { email }
        });
    }

    // ✅ Atualizar usuário
    async atualizar(id: string, dados: AtualizarUsuarioDTO): Promise<Usuario> {
        const usuario = await prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        if (dados.email && dados.email !== usuario.email) {
            const emailExiste = await prisma.usuario.findUnique({
                where: { email: dados.email }
            });

            if (emailExiste) {
                throw new Error('Esse email já está sendo usado');
            }
        }

        const atualizado = await prisma.usuario.update({
            where: { id },
            data: dados
        });

        return this.removerSenha(atualizado) as Usuario;
    }

    // ✅ Atualizar papel
    async atualizarPapel(id: string, papel: string): Promise<Usuario> {
        const usuario = await prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        const atualizado = await prisma.usuario.update({
            where: { id },
            data: { papel: papel as any }
        });

        return this.removerSenha(atualizado) as Usuario;
    }

    // ✅ Alternar ativo
    async alternarAtivo(id: string): Promise<Usuario> {
        const usuario = await prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        const atualizado = await prisma.usuario.update({
            where: { id },
            data: { ativo: !usuario.ativo }
        });

        return this.removerSenha(atualizado) as Usuario;
    }

    // ✅ Deletar usuário
    async deletar(id: string): Promise<void> {
        const usuario = await prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        // Verificar se tem pedidos em aberto
        const pedidosAbertos = await prisma.pedido.count({
            where: {
                usuarioId: id,
                status: { in: ['PENDENTE', 'EM_PREPARO', 'PRONTO'] }
            }
        });

        if (pedidosAbertos > 0) {
            throw new Error('Não é possível deletar usuário com pedidos em aberto');
        }

        await prisma.usuario.delete({ where: { id } });
    }

    // ✅ Resetar senha
    async resetarSenha(id: string, novaSenha: string): Promise<void> {
        const usuario = await prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new Error(`Usuário ${id} não encontrado`);
        }

        const senhaHash = await bcrypt.hash(novaSenha, 10);

        await prisma.usuario.update({
            where: { id },
            data: { senha: senhaHash }
        });
    }

    // ✅ Verificar senha
    async verificarSenha(senha: string, senhaHash: string): Promise<boolean> {
        return await bcrypt.compare(senha, senhaHash);
    }

    // ✅ Remover senha do objeto
    private removerSenha(usuario: any) {
        const { senha, ...usuarioSemSenha } = usuario;
        return usuarioSemSenha;
    }
}
