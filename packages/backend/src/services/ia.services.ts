import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class AIService {

    // ✅ Processar mensagem com IA
    async processarMensagem(telefone: string, mensagem: string): Promise<string> {
        try {
            // Buscar contexto da conversa (últimas 10 mensagens)
            const historico = await this.buscarHistorico(telefone);

            // Buscar cardápio disponível
            const cardapio = await this.buscarCardapio();

            // Criar prompt para a IA
            const systemPrompt = this.criarPromptSistema(cardapio);

            // Chamar OpenAI GPT-4
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...historico,
                    { role: 'user', content: mensagem }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const resposta = completion.choices[0].message.content || 'Desculpe, não entendi.';

            // Salvar conversa no histórico
            await this.salvarMensagem(telefone, mensagem, resposta);

            // Verificar se é um pedido completo
            await this.detectarPedido(telefone, mensagem, resposta);

            return resposta;

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            return 'Desculpe, ocorreu um erro. Tente novamente.';
        }
    }

    // ✅ Criar prompt do sistema
    private criarPromptSistema(cardapio: string): string {
        return `Você é um atendente virtual da Pizzaria Bambinos.

SEU PAPEL:
- Atender clientes pelo WhatsApp de forma amigável e profissional
- Ajudar a fazer pedidos de pizza
- Responder dúvidas sobre o cardápio, preços e entrega
- Coletar: sabor da pizza, tamanho, endereço de entrega e forma de pagamento

CARDÁPIO DISPONÍVEL:
${cardapio}

REGRAS:
1. Seja cordial e use emojis 🍕
2. Confirme TODOS os dados do pedido antes de finalizar
3. Pergunte o endereço completo de entrega
4. Ofereça bebidas e sobremesas
5. Informe que o tempo de entrega é de 45-60 minutos
6. Quando o pedido estiver completo, diga "PEDIDO_CONFIRMADO" no final da resposta

FORMAS DE PAGAMENTO:
- Dinheiro
- Cartão na entrega
- PIX

Responda em português brasileiro de forma natural e amigável.`;
    }

    // ✅ Buscar cardápio
    private async buscarCardapio(): Promise<string> {
        const produtos = await prisma.produto.findMany({
            where: { ativo: true },
            include: { itensPedidos: false }
        });

        const tamanhos = await prisma.tamanho.findMany({
            where: { ativo: true }
        });

        let cardapio = '### PIZZAS ###\n';
        produtos.forEach(p => {
            cardapio += `- ${p.nome}: ${p.descricao || 'Pizza deliciosa'} - R$ ${p.preco.toFixed(2)}\n`;
        });

        cardapio += '\n### TAMANHOS ###\n';
        tamanhos.forEach(t => {
            cardapio += `- ${t.nome}: ${t.descricao || ''} - R$ ${t.preco.toFixed(2)}\n`;
        });

        return cardapio;
    }

    // ✅ Buscar histórico de conversa
    private async buscarHistorico(telefone: string): Promise<Array<{role: string, content: string}>> {
        // Implementar busca no banco ou Redis
        // Por enquanto retorna array vazio
        return [];
    }

    // ✅ Salvar mensagem no histórico
    private async salvarMensagem(telefone: string, mensagem: string, resposta: string) {
        // Implementar salvamento no banco ou Redis
        console.log(`[${telefone}] User: ${mensagem}`);
        console.log(`[${telefone}] Bot: ${resposta}`);
    }

    // ✅ Detectar e criar pedido automaticamente
    private async detectarPedido(telefone: string, mensagem: string, resposta: string) {
        if (resposta.includes('PEDIDO_CONFIRMADO')) {
            // Extrair dados do pedido usando IA
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{
                    role: 'user',
                    content: `Extraia os dados do pedido desta conversa em formato JSON:
                    
Conversa: ${mensagem}
Resposta: ${resposta}

Retorne APENAS o JSON no formato:
{
  "produtos": ["nome_produto"],
  "tamanho": "nome_tamanho",
  "endereco": "endereço completo",
  "pagamento": "forma de pagamento",
  "observacoes": "observações adicionais"
}`
                }],
                temperature: 0
            });

            try {
                const pedidoData = JSON.parse(completion.choices[0].message.content || '{}');

                // Buscar ou criar usuário pelo telefone
                let usuario = await prisma.usuario.findUnique({ where: { telefone } });

                if (!usuario) {
                    usuario = await prisma.usuario.create({
                        data: {
                            telefone,
                            nome: 'Cliente WhatsApp',
                            email: `${telefone}@whatsapp.temp`,
                            senha: 'whatsapp-temp',
                            papel: 'CLIENTE',
                            ativo: true
                        }
                    });
                }

                // Criar pedido no banco
                // Implementar lógica de criação de pedido
                console.log('Pedido detectado:', pedidoData);

            } catch (error) {
                console.error('Erro ao criar pedido:', error);
            }
        }
    }
}
