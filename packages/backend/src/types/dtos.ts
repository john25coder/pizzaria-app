// DTO = Data Transfer Object (tipos de dados para requisições)

export interface CriarUsuarioDTO {
    email: string;
    senha: string;
    nome: string;
    telefone?: string;
    cpf?: string;
}

// ✅ CORRETO - Login apenas com telefone
export interface LoginDTO {
    telefone: string;
    senha: string;
}

export interface AtualizarUsuarioDTO {
    nome?: string;
    telefone?: string;
    email?: string;
}

export interface CriarProdutoDTO {
    nome: string;
    descricao?: string;
    preco: number;
    imagem?: string;
}

export interface CriarTamanhoDTO {
    nome: string;
    descricao?: string;
    preco: number;
}

export interface CriarPedidoDTO {
    itens: Array<{
        produtoId: string;
        tamanhoId: string;
        quantidade: number;
    }>;
    usuarioId: string;
    enderecoEntrega?: string;
    telefone?: string;
}

export interface CriarPagamentoDTO {
    pedidoId: string;
    valor: number;
    email: string;
}

export interface ConfirmarPagamentoDTO {
    paymentIntentId: string;
}

export interface CriarPaymentIntentDTO {
    amount: number;
    currency?: string;
    descricao?: string;
}

export interface AtualizarPedidoDTO {
    status?: string;
    endereco?: string;
    telefone?: string;
}
