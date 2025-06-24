
document.addEventListener('DOMContentLoaded', function() {
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

const calendario = document.querySelector("#calendario");
const setaVoltar = document.querySelector("#setaVoltar");
const setaAvancar = document.querySelector("#setaAvancar");

const dataAtual = new Date();
const diaAtual = dataAtual.getDate();
const mesAtual = dataAtual.getMonth();
const anoAtual = dataAtual.getFullYear();

let aAux = 0; 
let mAux = 0; 

const ESTADOS = {
    STREAK: 1,
    BLOQUEIO: 2,
    SEM_STREAK: 3,
    DIA_ATUAL: 4,
    DIA_FUTURO: 5
};

const ESTADO_NAMES = {
    1: "Streak",
    2: "Bloqueio",
    3: "Sem Streak",
    4: "Dia Atual",
    5: "Dia Futuro"
};

async function atualizaEstadoDiaDB(data, dayData) {
    try {
        await fetch(`http://localhost:3000/dias/${data}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dayData)
        });
    } catch (error) {
        console.error('Error updating day state:', error);
    }
}

async function getEstadodiaAnterior(dia, mes, ano) {
    const previousDate = new Date(ano, mes, dia - 1);
    const prevDia = previousDate.getDate();
    const prevMes = previousDate.getMonth();
    const prevAno = previousDate.getFullYear();
    
    const prevDataStr = `${prevAno}-${(prevMes + 1).toString().padStart(2, '0')}-${prevDia.toString().padStart(2, '0')}`;
    
    try {
        const response = await fetch(`http://localhost:3000/dias/${prevDataStr}`);
        if (response.ok) {
            const prevDayData = await response.json();
            return prevDayData.estado;
        } else {
            // checar recursivamente se o dia anterior existe
            return await getEstadoDia(prevDia, prevMes, prevAno);
        }
    } catch (error) {
        console.error('Error fetching previous day state:', error);
        return ESTADOS.SEM_STREAK;
    }
}

async function getEstadoDia(dia, mes = mesAtual + mAux, ano = anoAtual + aAux) {
    const data = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const currentDate = new Date(anoAtual, mesAtual, diaAtual);
    const dayDate = new Date(ano, mes, dia);
    
    dayDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    try {
        let response = await fetch(`http://localhost:3000/dias/${data}`);
        let dayData;
        
        if (!response.ok) {
            const initialState = dayDate > currentDate ? ESTADOS.DIA_FUTURO : ESTADOS.STREAK;
            dayData = {
                id: data,
                estado: initialState,
                data: data,
                tarefas: ""
            };
            
            await fetch('http://localhost:3000/dias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dayData)
            });
        } else {
            dayData = await response.json();
        }
        
        const tarefas = await getTarefasDia(dia, mes, ano);
        
        let novoEstado;
        
        if (dayDate > currentDate) {
            novoEstado = ESTADOS.DIA_FUTURO;
        } else if (dayDate.getTime() === currentDate.getTime()) {
            if (tarefas.length === 0) {
                novoEstado = ESTADOS.DIA_ATUAL;
            } else {
                const allTasksComplete = tarefas.every(tarefa => tarefa.completo);
                novoEstado = allTasksComplete ? ESTADOS.STREAK : ESTADOS.DIA_ATUAL;
            }
        } else {
            if (tarefas.length === 0) {
                novoEstado = ESTADOS.STREAK;
            } else {
                const allTasksComplete = tarefas.every(tarefa => tarefa.completo);
                
                if (allTasksComplete) {
                    novoEstado = ESTADOS.STREAK;
                } else {
                    const previousDayState = await getEstadodiaAnterior(dia, mes, ano);
                    novoEstado = (previousDayState === ESTADOS.STREAK) ? ESTADOS.BLOQUEIO : ESTADOS.SEM_STREAK;
                }
            }
        }
        
        if (novoEstado !== dayData.estado) {
            await atualizaEstadoDiaDB(data, { ...dayData, estado: novoEstado });
        }
        
        return novoEstado;
        
    } catch (error) {
        console.error('Error fetching day state:', error);
        return ESTADOS.DIA_FUTURO;
    }
}

async function atualizaEstadoDia(dia, mes, ano, novoEstado) {
    const data = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    try {
        const response = await fetch(`http://localhost:3000/dias/${data}`);
        const dayData = await response.json();
        
        await fetch(`http://localhost:3000/dias/${data}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...dayData,
                estado: novoEstado
            })
        });
        
        criarCalendario(mesAtual + mAux, anoAtual + aAux);
    } catch (error) {
        console.error('Error updating day state:', error);
    }
}

async function criarCalendario(mes, ano) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const diasTotal = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();

    let html = `<h2 id="mesAno">${meses[mes]} ${ano}</h2>`;
    html += "<table>";
    html += "<tr><th>Dom</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sab</th></tr>";
    
    let dia = 1;
    for (let i = 0; i < 6; i++) {
        html += "<tr>";
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < primeiroDia) {
                html += "<td></td>";
            } else if (dia > diasTotal) {
                break;
            } else {
                const classes = [];
                if (dia === diaAtual && mes === mesAtual && ano === anoAtual) {
                    classes.push("diaAtual");
                } else {
                    const state = await getEstadoDia(dia, mes, ano);
                    if (state === ESTADOS.STREAK) {
                        classes.push("diaStreak");
                    } else if (state === ESTADOS.BLOQUEIO) {
                        classes.push("diaBloqueio");
                    } else if (state === ESTADOS.SEM_STREAK) {
                        classes.push("diaSemStreak");
                    }
                }
                html += `<td class="${classes.join(" ")}" onclick="cliqueDia(${dia}, ${mes}, ${ano})">${dia}</td>`;
                dia++;
            }
        }
        html += "</tr>";
    }
    html += "</table>";
    calendario.innerHTML = html;
}

async function getTarefasDia(dia, mes, ano) {
    const data = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    try {
        
        const response = await fetch(`http://localhost:3000/tarefas`);
        const allTasks = await response.json();
        
        
        const tarefasDodia = allTasks.filter(tarefa => tarefa.data === data);
        
        return tarefasDodia;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

function fecharPopupDia() {
    document.getElementById("overlayDia").style.display = "none";
}

async function cliqueDia(dia, mes, ano) {
    const overlay = document.getElementById("overlayDia");
    const conteudoDia = document.getElementById("conteudo-dia");
    
    const estado = await getEstadoDia(dia, mes, ano);
    const tarefas = await getTarefasDia(dia, mes, ano);
    
    // Conteúdo estruturado como os outros modais
    let popupContent = `<h2>Dia ${dia}/${mes + 1}/${ano}</h2>`;
    
    popupContent += `<div class="estado-info">`;
    popupContent += `<strong>Estado:</strong> ${ESTADO_NAMES[estado] || 'Desconhecido'}`;
    popupContent += `</div>`;
    
    if (tarefas.length > 0) {
        popupContent += `<div class="tarefas-lista">`;
        popupContent += `<h3>Tarefas do Dia:</h3>`;
        popupContent += `<ul>`;
        tarefas.forEach(tarefa => {
            const status = tarefa.completo ? '✅' : '❌';
            popupContent += `<li>`;
            popupContent += `<div class="tarefa-titulo">${tarefa.titulo} ${status}</div>`;
            if (tarefa.descricao) {
                popupContent += `<div id="detalhe-descricao">${tarefa.descricao}</div>`;
            }
            popupContent += `</li>`;
        });
        popupContent += `</ul>`;
        popupContent += `</div>`;
    } else {
        popupContent += `<p id="texto-modal">Nenhuma tarefa registrada para este dia.</p>`;
    }
    
    conteudoDia.innerHTML = popupContent;
    overlay.style.display = "flex";
}

async function changeState(dia, mes, ano, novoEstado) {
    await atualizaEstadoDia(dia, mes, ano, novoEstado);
    document.querySelector('#popUpDia').style.display = 'none';
}


setaVoltar.addEventListener("click", () => {
    mAux--;
    if (mesAtual + mAux < 0) {
        mAux = -mesAtual + 11;
        aAux--;
    }
    criarCalendario(mesAtual + mAux, anoAtual + aAux);
});

setaAvancar.addEventListener("click", () => {
    mAux++;
    if (mesAtual + mAux > 11) {
        mAux = -mesAtual;
        aAux++;
    }
    criarCalendario(mesAtual + mAux, anoAtual + aAux);
});

criarCalendario(mesAtual, anoAtual);