// URLs da API
const API_URL = "http://localhost:3000/tarefas";
const STREAK_API_URL = "http://localhost:3000/streak";
const USUARIO_API_URL = "http://localhost:3000/usuarios";
const CONQUISTAS_API_URL = "http://localhost:3000/conquistas";

let ordenarPorPrazo = false;

// ========== FUNÇÕES DO MODAL ========== //
function abrirCadastro() {
  document.getElementById("overlayCadastro").style.display = "flex";
}

function fecharCadastro() {
  document.getElementById("overlayCadastro").style.display = "none";
}

function abrirDetalhes(tarefa) {
  document.getElementById("detalhe-titulo").textContent = tarefa.titulo;
  document.getElementById("detalhe-data").textContent = "Data: " + formatarData(tarefa.data);
  document.getElementById("detalhe-descricao").textContent = "Descrição: " + tarefa.descricao;

  const checkbox = document.getElementById("detalhe-checkbox");
  checkbox.checked = tarefa.completo;

  checkbox.onchange = () => {
    tarefa.completo = checkbox.checked;
    atualizarTarefa(tarefa);
    atualizarStreakTarefa();
    verificarConquistasAoCompletar();
  };

  document.getElementById("btn-apagar").onclick = () => {
    fetch(`${API_URL}/${tarefa.id}`, { method: "DELETE" })
      .then(() => {
        fecharDetalhes();
        carregarTarefas();
        verificarConquistasAoCompletar();
      });
  };

  document.getElementById("overlayDetalhes").style.display = "flex";
}

function fecharDetalhes() {
  document.getElementById("overlayDetalhes").style.display = "none";
}

// ========== FUNÇÕES DE TAREFAS ========== //
function salvarCadastro(event) {
  event.preventDefault();

  const data = document.getElementById("data").value.trim();
  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();

  if (data && titulo) {
    const novaTarefa = { 
      data, 
      titulo, 
      descricao, 
      completo: false
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaTarefa)
    })
      .then(() => {
        fecharCadastro();
        carregarTarefas();
        atualizarStreakTarefa();
        verificarConquistasAoCompletar();
        document.getElementById("data").value = "";
        document.getElementById("titulo").value = "";
        document.getElementById("descricao").value = "";
      });
  }
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function alternarConclusao(tarefa, marcado) {
  tarefa.completo = marcado;
  atualizarTarefa(tarefa);
  atualizarStreakTarefa();
  verificarConquistasAoCompletar();
}

function atualizarTarefa(tarefa) {
  fetch(`${API_URL}/${tarefa.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tarefa)
  }).then(() => carregarTarefas());
}

function adicionarCard(tarefa) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <input 
      type="checkbox" 
      class="card-checkbox"
      ${tarefa.completo ? "checked" : ""}
    >
    <h3 class="card-titulo" style="${
      tarefa.completo ? "text-decoration: line-through;" : ""
    }">${tarefa.titulo}</h3>
    <p class="card-data">${formatarData(tarefa.data)}</p>
  `;

  const checkbox = card.querySelector(".card-checkbox");
  checkbox.onchange = (e) => alternarConclusao(tarefa, e.target.checked);

  card.onclick = (e) => {
    if (e.target.tagName !== "INPUT") abrirDetalhes(tarefa);
  };

  document.getElementById("cards-container").appendChild(card);
}

function carregarTarefas() {
  fetch(API_URL)
    .then(res => res.json())
    .then(tarefas => {
      const container = document.getElementById("cards-container");
      container.innerHTML = "";

      if (ordenarPorPrazo) {
        tarefas.sort((a, b) => new Date(a.data) - new Date(b.data));
      }

      tarefas.forEach(adicionarCard);
    });
}

// ========== FUNÇÕES DO CARROSSEL ========== //
function scrollCards(direcao) {
  const container = document.getElementById("cards-container");
  const larguraCard = 240;
  container.scrollLeft += direcao * larguraCard * 2;
}

function alternarOrdenacao() {
  ordenarPorPrazo = !ordenarPorPrazo;
  
  const icon = document.getElementById("filtro-icon");
  if (ordenarPorPrazo) {
    icon.classList.add("ativo");
    icon.title = "Ordenação ativada (prazo mais próximo)";
  } else {
    icon.classList.remove("ativo");
    icon.title = "Ordenar por data";
  }

  carregarTarefas(); 
}

// ========== SISTEMA DE STREAK ========== //
function registrarAcessoDiario() {
  const hoje = new Date().toISOString().split('T')[0];
  
  fetch(STREAK_API_URL)
    .then(resposta => resposta.json())
    .then(dadosStreak => {  
      
      if (dadosStreak.ultimoAcesso === hoje) return;

      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];
      
      const foiConsecutivo = dadosStreak.ultimoAcesso === ontemStr;
      
      let novaSequenciaAtual;
      if (foiConsecutivo) {
        novaSequenciaAtual = dadosStreak.sequenciaAtual + 1;
      } else {
        novaSequenciaAtual = 1;
      }
      
      const novaMaiorSequencia = Math.max(dadosStreak.maiorSequencia, novaSequenciaAtual);

      const novosDados = {
        sequenciaAtual: novaSequenciaAtual,
        maiorSequencia: novaMaiorSequencia,
        diasAtivos: dadosStreak.diasAtivos + 1,
        ultimoAcesso: hoje
      };

      fetch(STREAK_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novosDados)
      }).then(() => {
        carregarDadosStreak();
        verificarConquistasAoCompletar();
      });
    })
    .catch(error => {
      console.error("Erro ao registrar acesso diário:", error);
    });
}

function atualizarStreakTarefa() {
  const hoje = new Date().toISOString().split('T')[0];
  
  fetch(STREAK_API_URL)
    .then(resposta => resposta.json())
    .then(dadosStreak => {
      if (dadosStreak.ultimaTarefa === hoje) return;

      const sequenciaAtual = dadosStreak.ultimaTarefa && 
                           ehOntem(dadosStreak.ultimaTarefa, hoje) ? 
                           dadosStreak.sequenciaAtual + 1 : 1;

      const novosDados = {
        ...dadosStreak,
        sequenciaAtual,
        maiorSequencia: Math.max(dadosStreak.maiorSequencia, sequenciaAtual),
        ultimaTarefa: hoje
      };

      fetch(STREAK_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novosDados)
      }).then(() => {
        carregarDadosStreak();
        verificarConquistasAoCompletar();
      });
    });
}

function ehOntem(dataAnterior, dataAtual) {
  const umDia = 24 * 60 * 60 * 1000;
  const anterior = new Date(dataAnterior);
  const atual = new Date(dataAtual);
  return (atual - anterior) === umDia;
}

function carregarDadosStreak() {
  // Carrega dados do streak
  fetch(STREAK_API_URL)
    .then(resposta => resposta.json())
    .then(dadosStreak => {
      document.querySelectorAll('.contagem-streak').forEach(elemento => {
        elemento.textContent = dadosStreak.sequenciaAtual;
      });
      document.querySelector('.contagem-maior').textContent = dadosStreak.maiorSequencia;
      document.querySelector('.contagem-ativo').textContent = dadosStreak.diasAtivos;
    });

  const usuarioSessao = obterUsuarioSessao();
  
  if (usuarioSessao) {
    console.log('Dados do usuário da sessão:', usuarioSessao);
    
    const fotoPadrao = 'https://static-00.iconduck.com/assets.00/profile-circle-icon-2048x2048-cqe5466q.png';
    
    document.querySelectorAll('.foto, .foto-usuario').forEach(imagem => {
      imagem.src = usuarioSessao.foto || fotoPadrao;
      imagem.alt = usuarioSessao.nome || 'Usuário';
    });
    
    const nomeUsuarioElement = document.querySelector('.nome-usuario');
    if (nomeUsuarioElement) {
      nomeUsuarioElement.textContent = usuarioSessao.nome || 'Usuário';
    }
  } else {
    console.log('Nenhum usuário logado - redirecionando para login');
    window.location.href = '/modulos/login/login.html';
  }
}

function obterUsuarioSessao() {
  const usuarioJSON = sessionStorage.getItem('usuarioCorrente');
  
  if (usuarioJSON) {
    return JSON.parse(usuarioJSON);
  }
  
  return null; 
}

// ========== SISTEMA DE CONQUISTAS ========== //
function carregarConquistas() {
  fetch(CONQUISTAS_API_URL)
    .then(resposta => resposta.json())
    .then(conquistas => {
      const grid = document.getElementById('conquistas-grid');
      if (!grid) return;
      
      grid.innerHTML = '';
      
      conquistas.forEach(conquista => {
        const conquistaElement = criarElementoConquista(conquista);
        grid.appendChild(conquistaElement);
      });
    });
}

function criarElementoConquista(conquista) {
  const elemento = document.createElement('div');
  elemento.className = `conquista ${conquista.concluida ? 'concluida' : 'pendente'}`;
  
  elemento.innerHTML = `
    <div class="conquista-icon">
      <i class="${conquista.icone} ${conquista.concluida ? '' : 'desativado'}"></i>
      ${conquista.concluida ? '<div class="badge-concluida"><i class="fa-solid fa-check"></i></div>' : ''}
    </div>
    <h3>${conquista.titulo}</h3>
    <p>${conquista.descricao}</p>
    ${conquista.concluida ? 
      `<small>Concluída em: ${formatarData(conquista.dataConclusao)}</small>` : 
      '<div class="progresso">Pendente</div>'}
  `;
  
  return elemento;
}

function verificarConquistasAoCompletar() {
  fetch(CONQUISTAS_API_URL)
    .then(resposta => resposta.json())
    .then(conquistas => {
      fetch(STREAK_API_URL)
        .then(resposta => resposta.json())
        .then(streakData => {
          fetch(API_URL)
            .then(resposta => resposta.json())
            .then(tarefas => {
              const estatisticas = calcularEstatisticas(tarefas, streakData);
              const conquistasAtualizadas = atualizarConquistas(conquistas, estatisticas);
              
              conquistasAtualizadas.forEach(conquista => {
                if (conquista.atualizada) {
                  fetch(`${CONQUISTAS_API_URL}/${conquista.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(conquista)
                  });
                }
              });
              
              carregarConquistas();
            });
        });
    });
}

function calcularEstatisticas(tarefas, streakData) {
  const hoje = new Date().toISOString().split('T')[0];
  const tarefasConcluidas = tarefas.filter(t => t.completo);
  const tarefasHoje = tarefas.filter(t => t.data === hoje);
  
  return {
    totalTarefas: tarefas.length,
    tarefasConcluidas: tarefasConcluidas.length,
    tarefasConcluidasHoje: tarefasConcluidas.filter(t => t.data === hoje).length,
    streakAtual: streakData.sequenciaAtual,
    maiorStreak: streakData.maiorSequencia,
    diasAtivos: streakData.diasAtivos,
    tarefasPlanejadas: tarefas.filter(t => new Date(t.data) > new Date()).length,
    tarefasNoturnas: tarefasConcluidas.filter(t => {
      const horaConclusao = new Date(t.data).getHours();
      return horaConclusao >= 20 || horaConclusao < 8;
    }).length,
    tarefasSimultaneas: tarefas.filter(t => !t.completo).length,
    todasConcluidasHoje: tarefasHoje.length > 0 && 
                        tarefasHoje.every(t => t.completo)
  };
}

function atualizarConquistas(conquistas, estatisticas) {
  return conquistas.map(conquista => {
    if (conquista.concluida) return {...conquista, atualizada: false};
    
    let concluida = false;
    
    switch(conquista.id) {
      case 1: concluida = estatisticas.totalTarefas > 0; break;
      case 2: concluida = estatisticas.tarefasConcluidas > 0; break;
      case 3: concluida = estatisticas.tarefasConcluidasHoje >= 5; break;
      case 4: concluida = estatisticas.tarefasConcluidas >= 20; break;
      case 5: concluida = estatisticas.streakAtual >= 3; break;
      case 6: concluida = estatisticas.diasAtivos >= 7; break;
      case 7: concluida = estatisticas.tarefasPlanejadas >= 3; break;
      case 8: concluida = estatisticas.tarefasNoturnas > 0; break;
      case 9: concluida = estatisticas.tarefasNoturnas > 0; break;
      case 10: concluida = estatisticas.streakAtual >= 30; break;
      case 11: concluida = estatisticas.tarefasSimultaneas >= 5; break;
      case 12: concluida = estatisticas.todasConcluidasHoje; break;
      case 13: concluida = estatisticas.tarefasConcluidas >= 100; break;
    }
    
    return {
      ...conquista,
      concluida,
      dataConclusao: concluida ? new Date().toISOString().split('T')[0] : conquista.dataConclusao,
      atualizada: concluida !== conquista.concluida
    };
  });
}

// ========== INICIALIZAÇÃO ========== //
document.addEventListener('DOMContentLoaded', () => {
  registrarAcessoDiario();
  carregarTarefas();
  carregarDadosStreak();
  carregarConquistas();
  verificarConquistasAoCompletar();
});document.addEventListener('DOMContentLoaded', function() {
    fetch('../menu/menu.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-placeholder').innerHTML = data;
            const menuScript = document.createElement('script');
            menuScript.src = '../../assets/js/menu.js';
            document.body.appendChild(menuScript);
        })
        .catch(error => console.error('Error loading menu:', error));
});


// modal: é a caixinha que abre e sobrepõe a homepage quando 
// a gente vai adicionar ou ver os detalhes de uma tarefa

// exibe a modal de cadastro de nova tarefa
function abrirCadastro() {
  document.getElementById("overlayCadastro").style.display = "flex";
}

// oculta modal de cadastro
function fecharCadastro() {
  document.getElementById("overlayCadastro").style.display = "none";
}

// abre a modal de detalhes da tarefa
function abrirDetalhes(tarefa) {
  document.getElementById("detalhe-titulo").textContent = tarefa.titulo;
  document.getElementById("detalhe-data").textContent = "Data: " + formatarData(tarefa.data);
  document.getElementById("detalhe-descricao").textContent = "Descrição: " + tarefa.descricao;

  // define se a tarefa está marcada como completa
  const checkbox = document.getElementById("detalhe-checkbox");
  checkbox.checked = tarefa.completo;

  // quando o checkbox for alterado, atualiza a tarefa no db.json
  checkbox.onchange = () => {
    tarefa.completo = checkbox.checked;
    atualizarTarefa(tarefa);
  };

  // define ação do botão de apagar tarefa
  document.getElementById("btn-apagar").onclick = () => {
    fetch(`${API_URL}/${tarefa.id}`, { method: "DELETE" })
      .then(() => {
        fecharDetalhes(); // fecha modal
        carregarTarefas(); // recarrega os cards
      });
  };

  document.getElementById("overlayDetalhes").style.display = "flex";
}

// exibe o modal de detalhes
function fecharDetalhes() {
  document.getElementById("overlayDetalhes").style.display = "none";
}

 // salva o cadastro de uma nova tarefa no JSON Server
function salvarCadastro(event) {
  event.preventDefault();

  // pega os valores digitados no form
  const data = document.getElementById("data").value.trim();
  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();

  // verifica se a data e o titulo foram preenchidos
  if (data && titulo) {
    const novaTarefa = { 
      data, 
      titulo, 
      descricao, 
      completo: false // nova tarefa sempre começa como incompleta
    };

    // envia os dados para o servidor (POST)
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaTarefa)
    })
      .then(() => {
        // fecha o modal, limpa os campos e recarrega a tela
        fecharCadastro();
        carregarTarefas();
        document.getElementById("data").value = "";
        document.getElementById("titulo").value = "";
        document.getElementById("descricao").value = "";
      });
  }
}

// converte a data para o formato brasileiro
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// atualizaz o status de conclusão da tarefa (checkbox)
function alternarConclusao(tarefa, checked) {
  tarefa.completo = checked;
  atualizarTarefa(tarefa);
}

// envia a tarefa atualizada para o servidor
function atualizarTarefa(tarefa) {
  fetch(`${API_URL}/${tarefa.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tarefa)
  }).then(() => carregarTarefas());
}

// cria e adiciona um card de tarefa o carrossel
function adicionarCard(tarefa) {
  const card = document.createElement("div");
  card.className = "card";

  //HTML interno do card
  card.innerHTML = `
    <input 
      type="checkbox" 
      class="card-checkbox"
      ${tarefa.completo ? "checked" : ""}
    >

    <h3 class="card-titulo" style="${
      tarefa.completo ? "text-decoration: line-through;" : ""
    }">${tarefa.titulo}</h3>

    <p class="card-data">${formatarData(tarefa.data)}</p>
  `;

  // quando marca o checkbox, atualiza a tarefa
  const checkbox = card.querySelector(".card-checkbox");
  checkbox.onchange = (e) => alternarConclusao(tarefa, e.target.checked);

  // se clica no card (não na checkbox), abre os detalhes
  card.onclick = (e) => {
    if (e.target.tagName !== "INPUT") abrirDetalhes(tarefa);
  };

  // adiciona o card ao container da pagina
  document.getElementById("cards-container").appendChild(card);
}

// busca todas as tarefas do servidor e exibe os cards na tela
function carregarTarefas() {
  fetch(API_URL)
    .then(res => res.json())
    .then(tarefas => {
      const container = document.getElementById("cards-container");
      container.innerHTML = "";

      // Se o modo ordenado estiver ativado, ordena pela data
      if (ordenarPorPrazo) {
        tarefas.sort((a, b) => new Date(a.data) - new Date(b.data));
      }

      tarefas.forEach(adicionarCard);
    }
  );
}

// faz a rolagem dos cards horizontalmente (carrossel)
function scrollCards(direcao) {
  const container = document.getElementById("cards-container");
  const larguraCard = 240;
  container.scrollLeft += direcao * larguraCard * 2;
}

// altera o status do filtro e recarrega
function alternarOrdenacao() {
  ordenarPorPrazo = !ordenarPorPrazo;
  
  const icon = document.getElementById("filtro-icon");
  if (ordenarPorPrazo) {
    icon.classList.add("ativo");
    icon.title = "Ordenação ativada (prazo mais próximo)";
  } else {
    icon.classList.remove("ativo");
    icon.title = "Ordenar por data";
  }

  carregarTarefas(); 
}


// busca e exibe as tarefas quando o site carrega
carregarTarefas();
