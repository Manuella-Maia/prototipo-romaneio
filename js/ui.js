import { db } from './data.js';

export const UI = {
    elements: {
        tabs: document.querySelectorAll('.tab-content'),
        timerDisplay: document.getElementById('cronometro'),
        productionTable: document.getElementById('lista-producao'),
        errorAlert: document.getElementById('error-alert'),
        errorMsg: document.getElementById('error-msg'),
        pecasFormContainer: document.getElementById('pecas-dinamicas-container') 
    },

    // --- NAVEGAÇÃO E ACESSO ---
    switchTab: (tabId) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.remove('hidden');
    },

    setupMenuByRole: (role) => {
        const nav = document.getElementById('nav-buttons');
        if (role === 'producao') {
            nav.querySelector('[data-tab="admin"]').classList.add('hidden');
        }
    },

    // --- CHÃO DE FÁBRICA (OPERADOR) ---
    updatePieceDisplay: (order, pecaSelecionada) => {
        document.getElementById('instrucao-peça').classList.remove('hidden');
        
        // Dados do Pedido (Mãe)
        document.getElementById('display-movel').innerText = order.movel;
        document.getElementById('display-cliente').innerText = `Cliente: ${order.cliente} | ${order.contato}`;
        
        // Dados da Peça Específica (Filha)
        document.getElementById('display-id').innerText = pecaSelecionada.id_peca;
        
        // Proteção caso o nome da peça não exista no HTML
        const displayNome = document.getElementById('display-nome-peca');
        if(displayNome) displayNome.innerText = pecaSelecionada.nome;

        document.getElementById('status-badge').innerText = pecaSelecionada.status;

        // --- INSTRUÇÕES TÉCNICAS DINÂMICAS ---
        const infoTecnica = db.instrucoesTecnicas[pecaSelecionada.status];
        const containerInfo = document.getElementById('detalhes-tecnicos-processo');
        
        if (infoTecnica && containerInfo) {
            containerInfo.innerHTML = `
                <div class="mt-4 p-4 bg-white/20 rounded-lg border border-black/5 backdrop-blur-sm animate-in fade-in duration-500">
                    <h4 class="font-bold text-[10px] uppercase mb-2 flex items-center text-zinc-800">
                        <i class="fas ${infoTecnica.icone} mr-2"></i> Guia de ${pecaSelecionada.status}
                    </h4>
                    <ul class="text-sm space-y-1 font-bold text-zinc-900">
                        ${infoTecnica.passos.map(passo => `<li>• ${passo}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else if (containerInfo) {
            containerInfo.innerHTML = ""; // Limpa se não houver instrução
        }
        
        // Estilização de Retrabalho
        const badge = document.getElementById('status-badge');
        if (order.retrabalho) {
            badge.classList.add('bg-red-600', 'animate-pulse');
            badge.classList.remove('bg-zinc-900');
            badge.innerText = `RETRABALHO: ${pecaSelecionada.status}`;
        } else {
            badge.classList.remove('bg-red-600', 'animate-pulse');
            badge.classList.add('bg-zinc-900');
        }

        // Atualização Visual das Cores
        const displayCorTexto = document.getElementById('display-cor-texto');
        const displayCorVisual = document.getElementById('display-cor-visual');
        const corFundoPintura = document.getElementById('cor-fundo-pintura');

        if (displayCorTexto) displayCorTexto.innerText = order.cor ? order.cor.toUpperCase() : "N/D";
        if (displayCorVisual) displayCorVisual.style.backgroundColor = order.cor || "transparent";
        if (corFundoPintura) corFundoPintura.style.backgroundColor = order.cor ? `${order.cor}40` : "transparent";
    },

    // --- GESTÃO (ADMIN) ---
    renderGestao: (orders) => {
        const container = document.getElementById('lista-producao');
        if(!container) return;

        // Atualiza os indicadores globais (Dashboard) antes de renderizar a tabela
        UI.updateDashboard(orders);

        container.innerHTML = orders.map(o => {
            const totalPecas = o.pecas.length;
            const concluidas = o.pecas.filter(p => p.status === 'Finalizado').length;
            const porcentagem = totalPecas === 0 ? 0 : (concluidas / totalPecas) * 100;
            
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
                            <div class="bg-green-500 h-full transition-all duration-500" style="width: ${porcentagem}%"></div>
                        </div>
                        <span class="text-[10px] opacity-70">${concluidas}/${totalPecas} peças</span>
                    </td>
                    <td class="p-3 font-mono text-sm">${o.tempoTotalProducao || 0}s</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-1 rounded ${o.retrabalho ? 'bg-red-500/20 text-red-400 font-bold' : 'bg-zinc-700 text-zinc-300'}">
                            ${o.retrabalho ? '<i class="fas fa-exclamation-circle"></i> RETRABALHO' : 'Normal'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // --- ATUALIZA OS NÚMEROS DO DASHBOARD ---
    updateDashboard: (orders) => {
        let emProducao = 0;
        let gargalos = 0;
        let finalizados = 0;

        orders.forEach(o => {
            const isFinalizado = o.pecas.length > 0 && o.pecas.every(p => p.status === 'Finalizado');
            
            if (isFinalizado) {
                finalizados++;
            } else {
                emProducao += o.pecas.filter(p => p.status !== 'Finalizado').length;
                if (o.retrabalho) gargalos++;
            }
        });

        // Atualiza o DOM verificando se os elementos existem
        const totalProducaoEl = document.getElementById('total-producao');
        const totalGargalosEl = document.getElementById('total-gargalos');
        const totalFinalizadosEl = document.getElementById('total-finalizados');

        if(totalProducaoEl) totalProducaoEl.innerText = emProducao;
        if(totalGargalosEl) totalGargalosEl.innerText = gargalos;
        if(totalFinalizadosEl) totalFinalizadosEl.innerText = finalizados;
    },

    showError: (msg) => {
        UI.elements.errorMsg.innerText = msg;
        UI.elements.errorAlert.classList.remove('hidden');
        setTimeout(() => UI.elements.errorAlert.classList.add('hidden'), 4000);
    }
};