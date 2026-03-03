export const db = {
    usuarios: [
        { id: 1, nome: "Ricardo Admin", role: "admin", senha: "123" },
        { id: 2, nome: "João Lixador", role: "producao", senha: "456" },
        { id: 3, nome: "Ana Montagem", role: "montagem", senha: "789" }
    ],

    instrucoesTecnicas: {
        "Lixamento": {
            titulo: "Preparação de Superfície",
            passos: ["Lixa Grão 150 (Desbaste)", "Lixa Grão 220 (Acabamento)", "Remover pó com ar comprimido"],
            icone: "fa-screwdriver-wrench"
        },
        "Pintura": {
            titulo: "Aplicação de Acabamento",
            passos: ["Catalisador: 20% PU", "Diluente: 10% Thinner", "Pressão Pistola: 35 PSI", "Tonalidade: Conforme Amostra"],
            icone: "fa-fill-drip"
        }
    },

    pedidos: [
        {
            id: "RD-772",
            cliente: "Loft Design",
            contato: "(11) 99999-9999",
            movel: "Armário de Cozinha Premium",
            cor: "#d4a373",
            retrabalho: false,
            tempoTotalProducao: 120,
            pecas: [
                { 
                    id_peca: "RD-772-01", // Corrigido para bater com o padrão gerado
                    nome: "Porta Principal", 
                    status: "Lixamento", 
                    tempoTotal: 60,
                    concluido: [] // Corrigido de 'processos' para 'concluido'
                },
                { 
                    id_peca: "RD-772-02", 
                    nome: "Estrutura Lateral", 
                    status: "Pintura",
                    tempoTotal: 60,
                    concluido: ["Lixamento"] 
                }
            ]
        }
    ]
};