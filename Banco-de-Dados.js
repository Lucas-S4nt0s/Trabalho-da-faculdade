const NIVEIS_URGENCIA = {
    baixa: { nome: "Baixa", cor: "#22c55e" },    // verde
    media: { nome: "Média", cor: "#eab308" },    // amarelo
    alta: { nome: "Alta", cor: "#f97316" },      // laranja
    critica: { nome: "Crítica", cor: "#ef4444" }  // vermelho
};

const residentesIniciais = [
    {
        nome: "Sr. João Silva",
        idade: 78,
        quarto: 102,
        tipoSanguineo: "O+",
        remedios: [
            { nome: "Losartana 50mg", horario: "08:00", urgencia: NIVEIS_URGENCIA.media },
            { nome: "Aspirina 100mg", horario: "12:00", urgencia: NIVEIS_URGENCIA.baixa }
        ]
    },
    {
        nome: "Maria Souza",
        idade: 85,
        quarto: 105,
        tipoSanguineo: "A-",
        remedios: [
            { nome: "Insulina", horario: "07:30", urgencia: NIVEIS_URGENCIA.critica }
        ]
    },
    {
        nome: "Ana Paula Santos",
        idade: 71,
        quarto: 101,
        tipoSanguineo: "A-",
        remedios: [
            { nome: "Omeprazol", horario: "07:30", urgencia: NIVEIS_URGENCIA.baixa },
            { nome: "Dipirona 500mg", horario: "09:00", urgencia: NIVEIS_URGENCIA.media }
        ]
    },
    {
        nome: "Thiago Leme",
        idade: 102,
        quarto: 109,
        tipoSanguineo: "AB+",
        remedios: [
            { nome: "Losartana", horario: "10:30", urgencia: NIVEIS_URGENCIA.alta }
        ]
    }
];

const CHAVE_RESIDENTES = "remedinhos_residentes";

function carregarResidentes() {
    const salvo = localStorage.getItem(CHAVE_RESIDENTES);
    if (!salvo) return residentesIniciais;
    try { return JSON.parse(salvo); }
    catch { return residentesIniciais; }
}

function salvarResidentes() {
    localStorage.setItem(CHAVE_RESIDENTES, JSON.stringify(residentes));
}

let residentes = carregarResidentes();

// Alertas de exemplo (depois vêm dos sensores IoT de verdade)
const alertas = [
    { id: "a1", icone: "fa-person-falling", titulo: "Possível queda detectada", quarto: 105, hora: "07:12", urgencia: NIVEIS_URGENCIA.critica },
    { id: "a2", icone: "fa-door-open", titulo: "Porta aberta fora do horário", quarto: 101, hora: "06:48", urgencia: NIVEIS_URGENCIA.media },
    { id: "a3", icone: "fa-temperature-high", titulo: "Temperatura do quarto acima do normal", quarto: 102, hora: "06:30", urgencia: NIVEIS_URGENCIA.baixa }
];

// ---------- ESTADO SALVO NO NAVEGADOR ----------
// Cada item salvo é { id, em } -> "em" é a hora em que foi concluído/resolvido
const CHAVE_REMEDIOS = "remedinhos_hist_remedios";
const CHAVE_ALERTAS = "remedinhos_hist_alertas";

function lerSalvo(chave) {
    try { return JSON.parse(localStorage.getItem(chave)) || []; }
    catch { return []; }
}
function salvar(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
}
function idsSalvos(chave) {
    return lerSalvo(chave).map(x => x.id);
}
function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Monta a lista de todos os remédios com um id único (residente-remédio)
function listarTodosRemedios() {
    const lista = [];
    residentes.forEach((residente, r) => {
        (residente.remedios || []).forEach((remedio, m) => {
            lista.push({
                id: `${r}-${m}`,
                nomeResidente: residente.nome,
                quarto: residente.quarto,
                nomeRemedio: remedio.nome,
                horario: remedio.horario,
                urgencia: remedio.urgencia
            });
        });
    });
    return lista.sort((a, b) => a.horario.localeCompare(b.horario));
}

function atualizarTudo() {
    renderizarAgenda();
    renderizarAlertas();
    renderizarHistorico();
}

// ---------- 1. AGENDA (só mostra o que ainda está PENDENTE) ----------
function renderizarAgenda() {
    const listaCards = document.getElementById("lista-agenda-dinamica");
    if (!listaCards) return;

    const concluidos = idsSalvos(CHAVE_REMEDIOS);
    const pendentes = listarTodosRemedios().filter(i => !concluidos.includes(i.id));

    if (pendentes.length === 0) {
        listaCards.innerHTML = `
            <div class="text-center text-slate-500 py-10">
                <i class="fa-solid fa-circle-check text-4xl text-indigo-500 mb-2"></i>
                <p class="font-semibold text-slate-700">Tudo em dia!</p>
                <p class="text-sm">Nenhum remédio pendente. Veja o que já foi feito na aba Histórico.</p>
            </div>`;
        return;
    }

    listaCards.innerHTML = pendentes.map((item, index) => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center space-x-3">
                <span class="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-md text-xs">${item.horario}</span>
                ${index === 0 ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">Próximo</span>' : ''}
            </div>
            <div class="flex-1">
                <h3 class="font-bold text-slate-800">${item.nomeResidente} <span class="text-xs font-normal text-slate-500">(Quarto ${item.quarto})</span></h3>
                <p class="text-sm text-slate-600"><i class="fa-solid fa-pills mr-1 text-indigo-500"></i>Administrar ${item.nomeRemedio}</p>
            </div>
            <div class="flex items-center space-x-2 w-full md:w-auto justify-between">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style="background-color: ${item.urgencia.cor}">${item.urgencia.nome}</span>
                <button type="button" onclick="concluirTarefa('${item.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm cursor-pointer">
                    <i class="fa-solid fa-check mr-1"></i> Concluir
                </button>
            </div>
        </div>
    `).join("");
}

function concluirTarefa(id) {
    const lista = lerSalvo(CHAVE_REMEDIOS);
    if (!lista.some(x => x.id === id)) lista.push({ id, em: horaAgora() });
    salvar(CHAVE_REMEDIOS, lista);
    atualizarTudo();
}

function desfazerTarefa(id) {
    salvar(CHAVE_REMEDIOS, lerSalvo(CHAVE_REMEDIOS).filter(x => x.id !== id));
    atualizarTudo();
}

// ---------- 2. ALERTAS IoT (só mostra os PENDENTES) ----------
function renderizarAlertas() {
    atualizarBadgeAlertas();
    const container = document.getElementById("tab-alertas");
    if (!container) return;

    const resolvidos = idsSalvos(CHAVE_ALERTAS);
    const pendentes = alertas.filter(a => !resolvidos.includes(a.id));

    const cards = pendentes.map(a => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
             style="border-left: 6px solid ${a.urgencia.cor}">
            <div class="flex items-center space-x-3 flex-1">
                <i class="fa-solid ${a.icone} text-xl" style="color:${a.urgencia.cor}"></i>
                <div>
                    <h3 class="font-bold text-slate-800">${a.titulo}</h3>
                    <p class="text-xs text-slate-500">Quarto ${a.quarto} • ${a.hora}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 w-full md:w-auto justify-between">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style="background-color: ${a.urgencia.cor}">${a.urgencia.nome}</span>
                <button type="button" onclick="resolverAlerta('${a.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
                    <i class="fa-solid fa-check mr-1"></i> Resolver
                </button>
            </div>
        </div>
    `).join("");

    const vazio = `
        <div class="text-center text-slate-500 py-10">
            <i class="fa-solid fa-shield-heart text-4xl text-indigo-500 mb-2"></i>
            <p class="font-semibold text-slate-700">Nenhum alerta pendente</p>
            <p class="text-sm">Os alertas resolvidos ficam na aba Histórico.</p>
        </div>`;

    container.innerHTML = `
        <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-slate-700"><i class="fa-solid fa-triangle-exclamation text-indigo-600 mr-2"></i> Alertas IoT</h2>
        </div>
        <div class="space-y-3">${cards || vazio}</div>
    `;
}

function resolverAlerta(id) {
    const lista = lerSalvo(CHAVE_ALERTAS);
    if (!lista.some(x => x.id === id)) lista.push({ id, em: horaAgora() });
    salvar(CHAVE_ALERTAS, lista);
    atualizarTudo();
}

function reabrirAlerta(id) {
    salvar(CHAVE_ALERTAS, lerSalvo(CHAVE_ALERTAS).filter(x => x.id !== id));
    atualizarTudo();
}

function atualizarBadgeAlertas() {
    const badge = document.getElementById("badge-alertas");
    if (!badge) return;
    const resolvidos = idsSalvos(CHAVE_ALERTAS);
    const pendentes = alertas.filter(a => !resolvidos.includes(a.id)).length;
    badge.textContent = pendentes;
    badge.classList.toggle("hidden", pendentes === 0);
}

// ---------- HISTÓRICO (para onde vai o que foi concluído/resolvido) ----------
function renderizarHistorico() {
    const container = document.getElementById("tab-historico");
    if (!container) return;

    const salvosRem = lerSalvo(CHAVE_REMEDIOS);
    const todos = listarTodosRemedios();
    const remediosFeitos = salvosRem
        .map(s => ({ ...todos.find(t => t.id === s.id), em: s.em }))
        .filter(x => x.id);

    const salvosAl = lerSalvo(CHAVE_ALERTAS);
    const alertasFeitos = salvosAl
        .map(s => ({ ...alertas.find(a => a.id === s.id), em: s.em }))
        .filter(x => x.id);

    const htmlRem = remediosFeitos.map(i => `
        <div class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
            <div>
                <p class="font-semibold text-slate-800 text-sm">${i.nomeResidente} <span class="text-xs font-normal text-slate-500">(Quarto ${i.quarto})</span></p>
                <p class="text-xs text-slate-500">${i.nomeRemedio} • previsto ${i.horario} • feito às ${i.em}</p>
            </div>
            <button type="button" onclick="desfazerTarefa('${i.id}')" class="text-sm text-slate-500 hover:text-indigo-600 cursor-pointer">
                <i class="fa-solid fa-rotate-left mr-1"></i> Desfazer
            </button>
        </div>
    `).join("") || '<p class="text-sm text-slate-500">Nenhum remédio concluído ainda.</p>';

    const htmlAl = alertasFeitos.map(a => `
        <div class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
            <div>
                <p class="font-semibold text-slate-800 text-sm">${a.titulo}</p>
                <p class="text-xs text-slate-500">Quarto ${a.quarto} • ocorreu ${a.hora} • resolvido às ${a.em}</p>
            </div>
            <button type="button" onclick="reabrirAlerta('${a.id}')" class="text-sm text-slate-500 hover:text-indigo-600 cursor-pointer">
                <i class="fa-solid fa-rotate-left mr-1"></i> Reabrir
            </button>
        </div>
    `).join("") || '<p class="text-sm text-slate-500">Nenhum alerta resolvido ainda.</p>';

    container.innerHTML = `
        <h2 class="text-xl font-bold text-slate-700"><i class="fa-solid fa-clock-rotate-left text-indigo-600 mr-2"></i> Histórico</h2>
        <div>
            <h3 class="text-sm font-bold text-slate-600 mb-2">Remédios administrados (${remediosFeitos.length})</h3>
            <div class="space-y-2">${htmlRem}</div>
        </div>
        <div>
            <h3 class="text-sm font-bold text-slate-600 mb-2 mt-4">Alertas resolvidos (${alertasFeitos.length})</h3>
            <div class="space-y-2">${htmlAl}</div>
        </div>
    `;
}

// ---------- 3. RESIDENTES (agora com Filtro de Busca) ----------
function renderizarResidentes(filtro = "") {
  const container = document.getElementById("lista-residentes-cards");
  if (!container) return;

  const termo = filtro.toLowerCase().trim();

  const residentesFiltrados = residentes.filter(residente => {
    const nomeMatch = residente.nome.toLowerCase().includes(termo);
    const quartoMatch = String(residente.quarto).includes(termo);
    return nomeMatch || quartoMatch;
  });

  if (residentesFiltrados.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200">
        <i class="fa-solid fa-user-slash text-3xl text-slate-400 mb-2"></i>
        <p class="font-semibold text-slate-700">Nenhum residente encontrado</p>
        <p class="text-sm">Tente buscar por outro nome ou número de quarto.</p>
      </div>`;
    return;
  }

  container.innerHTML = residentesFiltrados.map(residente => {
    const htmlRemedios = (residente.remedios || []).map(remedio => `
      <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mt-2">
        <div>
          <p class="text-sm font-medium text-slate-700">${remedio.nome}</p>
          <p class="text-xs text-slate-500">Horário: ${remedio.horario}</p>
        </div>
        <span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color: ${remedio.urgencia.cor}">
          ${remedio.urgencia.nome}
        </span>
      </div>
    `).join("");

    return `
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 class="font-bold text-slate-800">${residente.nome} 
          <span class="text-xs font-normal text-slate-500">(Quarto ${residente.quarto})</span>
        </h3>
        <p class="text-xs text-slate-500">Idade: ${residente.idade} anos | Tipo sanguíneo: ${residente.tipoSanguineo}</p>
        <div class="mt-2">${htmlRemedios}</div>
      </div>
    `;
  }).join("");
}

function filtrarResidentes() {
  const input = document.getElementById("busca-residentes");
  if (input) {
    renderizarResidentes(input.value);
  }
}

// ---------- 4. TROCA DE ABAS ----------
function mudarAba(aba) {
    ["agenda", "alertas", "historico", "residentes"].forEach(nome => {
        const secao = document.getElementById("tab-" + nome);
        const botao = document.getElementById("btn-" + nome);
        if (!secao || !botao) return;

        const ativa = nome === aba;
        secao.classList.toggle("hidden", !ativa);
        botao.classList.toggle("text-indigo-600", ativa);
        botao.classList.toggle("text-slate-500", !ativa);
    });

    if (aba === "residentes") renderizarResidentes();
    else if (aba === "agenda") renderizarAgenda();
    else if (aba === "alertas") renderizarAlertas();
    else if (aba === "historico") renderizarHistorico();
}

// ---------- 5. LOGIN / SAIR ----------
function sair() {
    sessionStorage.removeItem("remedinhos_usuario");
    location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const nome = sessionStorage.getItem("remedinhos_usuario");
    const campoNome = document.getElementById("nome-usuario");
    if (nome && campoNome) campoNome.textContent = nome;

    renderizarResidentes();
    atualizarTudo();
});
