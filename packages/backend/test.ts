import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🍕 Testando conexão com o banco...\n');

    const tamanhos = await prisma.tamanho.findMany();
    console.log('📏 Tamanhos:', tamanhos);

    const pizzasClassicas = await prisma.produto.findMany({
        where: { categoriaId: 1 },
        take: 5
    });
    console.log('\n🍕 Primeiras 5 pizzas clássicas:', pizzasClassicas.map(p => p.nome));
}

main()
    .then(() => {
        console.log('\n✅ Sucesso!');
        prisma.$disconnect();
    })
    .catch((e) => {
        console.error('❌ Erro:', e);
        prisma.$disconnect();
    });
