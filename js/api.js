import { db } from './data.js';

export const API = {
    // Pedidos
    getPedidos: () => db.pedidos,
    addPedido: (pedido) => db.pedidos.push(pedido),
    
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