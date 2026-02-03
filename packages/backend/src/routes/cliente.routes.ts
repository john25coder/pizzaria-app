import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validação Zod
const loginClienteSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    phone: z.string().min(10, 'Telefone inválido'),
    address: z.string().min(5, 'Endereço inválido')
});

// ========================================
// POST /api/clientes/login
// Login ou criação de cliente simplificado (sem senha)
// ========================================
router.post('/login', async (req: Request, res: Response) => {
    try {
        // Validação com Zod
        const dadosValidados = loginClienteSchema.parse(req.body);

        // Limpar telefone (remover caracteres especiais)
        const phoneCleaned = dadosValidados.phone.replace(/\D/g, '');

        // Buscar cliente existente por telefone
        let cliente = await prisma.usuario.findFirst({
            where: { telefone: phoneCleaned },
            select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
                criadoEm: true
            }
        });

        if (cliente) {
            // Cliente já existe - atualizar nome se mudou
            if (cliente.nome !== dadosValidados.name) {
                cliente = await prisma.usuario.update({
                    where: { id: cliente.id },
                    data: { nome: dadosValidados.name },
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true,
                        criadoEm: true
                    }
                });
            }

            console.log('✅ Cliente existente autenticado:', cliente.nome);
        } else {
            // Criar novo cliente
            cliente = await prisma.usuario.create({
                data: {
                    nome: dadosValidados.name,
                    telefone: phoneCleaned,
                    email: `${phoneCleaned}@cliente.bambinos`,
                    senha: 'sem-senha-web',
                    papel: 'CLIENTE',
                    ativo: true
                },
                select: {
                    id: true,
                    nome: true,
                    telefone: true,
                    email: true,
                    criadoEm: true
                }
            });

            console.log('✅ Novo cliente criado:', cliente.nome);
        }

        // Retornar dados do cliente (SEM a senha)
        return res.status(200).json({
            id: cliente.id,
            name: cliente.nome,
            phone: cliente.telefone,
            address: dadosValidados.address,
            createdAt: cliente.criadoEm
        });
    } catch (error) {
        // Erro de validação Zod
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.issues.map((issue: z.ZodIssue) => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        console.error('❌ Erro no login de cliente:', error);
        return res.status(500).json({
            error: 'Erro ao processar login. Tente novamente.'
        });
    }
});

export default router;
