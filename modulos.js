// ---------- NÓMINA: elegir un archivo ----------


const inputArchivo = document.getElementById("archivo-nomina");
const textoArchivo = document.getElementById("nombre-archivo");

const TAMANO_MAXIMO = 5 * 1024 * 1024;

function revisarArchivo() {
  const archivo = inputArchivo.files[0];       

  if (!archivo) {
    textoArchivo.textContent = "Ningún archivo seleccionado";
    return;                                    
  }


  const nombre = archivo.name.toLowerCase();
  const extensionValida = nombre.endsWith(".csv") || nombre.endsWith(".xlsx");


  if (!extensionValida) {
    textoArchivo.textContent = "Formato no permitido. Elegí un archivo .csv o .xlsx.";
    inputArchivo.value = "";                    
  } else if (archivo.size > TAMANO_MAXIMO) {
    textoArchivo.textContent = "El archivo supera los 5 MB.";
    inputArchivo.value = "";
  } else {
  
    textoArchivo.textContent = "Archivo seleccionado: " + archivo.name;
  }
}


inputArchivo.addEventListener("change", revisarArchivo);

// ---------- LEGAJO: formulario de carga manual ----------

const formLegajo = document.getElementById("form-legajo");
const mensajeLegajo = document.getElementById("mensaje-legajo");

function guardarLegajo(evento) {

  evento.preventDefault();

  mensajeLegajo.textContent = "Prototipo: por ahora no se guarda ningún dato. En la etapa 3 se va a conectar con el servidor.";
  formLegajo.reset();                         
}

formLegajo.addEventListener("submit", guardarLegajo);


// ---------- RECIBOS DE HABERES ----------

// Nombres de los meses. Los vamos a reutilizar en los calendarios de los próximos pasos.
const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                       "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Años disponibles, del más nuevo al más viejo.
const ANIOS_RECIBOS = [2026, 2025];

// Cuántos meses tienen recibo en cada año (DATOS DE EJEMPLO, ficticios).
// Acá, el 2026 tiene 9 recibos (de enero a septiembre) y el 2025 tiene los 12.
const MESES_CON_RECIBO = { 2026: 9, 2025: 12 };

const selectorAnioRecibos = document.getElementById("selector-anio-recibos");
const listaRecibos = document.getElementById("lista-recibos");

// Dibuja un botón por cada mes con recibo del año elegido.
function mostrarRecibos() {
  const anio = selectorAnioRecibos.value;
  const cantidad = MESES_CON_RECIBO[anio];

  listaRecibos.textContent = "";                // vaciamos la lista antes de dibujarla de nuevo

  for (let m = 0; m < cantidad; m++) {
    const item = document.createElement("li");

    // Cada mes es un enlace al PDF. En el prototipo, todos abren el mismo PDF de ejemplo.
    const enlace = document.createElement("a");
    enlace.className = "boton-mes";
    enlace.href = "documentos/recibo-ejemplo.pdf";
    enlace.target = "_blank";                   // se abre en una pestaña nueva
    enlace.rel = "noopener noreferrer";         // medida de seguridad para pestañas nuevas
    enlace.textContent = NOMBRES_MESES[m];

    // Texto extra que se oculta en pantalla pero lo leen los lectores de pantalla,
    // para que quien no ve sepa de qué año es el botón y qué va a pasar al tocarlo.
    const aviso = document.createElement("span");
    aviso.className = "visualmente-oculto";
    aviso.textContent = " " + anio + " (PDF, se abre en una pestaña nueva)";
    enlace.appendChild(aviso);

    item.appendChild(enlace);
    listaRecibos.appendChild(item);
  }
}

// Llenamos el selector de año con las opciones.
for (const anio of ANIOS_RECIBOS) {
  const opcion = document.createElement("option");
  opcion.value = anio;
  opcion.textContent = String(anio);
  selectorAnioRecibos.appendChild(opcion);
}

// Cuando se cambia de año, se vuelven a dibujar los meses.
selectorAnioRecibos.addEventListener("change", mostrarRecibos);

// Al cargar la página, mostramos los del primer año de la lista (2026).
mostrarRecibos();



// =====================================================
// CALENDARIO DE SOLICITUDES (vacaciones y, en el próximo paso, licencias)
// Se arma con dos funciones que se pueden reutilizar:
//   - crearCalendario: dibuja el calendario y guarda los días elegidos.
//   - iniciarSolicitud: conecta el calendario con el resumen y el botón de enviar.
// =====================================================

// Iniciales de la semana. En Argentina la semana empieza el lunes.
const INICIALES_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Funciones de ayuda para trabajar con fechas.
function dosDigitos(numero) {
  return String(numero).padStart(2, "0");       // 7 se convierte en "07"
}

// Arma una fecha con el formato AAAA-MM-DD. El mes va de 0 a 11 (enero = 0), por eso se le suma 1.
function armarFecha(anio, mes, dia) {
  return anio + "-" + dosDigitos(mes + 1) + "-" + dosDigitos(dia);
}

// Convierte "2026-11-05" en "05/11/2026", que es como lo escribimos en Argentina.
function formatearFecha(fecha) {
  const partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}


// ---------- 1. EL CALENDARIO ----------
// Recibe tres cosas:
//   raiz: el elemento de la página donde se dibuja.
//   noDisponibles: un objeto con los días no disponibles y su motivo (ej. {"2026-11-05": "Fecha bloqueada"}).
//   alCambiar: una función que se ejecuta cada vez que cambia la selección.
function crearCalendario(raiz, noDisponibles, alCambiar) {
  const hoy = new Date();
  const hoyAnio = hoy.getFullYear();
  const hoyMes = hoy.getMonth();
  const hoyDia = hoy.getDate();
  const LIMITE_MESES = 12;                      // se puede avanzar hasta 12 meses

  // Los días elegidos. Cada calendario tiene los suyos: las funciones de adentro
  // pueden usar las variables de afuera, así cada calendario "se acuerda" de sus datos.
  const seleccionados = new Set();

  // Mes y año que se están mirando. Usamos "let" porque estos valores van cambiando.
  let anio = hoyAnio;
  let mes = hoyMes;

  // ----- Partes que se crean una sola vez: el encabezado y la grilla vacía -----
  const encabezado = document.createElement("div");
  encabezado.className = "calendario-encabezado";

  const botonAnterior = document.createElement("button");
  botonAnterior.type = "button";                // "button" evita que actúe como botón de formulario
  botonAnterior.className = "calendario-flecha";
  botonAnterior.textContent = "‹";
  botonAnterior.setAttribute("aria-label", "Mes anterior");   // nombre para lectores de pantalla

  const titulo = document.createElement("strong");
  titulo.className = "calendario-titulo";
  titulo.setAttribute("aria-live", "polite");   // los lectores de pantalla anuncian el cambio de mes

  const botonSiguiente = document.createElement("button");
  botonSiguiente.type = "button";
  botonSiguiente.className = "calendario-flecha";
  botonSiguiente.textContent = "›";
  botonSiguiente.setAttribute("aria-label", "Mes siguiente");

  encabezado.appendChild(botonAnterior);
  encabezado.appendChild(titulo);
  encabezado.appendChild(botonSiguiente);

  const cuadricula = document.createElement("div");
  cuadricula.className = "calendario-cuadricula";

  raiz.textContent = "";
  raiz.appendChild(encabezado);
  raiz.appendChild(cuadricula);

  // ----- Dibujar el mes actual -----
  function dibujar() {
    const diasDelMes = new Date(anio, mes + 1, 0).getDate();   // el "día 0" del mes siguiente es el último de este
    const mesesDesdeHoy = (anio - hoyAnio) * 12 + (mes - hoyMes);

    titulo.textContent = NOMBRES_MESES[mes] + " " + anio;
    botonAnterior.disabled = (mesesDesdeHoy <= 0);              // no se puede ir antes del mes en curso
    botonSiguiente.disabled = (mesesDesdeHoy >= LIMITE_MESES);

    cuadricula.textContent = "";                // vaciamos la grilla antes de dibujarla de nuevo

    // Primera fila: Lu Ma Mi Ju Vi Sá Do.
    for (const inicial of INICIALES_SEMANA) {
      const celda = document.createElement("span");
      celda.className = "calendario-semana";
      celda.textContent = inicial;
      cuadricula.appendChild(celda);
    }

    // Lugares vacíos antes del día 1, para que caiga en la columna correcta.
    // getDay() da 0 para domingo; con "+ 6" y "% 7" lo pasamos a una semana que empieza en lunes.
    const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7;
    for (let i = 0; i < huecos; i++) {
      cuadricula.appendChild(document.createElement("span"));
    }

    const hoySinHora = new Date(hoyAnio, hoyMes, hoyDia);

    // Un botón por cada día del mes.
    for (let dia = 1; dia <= diasDelMes; dia++) {
      const fecha = armarFecha(anio, mes, dia);
      const nombreDia = dia + " de " + NOMBRES_MESES[mes].toLowerCase();
      const esPasado = new Date(anio, mes, dia) < hoySinHora;

      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "dia-calendario";
      boton.textContent = dia;
      boton.dataset.fecha = fecha;              // dejamos la fecha pegada al botón para saber cuál es

      if (esPasado) {
        boton.disabled = true;                  // "disabled" = no se puede tocar
        boton.classList.add("dia-pasado");
        boton.setAttribute("aria-label", nombreDia + ", ya pasó");
      } else if (noDisponibles[fecha]) {
        boton.disabled = true;
        boton.classList.add("dia-no-disponible");
        boton.title = noDisponibles[fecha];     // cartelito con el motivo
        boton.setAttribute("aria-label", nombreDia + ", no disponible: " + noDisponibles[fecha]);
      } else {
        const elegido = seleccionados.has(fecha);
        boton.setAttribute("aria-pressed", elegido);   // le avisa a los lectores de pantalla si está marcado
        boton.setAttribute("aria-label", nombreDia);
        if (elegido) {
          boton.classList.add("dia-elegido");
        }
      }

      if (anio === hoyAnio && mes === hoyMes && dia === hoyDia) {
        boton.classList.add("dia-hoy");
      }

      cuadricula.appendChild(boton);
    }
  }

  // ----- Cambiar de mes -----
  function cambiarMes(diferencia) {
    mes += diferencia;                          // mes += 1 significa mes = mes + 1
    if (mes < 0) {                              // pasamos de enero al diciembre anterior
      mes = 11;
      anio--;
    } else if (mes > 11) {                      // pasamos de diciembre al enero siguiente
      mes = 0;
      anio++;
    }
    dibujar();
  }

  function irAlMesAnterior() {
    cambiarMes(-1);
  }

  function irAlMesSiguiente() {
    cambiarMes(1);
  }

  // ----- Elegir o desmarcar un día -----
  // Ponemos UN solo "oyente" en toda la grilla (delegación de eventos, como en Attendance).
  function alHacerClicEnDia(evento) {
    const boton = evento.target;
    if (boton.tagName !== "BUTTON" || !boton.dataset.fecha) {
      return;                                   // si no se tocó un día, no hacemos nada
    }

    const fecha = boton.dataset.fecha;
    if (seleccionados.has(fecha)) {
      seleccionados.delete(fecha);              // estaba elegido: lo sacamos
      boton.classList.remove("dia-elegido");
      boton.setAttribute("aria-pressed", "false");
    } else {
      seleccionados.add(fecha);                 // no estaba elegido: lo agregamos
      boton.classList.add("dia-elegido");
      boton.setAttribute("aria-pressed", "true");
    }
    alCambiar(seleccionados);                   // avisamos que cambió la selección
  }

  // Borra todos los días elegidos (se usa después de enviar la solicitud).
  function vaciar() {
    seleccionados.clear();
    dibujar();
    alCambiar(seleccionados);
  }

  botonAnterior.addEventListener("click", irAlMesAnterior);
  botonSiguiente.addEventListener("click", irAlMesSiguiente);
  cuadricula.addEventListener("click", alHacerClicEnDia);

  dibujar();

  // Lo que "devuelve" la función: lo necesario para usar el calendario desde afuera.
  return { seleccionados: seleccionados, vaciar: vaciar };
}

// ---------- 2. LA SOLICITUD COMPLETA ----------
// Conecta el calendario con el resumen, el botón de enviar y el mensaje.
// "prefijo" es lo que va al final de los id del HTML ("vacaciones" o "licencias").
function iniciarSolicitud(prefijo, noDisponibles) {
  const raiz = document.getElementById("calendario-" + prefijo);
  const resumen = document.getElementById("resumen-" + prefijo);
  const botonEnviar = document.getElementById("enviar-" + prefijo);
  const mensaje = document.getElementById("mensaje-" + prefijo);

  // Algunas solicitudes (como licencias) tienen un menú para elegir el tipo; otras (vacaciones) no.
  // Si el elemento no existe, getElementById devuelve "null", y lo tratamos como "no hay menú".
  const selectorTipo = document.getElementById("tipo-" + prefijo);

  // Devuelve true si no hace falta elegir un tipo, o si ya se eligió uno.
  // "!" significa "lo contrario" y "||" significa "o".
  function tipoListo() {
    return !selectorTipo || selectorTipo.value !== "";
  }

  // Se ejecuta cada vez que la persona elige o desmarca un día (o cambia el tipo).
  function actualizarResumen(seleccionados) {
    mensaje.textContent = "";                   // si había un mensaje de "enviado", lo borramos

    // El botón solo se activa si hay al menos un día elegido Y el tipo está listo.
    botonEnviar.disabled = (seleccionados.size === 0 || !tipoListo());

    if (seleccionados.size === 0) {
      resumen.textContent = "Todavía no elegiste ningún día.";
      return;                                   // "return" corta la función acá
    }

    // El formato AAAA-MM-DD se ordena bien como texto, así que sort() alcanza.
    const ordenados = Array.from(seleccionados).sort();
    const textos = [];
    for (const fecha of ordenados) {
      textos.push(formatearFecha(fecha));
    }

    if (seleccionados.size === 1) {
      resumen.textContent = "1 día elegido: " + textos[0];
    } else {
      resumen.textContent = seleccionados.size + " días elegidos: " + textos.join(", ");
    }

    if (!tipoListo()) {
      resumen.textContent += " Falta elegir el tipo de licencia.";   // += agrega texto al final
    }
  }

  const calendario = crearCalendario(raiz, noDisponibles, actualizarResumen);

  // Si hay menú de tipo, al cambiarlo se vuelve a revisar si el botón se puede activar.
  function alCambiarTipo() {
    actualizarResumen(calendario.seleccionados);
  }

  if (selectorTipo) {
    selectorTipo.addEventListener("change", alCambiarTipo);
  }

  // Botón "Enviar solicitud". En el sistema real, acá se mandaría la solicitud al servidor.
  function enviar() {
    const cantidad = calendario.seleccionados.size;

    // Armamos el texto del tipo ANTES de limpiar todo.
    let textoTipo = "";
    if (selectorTipo) {
      textoTipo = " de tipo «" + selectorTipo.options[selectorTipo.selectedIndex].text + "»";
    }

    calendario.vaciar();                        // vaciar borra el mensaje, por eso lo escribimos DESPUÉS
    if (selectorTipo) {
      selectorTipo.value = "";                  // el menú vuelve a "Elegí un tipo"
    }

    mensaje.textContent = "Prototipo: tu solicitud de " + cantidad +
                          (cantidad === 1 ? " día" : " días") + textoTipo +
                          " NO se envió a ningún lado.";
  }

  botonEnviar.addEventListener("click", enviar);
  actualizarResumen(calendario.seleccionados);
}


// ---------- 3. DATOS DE EJEMPLO Y ARRANQUE ----------

// Cada ejemplo es [cuántos días desde hoy, motivo]. Los de vacaciones y los de licencias son distintos.
const EJEMPLOS_VACACIONES = [
  [12, "Ya ocupado por otros compañeros de tu área"],
  [13, "Ya ocupado por otros compañeros de tu área"],
  [14, "Ya ocupado por otros compañeros de tu área"],
  [30, "Fecha bloqueada por la empresa"],
  [31, "Fecha bloqueada por la empresa"]
];

const EJEMPLOS_LICENCIAS = [
  [8, "Ya tenés una licencia aprobada en esta fecha"],
  [9, "Ya tenés una licencia aprobada en esta fecha"],
  [30, "Fecha bloqueada por la empresa"],
  [31, "Fecha bloqueada por la empresa"]
];

// Convierte una lista de ejemplos en un objeto con las fechas reales, contando desde hoy.
// Así el ejemplo siempre muestra días en rojo, sin importar cuándo abras el prototipo.
function armarNoDisponiblesDeEjemplo(ejemplos) {
  const resultado = {};
  const hoy = new Date();

  for (const ejemplo of ejemplos) {
    // new Date(año, mes, día + N) suma N días y resuelve solo los cambios de mes.
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + ejemplo[0]);
    const clave = armarFecha(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    resultado[clave] = ejemplo[1];
  }
  return resultado;
}

// Ponemos en marcha las dos solicitudes, cada una con sus propios días no disponibles.
iniciarSolicitud("vacaciones", armarNoDisponiblesDeEjemplo(EJEMPLOS_VACACIONES));
iniciarSolicitud("licencias", armarNoDisponiblesDeEjemplo(EJEMPLOS_LICENCIAS));


// ---------- 3. DATOS DE EJEMPLO Y ARRANQUE ----------

// Arma un grupo de días no disponibles de ejemplo, contando desde hoy.
// Cada elemento es [cuántos días desde hoy, motivo].
function armarNoDisponiblesDeEjemplo() {
  const resultado = {};
  const hoy = new Date();
  const ejemplos = [
    [12, "Ya ocupado por otros compañeros de tu área"],
    [13, "Ya ocupado por otros compañeros de tu área"],
    [14, "Ya ocupado por otros compañeros de tu área"],
    [30, "Fecha bloqueada por la empresa"],
    [31, "Fecha bloqueada por la empresa"]
  ];

  for (const ejemplo of ejemplos) {
    // new Date(año, mes, día + N) suma N días y resuelve solo los cambios de mes.
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + ejemplo[0]);
    const clave = armarFecha(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    resultado[clave] = ejemplo[1];
  }
  return resultado;
}

// Ponemos en marcha la solicitud de vacaciones.
iniciarSolicitud("vacaciones", armarNoDisponiblesDeEjemplo());