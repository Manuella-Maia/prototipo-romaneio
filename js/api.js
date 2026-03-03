import { db } from './data.js';

export const API = {
    // Pedidos
    getPedidos: () => db.pedidos,
    addPedido: (pedido) => db.pedidos.push(pedido),
    
    // Atualiza um pedido existente (MUITO IMPORTANTE PARA O FLUXO)
    updatePedido: (id, updatedPedido) => {
        const index = db.pedidos.findIndex(p => p.id === id);
        if (index !== -1) {
            db.pedidos[index] = updatedPedido;
        }
    },
    
    // Busca peça específica dentro de qualquer pedido
    getPecaPorId: (idPeca) => {
        for (let pedido of db.pedidos) {
            let peca = pedido.pecas.find(p => p.id_peca === idPeca);
            if (peca) return { peca, pedido };
        }
        return null;
    },

    // Usuários
    login: (id, senha) => {
        return db.usuarios.find(u => u.id == id && u.senha == senha);
    }
};