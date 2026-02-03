// ===== DADOS ESTRUTURADOS COM BASE NO CARDÁPIO REAL =====
const saboresData = {
    classicas: [
        { id: 1, name: 'Alho e Óleo', categoria: 'Clássicas' },
        { id: 2, name: 'Atum', categoria: 'Clássicas' },
        { id: 3, name: 'Bacon', categoria: 'Clássicas' },
        { id: 4, name: 'Bacon ao Alho e Óleo', categoria: 'Clássicas' },
        { id: 5, name: 'Bacon com Goiabada', categoria: 'Clássicas' },
        { id: 6, name: 'Brócolis', categoria: 'Clássicas' },
        { id: 7, name: 'Calabresa', categoria: 'Clássicas' },
        { id: 8, name: 'Calabresa Acebolada', categoria: 'Clássicas' },
        { id: 9, name: 'Calabresa com Catupiry', categoria: 'Clássicas' },
        { id: 10, name: 'Cenoura com Requeijão', categoria: 'Clássicas' },
        { id: 11, name: 'Champignon', categoria: 'Clássicas' },
        { id: 12, name: 'Frango com Barbecue', categoria: 'Clássicas' },
        { id: 13, name: 'Frango com Catupiry', categoria: 'Clássicas' },
        { id: 14, name: 'Margherita', categoria: 'Clássicas' },
        { id: 15, name: 'Milho', categoria: 'Clássicas' },
        { id: 16, name: 'Mussarela', categoria: 'Clássicas' },
        { id: 17, name: 'Palmito', categoria: 'Clássicas' },
        { id: 18, name: 'Portuguesa', categoria: 'Clássicas' },
        { id: 19, name: 'Presunto', categoria: 'Clássicas' },
        { id: 20, name: 'Provolone', categoria: 'Clássicas' },
        { id: 21, name: 'Quatro Queijo', categoria: 'Clássicas' }
    ],
    casa: [
        { id: 22, name: 'Bambinos', categoria: 'Da Casa' },
        { id: 23, name: 'Basca', categoria: 'Da Casa' },
        { id: 24, name: 'Carne de Panela com Barbecue', categoria: 'Da Casa' },
        { id: 25, name: 'Carne de Panela com Requeijão', categoria: 'Da Casa' },
        { id: 26, name: 'Coração', categoria: 'Da Casa' },
        { id: 27, name: 'Coração ao Molho Branco do Cheff', categoria: 'Da Casa' },
        { id: 28, name: 'Doritos Suprema', categoria: 'Da Casa' },
        { id: 29, name: 'Lombo', categoria: 'Da Casa' },
        { id: 30, name: 'Lombo Agridoce', categoria: 'Da Casa' },
        { id: 31, name: 'Lombo com Abacaxi', categoria: 'Da Casa' },
        { id: 32, name: 'Salame', categoria: 'Da Casa' },
        { id: 33, name: 'Stroganoff de Carne', categoria: 'Da Casa' },
        { id: 34, name: 'Stroganoff de Frango', categoria: 'Da Casa' },
        { id: 35, name: 'Tomate Seco com Rúcula', categoria: 'Da Casa' },
        { id: 36, name: 'Vegetariana', categoria: 'Da Casa' }
    ],
    premium: [
        { id: 37, name: 'Camarão', categoria: 'Premium' },
        { id: 38, name: 'Camarão ao Alho e Óleo', categoria: 'Premium' },
        { id: 39, name: 'Cordeiro ao Alho e Óleo', categoria: 'Premium' },
        { id: 40, name: 'Cordeiro ao Molho de Queijos', categoria: 'Premium' },
        { id: 41, name: 'Filé Acebolado', categoria: 'Premium' },
        { id: 42, name: 'Filé ao Molho de Nata', categoria: 'Premium' },
        { id: 43, name: 'Filé aos Quatro Queijos', categoria: 'Premium' },
        { id: 44, name: 'Filé com Cebola Caramelizada', categoria: 'Premium' },
        { id: 45, name: 'Filé com Cheedar', categoria: 'Premium' }
    ],
    doces: [
        { id: 46, name: 'Chocolate', categoria: 'Doces' },
        { id: 47, name: 'Chocolate Branco', categoria: 'Doces' },
        { id: 48, name: 'Brigadeiro', categoria: 'Doces' },
        { id: 49, name: 'Morango', categoria: 'Doces' },
        { id: 50, name: 'Banana Nevada', categoria: 'Doces' }
    ]
};

const bordas = [
    { id: 'nenhuma', name: 'Sem Borda', price: 0.00 },
    { id: 'requeijao', name: 'Requeijão', price: 18.00 },
    { id: 'cheedar', name: 'Cheedar', price: 18.00 },
    { id: 'avela', name: 'Avelã', price: 20.00 },
    { id: 'chocolate', name: 'Chocolate ao Leite', price: 20.00 }
];

const tabelaPrecos = {
    pequena: {
        classicas: 40.00,
        casa: 59.90,
        premium: 69.90,
        doces: 40.00
    },
    media: {
        classicas: 78.00,
        casa: 89.90,
        premium: 99.90,
        doces: 78.00
    },
    grande: {
        classicas: 90.00,
        casa: 109.90,
        premium: 129.90,
        doces: 90.00
    },
    familia: {
        classicas: 119.90,
        casa: 129.90,
        premium: 159.90,
        doces: 119.90
    }
};

const tamanhos = [
    { id: 'pequena', name: 'Pequena (4 fatias)', maxSabores: 1 },
    { id: 'media', name: 'Média (8 fatias)', maxSabores: 2 },
    { id: 'grande', name: 'Grande (12 fatias)', maxSabores: 3 },
    { id: 'familia', name: 'Família (16 fatias)', maxSabores: 4 }
];
