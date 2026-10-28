// =====================================================
// attendance.js - Matriz mensual de asistencia
// PROTOTIPO: los datos son ficticios y nada se envía a ningún servidor.
// =====================================================


// ---------- 1. DATOS DE EJEMPLO (ficticios) ----------

// Lista de colaboradores. Cada uno es un "objeto" con sus datos.
const colaboradores = [
  { id: "E001", nombre: "Lucía",     apellido: "Acosta",    contrato: "Por tiempo indeterminado" },
  { id: "E002", nombre: "Martín",    apellido: "Benítez",   contrato: "Pasantía" },
  { id: "E003", nombre: "Carolina",  apellido: "Domínguez", contrato: "Por tiempo indeterminado" },
  { id: "E004", nombre: "Tomás",     apellido: "Escobar",   contrato: "Eventual" },
  { id: "E005", nombre: "Valentina", apellido: "Ferreyra",  contrato: "Por tiempo indeterminado" },
  { id: "E006", nombre: "Joaquín",   apellido: "Giménez",   contrato: "Pasantía" },
  { id: "E007", nombre: "Florencia", apellido: "Herrera",   contrato: "Por tiempo indeterminado" },
  { id: "E008", nombre: "Nicolás",   apellido: "Ibarra",    contrato: "Eventual" }
];

// Función para ordenar alfabéticamente: primero por apellido y, si coinciden, por nombre.
// localeCompare con "es" respeta las tildes y la ñ.
function compararPorApellido(a, b) {
  const porApellido = a.apellido.localeCompare(b.apellido, "es");
  if (porApellido !== 0) {
    return porApellido;
  }
  return a.nombre.localeCompare(b.nombre, "es");
}
colaboradores.sort(compararPorApellido);

const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                       "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Iniciales de los días. El orden es el de JavaScript: 0 = domingo, 1 = lunes... 6 = sábado.
const INICIALES_DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];


// ---------- 2. EL MODELO DE DATOS ----------

// Solo guardamos los días PRESENTES (igual que va a hacer la base de datos).
// Cada presente es un texto con el formato "E001|2026-10-23" (id del colaborador | fecha).
// Un "Set" es una colección sin repetidos, ideal para preguntar "¿está o no está?".
//
// - guardadas: lo que está confirmado (sería lo que ya está en la base de datos).
// - actuales:  lo que se ve en pantalla, con los cambios todavía sin guardar.
const guardadas = new Set();
const actuales = new Set();

// Funciones chicas para armar los textos de fecha y de clave.
function dosDigitos(numero) {
  return String(numero).padStart(2, "0");       // 7 se convierte en "07"
}

// El mes va de 0 a 11 (enero = 0), por eso se le suma 1 para escribirlo.
function armarFecha(anio, mes, dia) {
  return anio + "-" + dosDigitos(mes + 1) + "-" + dosDigitos(dia);   // formato AAAA-MM-DD
}

function armarClave(idColaborador, fecha) {
  return idColaborador + "|" + fecha;
}

function esFinDeSemana(diaSemana) {
  return diaSemana === 0 || diaSemana === 6;    // domingo o sábado
}

// Carga asistencias de ejemplo para los días hábiles ANTERIORES a hoy en el mes en curso.
// Cada tanto se "salta" un día para que haya ausencias de ejemplo.
function cargarDatosDeEjemplo() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();

  // "for" repite un bloque de código. Acá: una vuelta por cada colaborador...
  for (let i = 0; i < colaboradores.length; i++) {
    // ...y adentro, una vuelta por cada día del mes anterior a hoy.
    for (let dia = 1; dia < hoy.getDate(); dia++) {
      const diaSemana = new Date(anio, mes, dia).getDay();
      const esHabil = !esFinDeSemana(diaSemana);
      const ausente = (dia + i * 3) % 9 === 0;  // "%" es el resto de una división: ausencias de ejemplo
      if (esHabil && !ausente) {
        guardadas.add(armarClave(colaboradores[i].id, armarFecha(anio, mes, dia)));
      }
    }
  }

  // Al empezar, lo que se ve es igual a lo guardado.
  for (const clave of guardadas) {
    actuales.add(clave);
  }
}


// ---------- 3. ELEMENTOS DE LA PÁGINA ----------

const selectorMes = document.getElementById("selector-mes");
const selectorAnio = document.getElementById("selector-anio");
const tituloMes = document.getElementById("titulo-mes");
const tabla = document.getElementById("matriz");
const botonGuardar = document.getElementById("boton-guardar");
const textoEstado = document.getElementById("estado-guardado");
const detallePayload = document.getElementById("detalle-payload");
const cuadroPayload = document.getElementById("cuadro-payload");

// Función de ayuda: crea un elemento HTML (td, th, etc.) con texto y clase opcionales.
// Usamos "textContent" y no "innerHTML" a propósito: los nombres van a venir de un
// servidor, y con innerHTML se podría colar código malicioso en la página.
function crearElemento(etiqueta, texto, clase) {
  const elemento = document.createElement(etiqueta);
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  if (clase) {
    elemento.className = clase;
  }
  return elemento;
}

function crearEncabezado(texto, clase) {
  const th = crearElemento("th", texto, clase);
  th.scope = "col";                             // le avisa a los lectores de pantalla que es título de columna
  return th;
}


// ---------- 4. DIBUJAR LA MATRIZ ----------

// Posición de la casilla "activa" para el teclado (fila 0 = primer colaborador, día 1).
const posicion = { fila: 0, dia: 1 };

// Busca la casilla de una fila y un día. Devuelve null si no existe.
function casillaEn(fila, dia) {
  return tabla.querySelector('input[data-fila="' + fila + '"][data-dia="' + dia + '"]');
}

function dibujarMatriz() {
  const anio = Number(selectorAnio.value);
  const mes = Number(selectorMes.value);

  // El "día 0" del mes siguiente es el último día de este mes: así sabemos si tiene 28, 29, 30 o 31 días.
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  tituloMes.textContent = NOMBRES_MESES[mes] + " " + anio;
  tabla.textContent = "";                       // vaciamos la tabla antes de dibujarla de nuevo

  // Título de la tabla para lectores de pantalla (no se ve).
  tabla.appendChild(crearElemento("caption", "Asistencia de " + NOMBRES_MESES[mes] + " " + anio, "visualmente-oculto"));

  // ----- Encabezado: 3 columnas fijas + una columna por día -----
  const thead = document.createElement("thead");
  const filaTitulos = document.createElement("tr");

  filaTitulos.appendChild(crearEncabezado("ID", "col-id"));
  filaTitulos.appendChild(crearEncabezado("Apellido y nombre", "col-nombre"));
  filaTitulos.appendChild(crearEncabezado("Tipo de contrato", "col-contrato"));

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const diaSemana = new Date(anio, mes, dia).getDay();
    const th = crearEncabezado(dia + " " + INICIALES_DIAS[diaSemana], "dia");
    if (esFinDeSemana(diaSemana)) {
      th.classList.add("fin-de-semana");        // classList.add agrega una clase CSS
    }
    filaTitulos.appendChild(th);
  }
  thead.appendChild(filaTitulos);
  tabla.appendChild(thead);

  // ----- Cuerpo: una fila por colaborador -----
  const tbody = document.createElement("tbody");

  for (let f = 0; f < colaboradores.length; f++) {
    const c = colaboradores[f];
    const fila = document.createElement("tr");

    fila.appendChild(crearElemento("td", c.id, "col-id"));
    const celdaNombre = crearElemento("th", c.apellido + ", " + c.nombre, "col-nombre");
    celdaNombre.scope = "row";                  // título de fila, para lectores de pantalla
    fila.appendChild(celdaNombre);
    fila.appendChild(crearElemento("td", c.contrato, "col-contrato"));

    for (let dia = 1; dia <= diasDelMes; dia++) {
      const diaSemana = new Date(anio, mes, dia).getDay();
      const fecha = armarFecha(anio, mes, dia);

      let claseCelda = "dia";
      if (esFinDeSemana(diaSemana)) {
        claseCelda = "dia fin-de-semana";
      }
      const celda = crearElemento("td", undefined, claseCelda);

      const casilla = document.createElement("input");
      casilla.type = "checkbox";
      casilla.checked = actuales.has(armarClave(c.id, fecha));   // tildada si está en "actuales"
      casilla.tabIndex = -1;                    // solo UNA casilla será alcanzable con Tab (la activa)

      // "data-..." son datos escondidos que dejamos pegados a cada casilla para saber de quién es.
      casilla.dataset.fila = f;
      casilla.dataset.dia = dia;
      casilla.dataset.empleado = c.id;
      casilla.dataset.fecha = fecha;

      // Nombre accesible: lo que lee un lector de pantalla al llegar a la casilla.
      casilla.setAttribute("aria-label", c.apellido + ", " + c.nombre + " - día " + dia);

      celda.appendChild(casilla);
      fila.appendChild(celda);
    }
    tbody.appendChild(fila);
  }
  tabla.appendChild(tbody);

  // La casilla activa vuelve a ser la primera (colaborador 1, día 1).
  posicion.fila = 0;
  posicion.dia = 1;
  const primera = casillaEn(0, 1);
  if (primera) {
    primera.tabIndex = 0;
  }
}


// ---------- 5. INTERACCIÓN: TECLADO Y CLIC ----------

// En vez de poner un "oyente" en cada casilla (cientos), ponemos UNO solo en la tabla.
// Los eventos "suben" desde la casilla hasta la tabla, y acá vemos cuál fue.
// A eso se le llama "delegación de eventos".

// Flechas: mueven el foco a la casilla vecina. La barra espaciadora ya marca/desmarca
// por sí sola en una casilla, así que no hace falta programarla.
function manejarTeclas(evento) {
  const casilla = evento.target;
  if (casilla.tagName !== "INPUT") {
    return;                                     // si no es una casilla, no hacemos nada
  }

  let fila = Number(casilla.dataset.fila);
  let dia = Number(casilla.dataset.dia);

  if (evento.key === "ArrowRight") {
    dia++;                                      // dia++ significa dia = dia + 1
  } else if (evento.key === "ArrowLeft") {
    dia--;
  } else if (evento.key === "ArrowDown") {
    fila++;
  } else if (evento.key === "ArrowUp") {
    fila--;
  } else {
    return;                                     // otra tecla: la dejamos funcionar normal
  }

  evento.preventDefault();                      // evita que la página se desplace con las flechas
  const destino = casillaEn(fila, dia);
  if (destino) {
    destino.focus();                             // si llegamos al borde de la tabla, no pasa nada
  }
}

// Cada vez que una casilla recibe el foco (por teclado o clic), pasa a ser la "activa":
// es la única que se alcanza con Tab, y así la tabla entera cuenta como UNA sola parada.
function alEnfocar(evento) {
  const casilla = evento.target;
  if (casilla.tagName !== "INPUT") {
    return;
  }
  const anterior = casillaEn(posicion.fila, posicion.dia);
  if (anterior) {
    anterior.tabIndex = -1;
  }
  casilla.tabIndex = 0;
  posicion.fila = Number(casilla.dataset.fila);
  posicion.dia = Number(casilla.dataset.dia);
}

// Cuando se tilda o destilda una casilla, actualizamos "actuales".
function alCambiar(evento) {
  const casilla = evento.target;
  if (casilla.tagName !== "INPUT") {
    return;
  }
  const clave = armarClave(casilla.dataset.empleado, casilla.dataset.fecha);
  if (casilla.checked) {
    actuales.add(clave);                        // presente: lo agregamos
  } else {
    actuales.delete(clave);                     // ausente: lo sacamos (no se guardan los ausentes)
  }
  actualizarEstado();
}

tabla.addEventListener("keydown", manejarTeclas);
tabla.addEventListener("focusin", alEnfocar);
tabla.addEventListener("change", alCambiar);


// ---------- 6. CAMBIOS Y GUARDADO ----------

// Convierte "E001|2026-10-23" en un objeto con el formato que usaría la API.
function armarCambio(clave, estado) {
  const partes = clave.split("|");              // split corta el texto en la "|"
  return { employee_id: partes[0], date: partes[1], status: estado };
}

// Compara "actuales" con "guardadas" y arma la lista de diferencias:
// - lo que está en pantalla pero no estaba guardado: status true (se agregó un presente)
// - lo que estaba guardado pero ya no está en pantalla: status false (se quitó)
function calcularCambios() {
  const cambios = [];
  for (const clave of actuales) {
    if (!guardadas.has(clave)) {
      cambios.push(armarCambio(clave, true));
    }
  }
  for (const clave of guardadas) {
    if (!actuales.has(clave)) {
      cambios.push(armarCambio(clave, false));
    }
  }
  return cambios;
}

// Actualiza el texto de estado y activa o desactiva el botón.
function actualizarEstado() {
  const cantidad = calcularCambios().length;
  botonGuardar.disabled = (cantidad === 0);
  if (cantidad === 0) {
    textoEstado.textContent = "Sin cambios pendientes";
  } else if (cantidad === 1) {
    textoEstado.textContent = "1 cambio sin guardar";
  } else {
    textoEstado.textContent = cantidad + " cambios sin guardar";
  }
}

// Botón "Guardar cambios". En el sistema real, acá se enviaría el paquete al servidor
// con POST /api/attendance/bulk. En el prototipo solo lo mostramos.
function guardarCambios() {
  const cambios = calcularCambios();
  if (cambios.length === 0) {
    return;
  }

  // JSON.stringify convierte el objeto en texto; el "2" es la sangría para que se lea bien.
  cuadroPayload.textContent = JSON.stringify({ changes: cambios }, null, 2);
  detallePayload.hidden = false;
  detallePayload.open = true;

  // Lo que estaba en pantalla pasa a ser "lo guardado".
  guardadas.clear();
  for (const clave of actuales) {
    guardadas.add(clave);
  }

  actualizarEstado();
  textoEstado.textContent = "Guardado (simulado: no se envió a ningún servidor)";
}

botonGuardar.addEventListener("click", guardarCambios);


// ---------- 7. SELECTORES DE MES Y AÑO ----------

function prepararSelectores() {
  const hoy = new Date();

  for (let m = 0; m < 12; m++) {
    const opcion = crearElemento("option", NOMBRES_MESES[m]);
    opcion.value = m;
    selectorMes.appendChild(opcion);
  }

  // Del año anterior al siguiente.
  for (let a = hoy.getFullYear() - 1; a <= hoy.getFullYear() + 1; a++) {
    const opcion = crearElemento("option", String(a));
    opcion.value = a;
    selectorAnio.appendChild(opcion);
  }

  // Por defecto: el mes y el año en curso.
  selectorMes.value = hoy.getMonth();
  selectorAnio.value = hoy.getFullYear();
}

selectorMes.addEventListener("change", dibujarMatriz);
selectorAnio.addEventListener("change", dibujarMatriz);


// ---------- 8. ARRANQUE ----------
// Se ejecuta una vez al cargar la página.
prepararSelectores();
cargarDatosDeEjemplo();
dibujarMatriz();
actualizarEstado();