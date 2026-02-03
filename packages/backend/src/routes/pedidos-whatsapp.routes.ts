import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/pedidos/whatsapp
router.post('/whatsapp', async (req: Request, res: Response) => {
    try {
        const { telefone, mensagemCliente, respostaIA } = req.body;

        if (!telefone || !mensagemCliente || !respostaIA) {
            return res.status(400).json({ error: 'Dados incompletos do pedido WhatsApp' });
        }

        const telefoneLimpo = String(telefone).replace('@c.us', '');

        let usuario = await prisma.usuario.findUnique({
            where: { telefone: telefoneLimpo }
        });

        if (!usuario) {
            usuario = await prisma.usuario.create({
                data: {
                    telefone: telefoneLimpo,
                    nome: 'Cliente WhatsApp',
                    email: `${telefoneLimpo}@whatsapp.local`,
                    senha: 'senha-temporaria',
                    papel: 'CLIENTE',
                    ativo: true
                }
            });
        }

        console.log('📥 Novo pedido WhatsApp:');
        console.log('Usuário:', usuario.id, telefoneLimpo);
        console.log('Mensagem:', mensagemCliente);
        console.log('Resposta IA:', respostaIA);

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error('Erro ao tratar pedido WhatsApp:', error);
        return res.status(500).json({ error: 'Erro ao tratar pedido WhatsApp' });
    }
});

export default router;
