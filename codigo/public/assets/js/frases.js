// Variável global para armazenar as frases
let frasesMotivacionais = [];

// Função para carregar frases do arquivo JSON
async function carregarFrases() {
    try {
        const response = await fetch('http://localhost:3000/frases_motivacionais');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        
        // A resposta já deve ser o array de frases diretamente
        frasesMotivacionais = data;
        
        console.log('Frases carregadas:', frasesMotivacionais); // Para debug
        mostrarFraseAleatoria();
    } catch (error) {
        console.error('Erro ao carregar frases:', error);
        document.getElementById('frase').textContent = "Erro ao carregar as frases.";
        document.getElementById('autor').textContent = "";
    }
}

// Função para selecionar uma frase aleatória
function selecionarFraseAleatoria() {
    if (frasesMotivacionais.length === 0) {
        return {
            frase: "Nenhuma frase disponível",
            autor: ""
        };
    }
    const indiceAleatorio = Math.floor(Math.random() * frasesMotivacionais.length);
    return frasesMotivacionais[indiceAleatorio];
}

// Função para exibir a frase na tela
function mostrarFraseAleatoria() {
    const fraseSelecionada = selecionarFraseAleatoria();
    document.getElementById('frase').textContent = `"${fraseSelecionada.frase}"`;
    document.getElementById('autor').textContent = `- ${fraseSelecionada.autor}`;
}

// Função para atualizar com nova frase (para o botão)
function novaFrase() {
    mostrarFraseAleatoria();
}

// Carregar frases quando a página é aberta
document.addEventListener('DOMContentLoaded', carregarFrases);