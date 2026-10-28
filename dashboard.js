const datos = {
  "Todas las áreas": {
    rotacion: 3.5, ausentismo: 4.8, licencias: 5, clima: 78,
    rotacionMensual: [2.8, 3.1, 3.9, 3.3, 3.0, 3.5]
  },
  "Ventas": {
    rotacion: 4.1, ausentismo: 5.6, licencias: 2, clima: 75,
    rotacionMensual: [3.2, 3.6, 4.4, 3.9, 3.5, 4.1]
  },
  "Administración": {
    rotacion: 1.9, ausentismo: 2.9, licencias: 1, clima: 86,
    rotacionMensual: [1.5, 1.8, 2.2, 2.0, 1.7, 1.9]
  },
  "Depósito": {
    rotacion: 4.6, ausentismo: 6.4, licencias: 1, clima: 71,
    rotacionMensual: [3.8, 4.0, 5.2, 4.4, 4.0, 4.6]
  },
  "Atención al cliente": {
    rotacion: 3.2, ausentismo: 4.2, licencias: 1, clima: 80,
    rotacionMensual: [2.6, 3.0, 3.7, 3.0, 2.9, 3.2]
  }
};

// Lista con los nombres de las áreas (sin "Todas las áreas").
const areas = ["Ventas", "Administración", "Depósito", "Atención al cliente"];

const opcionesComunes = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: "%" }
    }
  }
};

// ---------- GRÁFICO 1: ROTACIÓN (líneas) ----------
const lienzoRotacion = document.getElementById("grafico-rotacion");
const graficoRotacion = new Chart(lienzoRotacion, {
  type: "line",                                   
  data: {
    labels: ["May", "Jun", "Jul", "Ago", "Sep", "Oct"],  
    datasets: [{
      label: "Rotación mensual (%)",              
      data: [2.8, 3.1, 3.9, 3.3, 3.0, 3.5],       
      borderColor: "#1b4965",                     
      backgroundColor: "#1b4965",                 
      tension: 0.3                               
    }]
  },
  options: opcionesComunes                        
});

// ---------- GRÁFICO 2: AUSENTISMO POR ÁREA (barras) ----------

const lienzoAusentismo = document.getElementById("grafico-ausentismo");
const graficoAusentismo = new Chart(lienzoAusentismo, {
  type: "bar",                                   
  data: {
    labels: ["Ventas", "Administración", "Depósito", "Atención al cliente"],
    datasets: [{
      label: "Ausentismo (%)",
      data: [5.6, 2.9, 6.4, 4.2],                
      backgroundColor: "#1b4965"                  
    }]
  },
  options: opcionesComunes                        
});

// ---------- SIMULADOR DE ROLES Y ÁREAS ----------

const selectorRol = document.getElementById("selector-rol");
const selectorArea = document.getElementById("selector-area");

function formatear(numero) {
  return numero.toFixed(1).replace(".", ",");   
}

function actualizarVista() {
  const rol = selectorRol.value;                
  document.getElementById("panel-personalizar").hidden = (rol === "usuario");
  
  selectorArea.options[0].disabled = (rol === "usuario");
  if (rol === "usuario" && selectorArea.value === "Todas las áreas") {
    selectorArea.value = "Ventas";              
  }

  const area = selectorArea.value;              
  const d = datos[area];                       

  document.getElementById("valor-rotacion").textContent = formatear(d.rotacion) + "%";
  document.getElementById("valor-ausentismo").textContent = formatear(d.ausentismo) + "%";
  document.getElementById("valor-licencias").textContent = d.licencias;
  document.getElementById("valor-clima").textContent = d.clima + "%";

  const nombreRol = (rol === "administrador") ? "Administrador" : "Usuario";
  document.getElementById("texto-vista").textContent = nombreRol + " - " + area;

  graficoRotacion.data.datasets[0].data = d.rotacionMensual;
  graficoRotacion.update();                     

  let etiquetas = [];
  let valores = [];
  if (area === "Todas las áreas") {
    for (const nombre of areas) {               
      etiquetas.push(nombre);                  
      valores.push(datos[nombre].ausentismo);
    }
  } else {
    etiquetas = [area, "Promedio empresa"];
    valores = [d.ausentismo, datos["Todas las áreas"].ausentismo];
  }
  graficoAusentismo.data.labels = etiquetas;
  graficoAusentismo.data.datasets[0].data = valores;
  graficoAusentismo.update();
}

selectorRol.addEventListener("change", actualizarVista);
selectorArea.addEventListener("change", actualizarVista);

actualizarVista();

// ---------- PERSONALIZACIÓN (solo Administrador) ----------

const metricas = ["rotacion", "ausentismo", "licencias", "clima"];

function actualizarTarjetas() {
  for (const nombre of metricas) {
    const casilla = document.getElementById("ver-" + nombre);     
    const tarjeta = document.getElementById("tarjeta-" + nombre);
    tarjeta.hidden = !casilla.checked;          
  }
}

for (const nombre of metricas) {
  document.getElementById("ver-" + nombre).addEventListener("change", actualizarTarjetas);
}

function cambiarTipoRotacion() {
  graficoRotacion.config.type = document.getElementById("tipo-rotacion").value;
  graficoRotacion.update();                     
}

function cambiarTipoAusentismo() {
  graficoAusentismo.config.type = document.getElementById("tipo-ausentismo").value;
  graficoAusentismo.update();
}

document.getElementById("tipo-rotacion").addEventListener("change", cambiarTipoRotacion);
document.getElementById("tipo-ausentismo").addEventListener("change", cambiarTipoAusentismo);