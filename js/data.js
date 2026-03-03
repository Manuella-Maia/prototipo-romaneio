export const db = {
    // Lista de Usuários e Permissões
    usuarios: [
        { id: 1, nome: "Ricardo Admin", role: "admin", senha: "123" },
        { id: 2, nome: "João Lixador", role: "producao", senha: "456" },
        { id: 3, nome: "Ana Montagem", role: "montagem", senha: "789" }
    ],

    // Definição dos Setores (Status possíveis)
    setores: ["Cadastro", "Lixamento", "Pintura", "Montagem", "Expedição"],

    // Onde a mágica acontece: Pedidos Complexos
    pedidos: [
        {
            id: "RD-772",
            cliente: "Loft Design",
            contato: "(11) 99999-9999",
            movel: "Armário de Cozinha Premium",
            dataCriacao: "2024-05-20",
            retrabalho: false,
            
            // Estrutura Mãe e Filhas
            pecas: [
                { 
                    id_peca: "772-01", 
                    nome: "Porta Principal", 
                    tipo: "filha", 
                    processos: [
                        { setor: "Lixamento", tempo: 120, status: "concluido", operador: "João" },
                        { setor: "Pintura", tempo: 0, status: "pendente", operador: null }
                    ]
                },
                { 
                    id_peca: "772-02", 
                    nome: "Estrutura Lateral", 
                    tipo: "filha",
                    processos: [] 
                }
            ],
            statusGeral: "Em Produção",
            tempoTotalProducao: 0 // Soma de todas as peças
        }
    ]
};