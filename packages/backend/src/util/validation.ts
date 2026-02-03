import { z } from 'zod';

// ✅ Schemas de validação com Zod
export const emailSchema = z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim();

export const cpfSchema = z
    .string()
    .min(11, 'CPF inválido')
    .max(14, 'CPF inválido')
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'Formato de CPF inválido');

export const senhaSchema = z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[@$!%*?&]/, 'Senha deve conter pelo menos um caractere especial (@$!%*?&)');

// ✅ Schema de login (aceita email OU cpf)
export const loginSchema = z.object({
    email: emailSchema.optional(),
    cpf: cpfSchema.optional(),
    senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
}).refine(data => data.email || data.cpf, {
    message: 'Email ou CPF é obrigatório',
    path: ['email']
});

// ✅ Schema de registro completo
export const registroSchema = z.object({
    email: emailSchema,
    cpf: cpfSchema.optional(),
    senha: senhaSchema,
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    telefone: z.string().min(10, 'Telefone inválido').optional()
});

// ✅ Função para validar com tipagem genérica
export async function validar<T>(schema: z.ZodSchema<T>, dados: unknown): Promise<T> {
    try {
        return (await schema.parseAsync(dados)) as T;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const primeiroErro = error.issues[0];
            throw new Error(primeiroErro.message);
        }
        throw error;
    }
}
