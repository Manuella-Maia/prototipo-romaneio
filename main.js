import { API } from './js/api.js';
import { UI } from './js/ui.js';
import { State } from './js/state.js';
import { Catalog } from './js/catalog.js';

// --- INICIALIZAÇÃO DO CATÁLOGO E ENGENHARIA ---
const selectCatalogo = document.getElementById('select-catalogo');
const pecasContainer = document.getElementById('pecas-container');
const btnAddPeca = document.getElementById('add-peca');
const campoMovel = document.getElementById('movel');



// 1. Popular o Select
Catalog.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.nome;
    opt.innerText = `📦 ${item.nome}`;
    selectCatalogo.appendChild(opt);
});

// 2. Função Auxiliar: Criar linha de peça
const criarInputPeca = (nomePeca = "", isReadOnly = false) => {
    const div = document.createElement('div');
    div.className = "flex gap-2 peca-item animate-fade-in mb-2";

    if (isReadOnly) {
        div.innerHTML = `
            <input type="text" value="${nomePeca}" readonly
                   class="w-full bg-zinc-800/50 border border-zinc-700/50 p-2 rounded text-sm peca-nome-input text-zinc-400 cursor-not-allowed outline-none font-mono">
        `;
    } else {
        div.innerHTML = `
            <input type="text" value="${nomePeca}" placeholder="Nome da Peça (ex: Lateral Esq)" 
                   class="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-sm peca-nome-input focus:border-orange-500 outline-none">
            <button type="button" class="text-red-500 p-2 hover:bg-red-500/10 rounded remove-peca transition">
                <i class="fas fa-trash"></i>
            </button>
        `;
        div.querySelector('.remove-peca').onclick = () => div.remove();
    }
    pecasContainer.appendChild(div);
};

// 3. Auto-preenchimento
selectCatalogo.onchange = (e) => {
    const modelo = Catalog.find(c => c.nome === e.target.value);
    pecasContainer.innerHTML = ""; 
    
    if (modelo && modelo.nome !== "Móvel Personalizado") {
        campoMovel.value = modelo.nome; 
        campoMovel.readOnly = true;
        campoMovel.classList.add('opacity-50', 'cursor-not-allowed');
        if(btnAddPeca) btnAddPeca.classList.add('hidden');
        modelo.pecasPadrao.forEach(p => criarInputPeca(p, true));
    } else {
        campoMovel.value = "";
        campoMovel.readOnly = false;
        campoMovel.classList.remove('opacity-50', 'cursor-not-allowed');
        if(btnAddPeca) btnAddPeca.classList.remove('hidden');
        criarInputPeca("", false);
        campoMovel.focus(); 
    }
};

// Adiciona evento ao botão de "Adicionar Peça Extra" (caso exista)
if(btnAddPeca) {
    btnAddPeca.onclick = () => criarInputPeca("", false);
}

// --- CADASTRO DE PEDIDO E GERAÇÃO DE PDF ---
document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const orderId = 'RD-' + Math.floor(1000 + Math.random() * 9000);
    const processos = Array.from(document.querySelectorAll('input[name="processo"]:checked')).map(cb => cb.value);
    const inputsPecas = document.querySelectorAll('.peca-nome-input');
    
    const pecasFilhas = Array.from(inputsPecas).map((input, index) => ({
        id_peca: `${orderId}-${(index + 1).toString().padStart(2, '0')}`,
        nome: input.value.toUpperCase() || `PEÇA ${index + 1}`,
        status: processos[0] || 'Lixamento',
        tempoTotal: 0,
        concluido: []
    }));

    const newOrder = {
        id: orderId,
        cliente: document.getElementById('cliente').value,
        contato: document.getElementById('contato').value,
        movel: document.getElementById('movel').value,
        cor: document.getElementById('cor').value,
        retrabalho: document.getElementById('retrabalho').checked,
        dataCriacao: new Date().toISOString(), // Marca a data/hora exata que o lote nasceu
        tempoTotalProducao: 0,
        pecas: pecasFilhas
    };

    API.addPedido(newOrder);
    await gerarEtiquetasLaser(newOrder);

    alert(`Lote ${orderId} registrado! PDF gerado com sucesso.`);
    e.target.reset();
    pecasContainer.innerHTML = "";
    
    // Atualiza gestão e muda de aba
    UI.renderGestao(API.getPedidos());
    UI.switchTab('operador');
};

// --- GERAÇÃO DE PDF ---
async function gerarEtiquetasLaser(pedido) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`Romanelo Digital - Mapa Laser: ${pedido.id}`, 10, 10);
    let yPos = 25;

    for (const peca of pedido.pecas) {
        const qrDataUrl = await QRCode.toDataURL(peca.id_peca, { margin: 1, width: 100 });
        doc.rect(10, yPos, 180, 30);
        doc.addImage(qrDataUrl, 'PNG', 12, yPos + 2, 25, 25);
        doc.text(peca.id_peca, 40, yPos + 10);
        doc.setFontSize(9);
        doc.text(`DESCRIÇÃO: ${peca.nome} | PROCESSO: ${peca.status}`, 40, yPos + 18);
        yPos += 35;
        if (yPos > 260) { doc.addPage(); yPos = 20; }
    }
    doc.save(`Laser_${pedido.id}.pdf`);
}

// --- LÓGICA DO OPERADOR (SCANNER) ---
document.getElementById('btn-read-qr').onclick = () => {
    const inputField = document.getElementById('qrInput');
    const inputId = inputField.value.toUpperCase();
    const resultado = API.getPecaPorId(inputId);

    if (resultado) {
        // Toca o som de BIP para dar realismo à apresentação
        new Audio('https://www.soundjay.com/buttons/beep-07.mp3').play().catch(()=>{});

        State.currentOrder = resultado.pedido;
        State.currentPiece = resultado.peca;
        State.seconds = resultado.peca.tempoTotal || 0;
        
        UI.updatePieceDisplay(State.currentOrder, State.currentPiece);
        
        const retrabalhoBadge = document.getElementById('alert-retrabalho');
        if(retrabalhoBadge) {
            State.currentOrder.retrabalho ? retrabalhoBadge.classList.remove('hidden') : retrabalhoBadge.classList.add('hidden');
        }
        
        updateTimerUI();
        inputField.value = ""; 
    } else {
        UI.showError("Peça não encontrada!");
    }
};

// --- CONTROLE DE TEMPO E CONCLUSÃO DE PROCESSO (Lixamento/Pintura) ---
document.getElementById('btn-start-timer').onclick = () => {
    if (State.timerInterval || !State.currentPiece) return;
    State.timerInterval = setInterval(() => {
        State.seconds++;
        updateTimerUI();
    }, 1000);
};

document.getElementById('btn-stop-timer').onclick = () => {
    if (!State.currentPiece || !State.currentOrder) return;

    if (State.currentPiece.status === 'Montagem' && !State.currentPiece.concluido.includes('Pintura')) {
        UI.showError("BLOQUEIO: Pintura pendente!");
        return;
    }

    // 1. Para o cronômetro
    clearInterval(State.timerInterval);
    State.timerInterval = null;

    const processoFinalizado = State.currentPiece.status; 

    // 2. Atualiza o histórico 
    if(!State.currentPiece.concluido.includes(processoFinalizado)){
        State.currentPiece.concluido.push(processoFinalizado);
    }
    State.currentPiece.tempoTotal = State.seconds;

    // 3. Avança o status
    const fluxos = ['Lixamento', 'Pintura', 'Montagem', 'Finalizado'];
    const indexAtual = fluxos.indexOf(processoFinalizado);
    State.currentPiece.status = fluxos[indexAtual + 1] || 'Finalizado';

    API.updatePedido(State.currentOrder.id, State.currentOrder);
    UI.renderGestao(API.getPedidos()); 

    // 4. AVISO E LIMPEZA DE TELA
    alert(`✅ PROCESSO CONCLUÍDO!\n\nO ${processoFinalizado} da peça ${State.currentPiece.id_peca} foi finalizado.\nA peça já está liberada para: ${State.currentPiece.status}`);
    
    document.getElementById('instrucao-peça').classList.add('hidden');
    document.getElementById('qrInput').focus(); 
    
    // Zera o estado local
    State.currentPiece = null;
    State.currentOrder = null;
    State.seconds = 0;
    updateTimerUI();
};

function updateTimerUI() {
    const hrs = Math.floor(State.seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((State.seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (State.seconds % 60).toString().padStart(2, '0');
    document.getElementById('cronometro').innerText = `${hrs}:${mins}:${secs}`;
}

// Navegação de abas
document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-tab');
        UI.switchTab(target);
        if (target === 'gestao') UI.renderGestao(API.getPedidos());
    };
});

// --- LÓGICA DA ESTAÇÃO DE MONTAGEM ---
document.getElementById('btn-verificar-kit').onclick = () => {
    const inputId = document.getElementById('qrInputMontagem').value.toUpperCase();
    const resultado = API.getPecaPorId(inputId);

    if (!resultado) {
        UI.showError("Peça não encontrada!");
        return;
    }

    const pedido = resultado.pedido;
    const painelChecklist = document.getElementById('painel-checklist-montagem');
    const listaHtml = document.getElementById('lista-pecas-montagem');
    const nomeMovel = document.getElementById('nome-movel-montagem');
    const badgeStatus = document.getElementById('status-kit-badge');
    const btnConcluir = document.getElementById('btn-concluir-movel');

    painelChecklist.classList.remove('hidden');
    nomeMovel.innerText = `Móvel: ${pedido.movel} (${pedido.id})`;

    let todasProntas = true;
    listaHtml.innerHTML = ""; 

    pedido.pecas.forEach(peca => {
        const prontaParaMontar = peca.status === 'Montagem' || peca.status === 'Finalizado';
        if (!prontaParaMontar) todasProntas = false;

        const icone = prontaParaMontar ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-red-500"></i>';
        const corTexto = prontaParaMontar ? 'text-zinc-300' : 'text-red-400 font-bold';

        listaHtml.innerHTML += `
            <li class="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-700/50 mb-1">
                <span class="${corTexto}">${icone} ${peca.id_peca} - ${peca.nome}</span>
                <span class="${corTexto} text-[10px] uppercase">${peca.status}</span>
            </li>
        `;
    });

    if (todasProntas) {
        badgeStatus.innerText = "KIT COMPLETO";
        badgeStatus.className = "px-3 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/50";
        btnConcluir.classList.remove('hidden');
        
       // --- FINALIZAÇÃO E CÁLCULO DO TEMPO TOTAL DA PRODUÇÃO ---
        btnConcluir.onclick = () => {
            if(confirm(`Finalizar montagem de ${pedido.movel}?`)) {
                // Marca todas as peças como Finalizadas
                pedido.pecas.forEach(p => p.status = 'Finalizado');
                
                let tempoTotalSegundos = 0;

                // TRAVA DE SEGURANÇA: Verifica se o pedido tem data de criação (se é novo)
                if (pedido.dataCriacao) {
                    const dataInicio = new Date(pedido.dataCriacao);
                    const dataFim = new Date();
                    // Calcula o Lead Time Real
                    tempoTotalSegundos = Math.floor((dataFim - dataInicio) / 1000); 
                } else {
                    // Fallback para pedidos antigos/mocks que não têm data de criação
                    // Ele apenas soma os tempos gastos no Lixamento/Pintura
                    tempoTotalSegundos = pedido.pecas.reduce((acc, p) => acc + (p.tempoTotal || 0), 0);
                }
                
                pedido.tempoTotalProducao = tempoTotalSegundos;
                pedido.dataFinalizacao = new Date().toISOString(); 

                API.updatePedido(pedido.id, pedido);
                
                // Exibe alerta bonitão de encerramento de lote
                const min = Math.floor(tempoTotalSegundos / 60);
                const seg = tempoTotalSegundos % 60;
                alert(`🎉 MÓVEL FINALIZADO!\n\nPedido: ${pedido.id}\nTempo Total: ${min} min e ${seg} seg.`);
                
                // Limpa a tela
                painelChecklist.classList.add('hidden');
                document.getElementById('qrInputMontagem').value = "";
                UI.renderGestao(API.getPedidos()); 
            }
        };
    } else {
        badgeStatus.innerText = "KIT INCOMPLETO";
        badgeStatus.className = "px-3 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50";
        btnConcluir.classList.add('hidden');
    }
};

// --- INICIALIZAÇÃO GERAL DO SISTEMA ---
window.addEventListener('DOMContentLoaded', () => {
    UI.renderGestao(API.getPedidos());
});