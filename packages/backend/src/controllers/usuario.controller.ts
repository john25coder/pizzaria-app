import { Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { AuthenticatedRequest } from '../types/auth.types';

const service = new UsuarioService();

export class UsuarioController {
    // ✅ Listar todos (ADMIN)
    async listarTodos(req: AuthenticatedRequest, res: Response) {
        try {
            const { papel, ativo } = req.query;

            const usuarios = await service.listarTodos({
                papel: papel as string | undefined,
                ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined
            });

            res.json({
                success: true,
                data: usuarios,
                count: usuarios.length
            });
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }

    // ✅ Buscar por ID
    async buscarPorId(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const usuario = await service.buscarPorId(id);

            res.json({
                success: true,
                data: usuario
            });
        } catch (error: any) {
            console.error('Erro ao buscar usuário:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: 'Erro ao buscar usuário' });
        }
    }

    // ✅ Atualizar papel (ADMIN)
    async atualizarPapel(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const { papel } = req.body;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            if (!papel || !['CLIENTE', 'ADMIN'].includes(papel)) {
                return res.status(400).json({
                    error: 'Papel inválido. Válidos: CLIENTE, ADMIN'
                });
            }

            const usuario = await service.atualizarPapel(id, papel);

            res.json({
                success: true,
                data: usuario,
                message: 'Papel atualizado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao atualizar papel:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao atualizar papel' });
        }
    }

    // ✅ Alternar ativo (ADMIN)
    async alternarAtivo(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const usuario = await service.alternarAtivo(id);

            res.json({
                success: true,
                data: usuario,
                message: `Usuário ${usuario.ativo ? 'ativado' : 'desativado'} com sucesso`
            });
        } catch (error: any) {
            console.error('Erro ao alternar ativo:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao alternar ativo' });
        }
    }

    // ✅ Deletar usuário (ADMIN)
    async deletar(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            await service.deletar(id);

            res.json({
                success: true,
                message: 'Usuário deletado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao deletar usuário:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            if (error.message.includes('em aberto')) {
                return res.status(400).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao deletar usuário' });
        }
    }

    // ✅ Resetar senha (ADMIN)
    async resetarSenha(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const { novaSenha } = req.body;

            if (!id || id.trim() === '') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            if (!novaSenha || typeof novaSenha !== 'string' || novaSenha.length < 8) {
                return res.status(400).json({
                    error: 'Nova senha deve ter no mínimo 8 caracteres'
                });
            }

            if (!this.validarForcaSenha(novaSenha)) {
                return res.status(400).json({
                    error: 'Senha deve conter maiúscula, minúscula, número e caractere especial'
                });
            }

            await service.resetarSenha(id, novaSenha);

            res.json({
                success: true,
                message: 'Senha resetada com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao resetar senha:', error);

            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }

            res.status(400).json({ error: error.message || 'Erro ao resetar senha' });
        }
    }

    // ✅ Validar força da senha
    private validarForcaSenha(senha: string): boolean {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(senha);
    }
}
