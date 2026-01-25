// packages/backend/src/schemas/pedido.schema.ts
import { z } from 'zod';

export const criarPedidoSchema = z.object({
    body: z.object({
        itens: z.array(
            z.object({
                produtoId: z.string({ required_error: "ID do produto é obrigatório" }),
                tamanhoId: z.string({ required_error: "ID do tamanho é obrigatório" }),
                quantidade: z.number().int().positive("Quantidade deve ser positiva").default(1)
            })
        ).min(1, "O pedido deve conter pelo menos um item"),
        observacoes: z.string().optional(),
        enderecoEntrega: z.string().min(5, "Endereço deve ser completo").optional(), // Opcional se for usar o do cadastro
        cupomId: z.string().optional()
    })
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>['body'];
