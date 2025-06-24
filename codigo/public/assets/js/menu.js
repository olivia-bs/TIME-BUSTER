const menuIcon = document.getElementById("icone-menu");
const menu = document.querySelector(".menu");
const temaIcon = document.getElementById("icone-tema");
const temaLoader = document.querySelector("#temas");

// Menu abre/fecha
if (menuIcon && menu) {
  menuIcon.addEventListener("click", function () {
    menuIcon.classList.toggle("aberto");
    const displayStyle = window.getComputedStyle(menu).display;
    menu.style.display = displayStyle === "none" ? "block" : "none";
  });
}
// Carrega temas
async function inicializaTema() {
  try {
    const configResponse = await fetch("http://localhost:3000/temaConfig");
    const temaConfig = await configResponse.json();

    const temaResponse = await fetch(
      `http://localhost:3000/tema/${temaConfig.currentTheme}`
    );
    const themeData = await temaResponse.json();

    applyTheme(themeData);
  } catch (error) {
    console.error("Erro carregando tema inicial:", error);
  }
}

if (temaIcon) {
  temaIcon.addEventListener("click", async function () {
    try {
      const configResponse = await fetch("http://localhost:3000/temaConfig");
      const temaConfig = await configResponse.json();

      const novoTema = temaConfig.currentTheme === 1 ? 2 : 1;

      const temaResponse = await fetch(
        `http://localhost:3000/tema/${novoTema}`
      );
      const themeData = await temaResponse.json();

      const updateResponse = await fetch('http://localhost:3000/temaConfig', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        currentTheme: novoTema 
    })
});

      if (!updateResponse.ok) {
        throw new Error("falha ao atualizar tema");
      }

      applyTheme(themeData);
    } catch (error) {
      console.error("Erro mudando tema:", error);
    }
  });
}

function applyTheme(themeData) {
  if (!themeData) {
    console.error("sem dados de tema disponíveis");
    return;
  }

  // Seta variáveis CSS para o tema
  document.documentElement.style.setProperty(
    "--background-color",
    themeData.corFundo
  );
  document.documentElement.style.setProperty(
    "--text-color",
    themeData.corTexto
  );
  document.documentElement.style.setProperty(
    "--color3",
    themeData.corSecundaria
  );
  document.documentElement.style.setProperty(
    "--color4",
    themeData.corTerciaria
  );
}

inicializaTema();

/*
const menuIcon = document.getElementById('icone-menu');
const menu = document.querySelector('.menu');
const temaIcon = document.getElementById('icone-tema');
const temaLoader = document.querySelector('#temas');

// Menu abre/fecha
if (menuIcon && menu) {
    menuIcon.addEventListener('click', function() {
        menuIcon.classList.toggle('aberto');
        const displayStyle = window.getComputedStyle(menu).display;
        menu.style.display = displayStyle === 'none' ? 'block' : 'none';
    });
}

// Carrega temas
async function inicializaTema() {
    try {
        const configResponse = await fetch('http://localhost:3000/temaConfig');
        const temaConfig = await configResponse.json();
        
        // Access the currentTheme directly from temaConfig
        const currentTheme = temaConfig.currentTheme;
        
        const temaResponse = await fetch(`http://localhost:3000/tema/${currentTheme}`);
        const themeData = await temaResponse.json();
        
        applyTheme(themeData);
    } catch (error) {
        console.error('Erro carregando tema inicial:', error);
    }
}

if (temaIcon) {
    temaIcon.addEventListener('click', async function() {
        try {
            const configResponse = await fetch('http://localhost:3000/temaConfig');
            const temaConfig = await configResponse.json();
            
            // Get current theme directly
            const currentTheme = temaConfig.currentTheme;
            
            // Toggle between 1 and 2
            const novoTema = currentTheme === 1 ? 2 : 1;
            
            const temaResponse = await fetch(`http://localhost:3000/tema/${novoTema}`);
            const themeData = await temaResponse.json();
            
            // Update the currentTheme
            const updateResponse = await fetch('http://localhost:3000/temaConfig', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    currentTheme: novoTema 
                })
            });

            if (!updateResponse.ok) {
                throw new Error('falha ao atualizar tema');
            }
            
            applyTheme(themeData);
            
        } catch (error) {
            console.error('Erro mudando tema:', error);
        }
    });
}

function applyTheme(themeData) {
    if (!themeData) {
        console.error('sem dados de tema disponíveis');
        return;
    }

    // Seta variáveis CSS para o tema
    document.documentElement.style.setProperty('--background-color', themeData.corFundo);
    document.documentElement.style.setProperty('--text-color', themeData.corTexto);
    document.documentElement.style.setProperty('--color3', themeData.corSecundaria);
    document.documentElement.style.setProperty('--color4', themeData.corTerciaria);

    temaIcon.src = themeData.id === 1 
        ? "../../assets/images/sol.png" 
        : "../../assets/images/lua.png";
}

inicializaTema();
*/

function getstreak() {
    
    const streak = document.querySelector(".contagem-streak");
    
    if (streak) {
        
        fetch("http://localhost:3000/streak")
            .then(response => response.json())
            .then(data => {
                streak.textContent = data.sequenciaAtual;
            })
            .catch(error => {
                console.error("erro recuperando Streak", error);
                streak.textContent = "Erro";
            });
    }
}
getstreak();