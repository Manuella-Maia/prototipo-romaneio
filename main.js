import { API } from './js/api.js';
import { UI } from './js/ui.js';
import { State } from './js/state.js';
import { Catalog } from './js/catalog.js';

// --- INICIALIZAÇÃO DO CATÁLOGO E ENGENHARIA ---
const selectCatalogo = document.getElementById('select-catalogo');
const pecasContainer = document.getElementById('pecas-container');
const btnAddPeca = document.getElementById('add-peca'); // Pegamos o botão de adicionar
const campoMovel = document.getElementById('movel'); // Pegamos o campo do nome do móvel

// 1. Popular o Select
Catalog.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.nome;
    opt.innerText = `📦 ${item.nome}`;
    selectCatalogo.appendChild(opt);
});

// 2. Função Auxiliar: Criar linha de peça (Agora inteligente!)
const criarInputPeca = (nomePeca = "", isReadOnly = false) => {
    const div = document.createElement('div');
    div.className = "flex gap-2 peca-item animate-fade-in mb-2";

    if (isReadOnly) {
        // MODO CATÁLOGO: Peça bloqueada, sem lixeira. Visual mais "apagado" para indicar que é automático.
        div.innerHTML = `
            <input type="text" value="${nomePeca}" readonly
                   class="w-full bg-zinc-800/50 border border-zinc-700/50 p-2 rounded text-sm peca-nome-input text-zinc-400 cursor-not-allowed outline-none font-mono">
        `;
    } else {
        // MODO PERSONALIZADO: Campo editável com botão de lixeira.
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

// 3. MÁGICA: Auto-preenchimento e Bloqueio de UI
selectCatalogo.onchange = (e) => {
    const modelo = Catalog.find(c => c.nome === e.target.value);
    const campoMovel = document.getElementById('movel');
    
    // Limpa a lista atual de peças
    pecasContainer.innerHTML = ""; 
    
    // ATENÇÃO: Verifique se o nome aqui ("Móvel Personalizado") é EXATAMENTE o que está no seu catalog.js
    if (modelo && modelo.nome !== "Móvel Personalizado") {
        
        // --- MODO CATÁLOGO ---
        campoMovel.value = modelo.nome; 
        campoMovel.readOnly = true; // Trava o campo
        campoMovel.classList.add('opacity-50', 'cursor-not-allowed');
        
        btnAddPeca.classList.add('hidden'); // Esconde botão de adicionar peças
        
        // Cria as peças do DNA já travadas
        modelo.pecasPadrao.forEach(p => criarInputPeca(p, true));
        
    } else {
        
        // --- MODO PERSONALIZADO ---
        campoMovel.value = ""; // Limpa o campo
        campoMovel.readOnly = false; // DESTRAVA o campo para digitação livre!
        campoMovel.classList.remove('opacity-50', 'cursor-not-allowed');
        campoMovel.placeholder = "Descreva o móvel (Ex: Mesa Oval com Borda Dupla)"; // Dica visual
        
        btnAddPeca.classList.remove('hidden'); // Mostra botão de adicionar peças
        
        criarInputPeca("", false); // Cria 1 campo de peça vazio
        
        // Mágica de UX: Joga o cursor do teclado direto pro campo de descrição!
        campoMovel.focus(); 
    }
};

// --- CADASTRO DE PEDIDO E GERAÇÃO DE PDF ---
document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const orderId = 'RD-' + Math.floor(1000 + Math.random() * 9000);
    const processos = Array.from(document.querySelectorAll('input[name="processo"]:checked')).map(cb => cb.value);
    const inputsPecas = document.querySelectorAll('.peca-nome-input');
    
    // Construção das Peças Filhas capturando os valores dos inputs gerados
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
        dataCriacao: new Date().toISOString(),
        tempoTotalProducao: 0,
        pecas: pecasFilhas
    };

    API.addPedido(newOrder);
    await gerarEtiquetasLaser(newOrder); // PDF para a máquina

    alert(`Lote ${orderId} registrado com ${pecasFilhas.length} peças!`);
    e.target.reset();
    pecasContainer.innerHTML = "";
    UI.switchTab('operador');
};

// --- GERAÇÃO DE PDF COM QR CODES ---
async function gerarEtiquetasLaser(pedido) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.text(`Romanelo Digital - Mapa Laser: ${pedido.id}`, 10, 10);
    doc.setFontSize(8);
    doc.text(`Cliente: ${pedido.cliente} | Móvel: ${pedido.movel}`, 10, 15);

    let yPos = 25;

    for (const peca of pedido.pecas) {
        const qrDataUrl = await QRCode.toDataURL(peca.id_peca, { margin: 1, width: 100 });
        
        doc.setDrawColor(230);
        doc.rect(10, yPos, 180, 30); // Molde da etiqueta
        doc.addImage(qrDataUrl, 'PNG', 12, yPos + 2, 25, 25);
        
        doc.setFontSize(12);
        doc.text(peca.id_peca, 40, yPos + 10);
        doc.setFontSize(9);
        doc.text(`DESCRIÇÃO: ${peca.nome}`, 40, yPos + 16);
        doc.text(`PROCESSO: ${peca.status}`, 40, yPos + 21);
        doc.text(`COR: ${pedido.cor}`, 40, yPos + 26);

        yPos += 35;
        if (yPos > 260) { doc.addPage(); yPos = 20; }
    }
    doc.save(`Laser_${pedido.id}.pdf`);
}

// --- LÓGICA DO OPERADOR (SCANNER) ---
document.getElementById('btn-read-qr').onclick = () => {
    const inputId = document.getElementById('qrInput').value.toUpperCase();
    const resultado = API.getPecaPorId(inputId);

    if (resultado) {
        State.currentOrder = resultado.pedido;
        State.currentPiece = resultado.peca;
        State.seconds = resultado.peca.tempoTotal || 0;
        
        UI.updatePieceDisplay(State.currentOrder, State.currentPiece);
        
        const retrabalhoBadge = document.getElementById('alert-retrabalho');
        State.currentOrder.retrabalho ? retrabalhoBadge.classList.remove('hidden') : retrabalhoBadge.classList.add('hidden');
        
        updateTimerUI();
    } else {
        UI.showError("Peça não encontrada!");
    }
};

// --- CONTROLE DE TEMPO ---
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

    clearInterval(State.timerInterval);
    State.timerInterval = null;

    State.currentPiece.concluido.push(State.currentPiece.status);
    State.currentPiece.tempoTotal = State.seconds;

    const fluxos = ['Lixamento', 'Pintura', 'Montagem', 'Finalizado'];
    const indexAtual = fluxos.indexOf(State.currentPiece.status);
    State.currentPiece.status = fluxos[indexAtual + 1] || 'Finalizado';

    State.currentOrder.tempoTotalProducao = State.currentOrder.pecas.reduce((acc, p) => acc + p.tempoTotal, 0);

    API.updatePedido(State.currentOrder.id, State.currentOrder);
    UI.updatePieceDisplay(State.currentOrder, State.currentPiece);
    UI.renderGestao(API.getPedidos());
};

function updateTimerUI() {
    const hrs = Math.floor(State.seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((State.seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (State.seconds % 60).toString().padStart(2, '0');
    document.getElementById('cronometro').innerText = `${hrs}:${mins}:${secs}`;
}

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-tab');
        UI.switchTab(target);
        if (target === 'gestao') UI.renderGestao(API.getPedidos());
    };
});

// --- LÓGICA DA ESTAÇÃO DE MONTAGEM (Checklist) ---
document.getElementById('btn-verificar-kit').onclick = () => {
    const inputId = document.getElementById('qrInputMontagem').value.toUpperCase();
    const resultado = API.getPecaPorId(inputId);

    if (!resultado) {
        alert("Peça não encontrada!");
        return;
    }

    const pedido = resultado.pedido;
    const painelChecklist = document.getElementById('painel-checklist-montagem');
    const listaHtml = document.getElementById('lista-pecas-montagem');
    const nomeMovel = document.getElementById('nome-movel-montagem');
    const badgeStatus = document.getElementById('status-kit-badge');
    const btnConcluir = document.getElementById('btn-concluir-movel');

    // Mostra o painel
    painelChecklist.classList.remove('hidden');
    nomeMovel.innerText = `Móvel: ${pedido.movel} (Pedido: ${pedido.id})`;

    let todasProntas = true;
    listaHtml.innerHTML = ""; // Limpa a lista anterior

    // Avalia o status de cada peça do móvel
    pedido.pecas.forEach(peca => {
        // Consideramos pronta para montar se já passou pelos processos iniciais
        const prontaParaMontar = peca.status === 'Montagem' || peca.status === 'Finalizado';
        
        if (!prontaParaMontar) {
            todasProntas = false;
        }

        // Criar a linha da peça no checklist com cores dinâmicas
        const icone = prontaParaMontar ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-red-500"></i>';
        const corTexto = prontaParaMontar ? 'text-zinc-300' : 'text-red-400 font-bold';
        const statusTexto = prontaParaMontar ? 'Liberada' : `Pendente (${peca.status})`;

        listaHtml.innerHTML += `
            <li class="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-700/50">
                <span class="${corTexto}">${icone} ${peca.id_peca} - ${peca.nome}</span>
                <span class="${corTexto} text-xs uppercase">${statusTexto}</span>
            </li>
        `;
    });

    // Atualiza a UI baseada no resultado da verificação
    if (todasProntas) {
        badgeStatus.innerText = "KIT COMPLETO";
        badgeStatus.className = "px-3 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/50";
        
        // Libera o botão de concluir a montagem
        btnConcluir.classList.remove('hidden');
        
        // Ação de concluir o móvel inteiro
        btnConcluir.onclick = () => {
            if(confirm(`Confirmar montagem final do móvel: ${pedido.movel}?`)) {
                // Atualiza todas as peças do pedido para 'Finalizado' de uma vez só!
                pedido.pecas.forEach(p => p.status = 'Finalizado');
                API.updatePedido(pedido.id, pedido);
                
                alert('🎉 Móvel montado e finalizado com sucesso!');
                painelChecklist.classList.add('hidden');
                document.getElementById('qrInputMontagem').value = "";
                
                // Atualiza a tabela de gestão por trás dos panos
                UI.renderGestao(API.getPedidos()); 
            }
        };
    } else {
        badgeStatus.innerText = "KIT INCOMPLETO";
        badgeStatus.className = "px-3 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50";
        btnConcluir.classList.add('hidden'); // Esconde o botão para não deixar montar
    }
};