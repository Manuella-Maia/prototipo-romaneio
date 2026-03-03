export const UI = {
    elements: {
        tabs: document.querySelectorAll('.tab-content'),
        timerDisplay: document.getElementById('cronometro'),
        productionTable: document.getElementById('lista-producao'),
        errorAlert: document.getElementById('error-alert'),
        errorMsg: document.getElementById('error-msg'),
        // Novo: container para lista de peças filhas no formulário
        pecasFormContainer: document.getElementById('pecas-dinamicas-container') 
    },

    // --- NAVEGAÇÃO E ACESSO ---
    switchTab: (tabId) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.remove('hidden');
    },

    // Filtra o que cada usuário pode ver (Admin, Cadastro, Produção)
    setupMenuByRole: (role) => {
        const nav = document.getElementById('nav-buttons');
        // Exemplo: se for 'producao', esconde o botão de 'Novo Pedido'
        if (role === 'producao') {
            nav.querySelector('[data-tab="admin"]').classList.add('hidden');
        }
    },

    // --- CHÃO DE FÁBRICA (OPERADOR) ---
    // Atualiza a tela quando uma peça (filha ou única) é escaneada
    updatePieceDisplay: (order, pecaSelecionada) => {
        document.getElementById('instrucao-peça').classList.remove('hidden');
        
        // Dados do Pedido (Mãe)
        document.getElementById('display-movel').innerText = order.movel;
        document.getElementById('display-cliente').innerText = `Cliente: ${order.cliente} | ${order.contato}`;
        
        // Dados da Peça Específica (Filha)
        document.getElementById('display-id').innerText = pecaSelecionada.id_peca;
        document.getElementById('status-badge').innerText = pecaSelecionada.status;
        
        // Estilização de Retrabalho
        const badge = document.getElementById('status-badge');
        if (order.retrabalho) {
            badge.classList.add('bg-red-600', 'animate-pulse');
            badge.innerText = `RETRABALHO: ${pecaSelecionada.status}`;
        } else {
            badge.classList.remove('bg-red-600', 'animate-pulse');
            badge.classList.add('bg-zinc-900');
        }

        document.getElementById('cor-fundo-pintura').style.backgroundColor = order.cor;
    },

    // --- GESTÃO (ADMIN) ---
    // Renderiza a tabela com informações detalhadas
    renderGestao: (orders) => {
        const container = document.getElementById('lista-producao');
        container.innerHTML = orders.map(o => {
            const totalPecas = o.pecas.length;
            const concluidas = o.pecas.filter(p => p.status === 'Finalizado').length;
            
            return `
                <tr class="border-b border-zinc-700 hover:bg-zinc-800/50 transition">
                    <td class="p-3">
                        <span class="font-bold text-orange-500">${o.id}</span><br>
                        <span class="text-xs opacity-50">${o.movel}</span>
                    </td>
                    <td class="p-3">
                        <div class="text-sm">${o.cliente}</div>
                        <div class="text-[10px] opacity-40">${o.contato}</div>
                    </td>
                    <td class="p-3">
                        <div class="w-full bg-zinc-700 h-2 rounded-full mt-1 overflow-hidden">
                            <div class="bg-green-500 h-full" style="width: ${(concluidas/totalPecas)*100}%"></div>
                        </div>
                        <span class="text-[10px]">${concluidas}/${totalPecas} peças</span>
                    </td>
                    <td class="p-3">
                        <span class="text-xs ${o.retrabalho ? 'text-red-400 font-bold' : 'text-zinc-400'}">
                            ${o.retrabalho ? '<i class="fas fa-exclamation-circle"></i> RETRABALHO' : 'Fluxo Normal'}
                        </span>
                    </td>
                    <td class="p-3 font-mono text-sm">${o.tempoTotalProducao}s</td>
                    <td class="p-3">
                        <button onclick="detalharPedido('${o.id}')" class="text-zinc-400 hover:text-white">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // --- FEEDBACK ---
    showError: (msg) => {
        UI.elements.errorMsg.innerText = msg;
        UI.elements.errorAlert.classList.remove('hidden');
        setTimeout(() => UI.elements.errorAlert.classList.add('hidden'), 4000);
    }
};