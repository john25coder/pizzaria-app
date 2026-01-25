// packages/backend/src/schemas/pedido.schema.ts
import { z } from 'zod';

export const criarPedidoSchema = z.object({
    body: z.object({
        itens: z.array(
            z.object({
                produtoId: z.string().min(1, "ID do produto é obrigatório"),
                tamanhoId: z.string().min(1, "ID do tamanho é obrigatório"),
                quantidade: z.number().int().positive().default(1)
            })
        ).min(1, "O pedido deve conter pelo menos um item"),
        observacoes: z.string().optional(),
        enderecoEntrega: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres").optional(),
        cupomId: z.string().optional()
    })
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>['body'];
