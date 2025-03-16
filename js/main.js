// utils.js (módulo de utilidades)
//////////////////////////////////////////

// Función de debounce
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Notificaciones
function mostrarNotificacion(mensaje, tipo = "info") {
  const notif = document.createElement("div");
  notif.className = `notificacion ${tipo}`;
  notif.textContent = mensaje;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("fadeOut");
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

// Confirmar acciones críticas (centralizado para no duplicar)
function confirmarAccion(mensaje, accionSi) {
  if (confirm(mensaje)) {
    accionSi();
  }
}

// Validación robusta de inputs numéricos
// Retorna true si es válido, false si no.
function validarInputNumerico(input, min = 0, max = Infinity) {
  const valor = parseFloat(input.value);
  if (isNaN(valor) || valor < min || valor > max) {
    input.classList.add("error");
    mostrarNotificacion(`Valor inválido (entre ${min} y ${max})`, "error");
    input.value = input.defaultValue || min;
    setTimeout(() => input.classList.remove("error"), 1200);
    return false;
  }
  return true;
}


//////////////////////////////////////////
// EntidadesModule
//////////////////////////////////////////

const defaultEntidades = [
  "ID FINANCE SPAIN, S.A.U. [MONEYMAN]",
  "PLAZO CREDIT, S.L.U.",
  "4FINANCE SPAIN FINANCIAL SERVICES, S.A.U. [VIVUS]",
  "HISPANIA IURIS, S.L." // etc.
];

const EntidadesModule = (function() {
  let entidades = [];

  function init() {
    cargarDesdeLocalStorage();
    actualizarLista();
  }

  // Cargar entidades desde LocalStorage o usar default
  function cargarDesdeLocalStorage() {
    const almacenadas = JSON.parse(localStorage.getItem("entidades"));
    entidades = (almacenadas && almacenadas.length > 0)
      ? almacenadas
      : defaultEntidades;
  }

  function guardarEnLocalStorage() {
    localStorage.setItem("entidades", JSON.stringify(entidades));
  }

  // Agrega nueva entidad
  function agregar(entidad) {
    entidades.push(entidad);
    guardarEnLocalStorage();
    actualizarLista();
  }

  // Elimina una entidad
  function eliminar(index) {
    entidades.splice(index, 1);
    guardarEnLocalStorage();
    actualizarLista();
  }

  // Actualiza la lista en el DOM
  function actualizarLista() {
    const lista = document.getElementById("listaEntidades");
    if (!lista) return;
    lista.innerHTML = "";

    entidades.forEach((entidad, index) => {
      const li = document.createElement("li");
      li.title = entidad;
      li.textContent = (entidad.length > 45)
        ? entidad.substring(0, 42) + "..."
        : entidad;

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.className = "btn btn-borrar";
      btnEliminar.addEventListener("click", () => {
        confirmarAccion("¿Estás seguro de eliminar esta entidad?", () => {
          eliminar(index);
        });
      });

      li.appendChild(btnEliminar);
      lista.appendChild(li);
    });
  }

  function obtenerEntidades() {
    return [...entidades];
  }

  return {
    init,
    agregar,
    eliminar,
    actualizarLista,
    obtenerEntidades
  };
})();


//////////////////////////////////////////
// TablaDeudasModule
//////////////////////////////////////////

// Encargado de crear filas, validarlas y recalcular valores individuales

const TablaDeudasModule = (function() {

  const tablaDeudasBody = document.getElementById("tablaDeudas");

  function init() {
    // Iniciar con 1 fila
    agregarFila();
    // Escuchar cambios de input en la tabla
    if (tablaDeudasBody) {
      tablaDeudasBody.addEventListener(
        "input",
        debounce((event) => {
          if (event.target.tagName === "INPUT") {
            const fila = event.target.closest("tr");
            recalcularFila(fila);
          }
        }, 300)
      );
    }
  }

  function agregarFila() {
    if (!tablaDeudasBody) return;

    const fila = document.createElement("tr");

    // 1) N° contrato
    const tdContrato = document.createElement("td");
    const inputContrato = document.createElement("input");
    inputContrato.type = "text";
    inputContrato.placeholder = "Ej: 12345";
    tdContrato.appendChild(inputContrato);

    // 2) Tipo producto
    const tdTipo = document.createElement("td");
    const inputTipo = document.createElement("input");
    inputTipo.type = "text";
    inputTipo.placeholder = "Ej: Préstamo";
    tdTipo.appendChild(inputTipo);

    // 3) Entidad (select)
    const tdEntidad = document.createElement("td");
    const selectEntidad = document.createElement("select");
    const entidades = EntidadesModule.obtenerEntidades();
    entidades.forEach((ent) => {
      const option = document.createElement("option");
      option.value = ent;
      option.textContent = (ent.length > 45)
        ? ent.substring(0, 42) + "..."
        : ent;
      option.title = ent;
      selectEntidad.appendChild(option);
    });
    tdEntidad.appendChild(selectEntidad);

    // 4) Importe Deuda
    const tdDeudaOrig = document.createElement("td");
    const inputDeudaOrig = document.createElement("input");
    inputDeudaOrig.type = "number";
    inputDeudaOrig.placeholder = "3000";
    tdDeudaOrig.appendChild(inputDeudaOrig);

    // 5) % Descuento
    const tdDescuento = document.createElement("td");
    const inputDesc = document.createElement("input");
    inputDesc.type = "number";
    inputDesc.placeholder = "30";
    tdDescuento.appendChild(inputDesc);

    // 6) Importe con Descuento
    const tdDeudaDesc = document.createElement("td");
    const spanDeudaDesc = document.createElement("span");
    spanDeudaDesc.textContent = "0.00";
    tdDeudaDesc.appendChild(spanDeudaDesc);

    // 7) Botón eliminar
    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-borrar";
    btnEliminar.innerHTML = "🗑";
    btnEliminar.addEventListener("click", () => {
      confirmarAccion("¿Eliminar esta fila de deuda?", () => {
        tablaDeudasBody.removeChild(fila);
        SimuladorModule.calcular();
      });
    });
    tdEliminar.appendChild(btnEliminar);

    // Agregar celdas
    fila.appendChild(tdContrato);
    fila.appendChild(tdTipo);
    fila.appendChild(tdEntidad);
    fila.appendChild(tdDeudaOrig);
    fila.appendChild(tdDescuento);
    fila.appendChild(tdDeudaDesc);
    fila.appendChild(tdEliminar);

    tablaDeudasBody.appendChild(fila);
  }

  function recalcularFila(fila) {
    if (!fila) return;

    const inputDeudaOriginal = fila.querySelector("td:nth-child(4) input");
    const inputDescuento = fila.querySelector("td:nth-child(5) input");
    const spanDeudaDesc = fila.querySelector("td:nth-child(6) span");

    // Validar
    if (!validarInputNumerico(inputDeudaOriginal, 0)) {
      return;
    }
    if (!validarInputNumerico(inputDescuento, 0, 100)) {
      return;
    }

    const deudaOriginal = parseFloat(inputDeudaOriginal.value) || 0;
    const descuento = parseFloat(inputDescuento.value) || 0;
    const deudaConDesc = deudaOriginal * (1 - descuento / 100);
    spanDeudaDesc.textContent = deudaConDesc.toFixed(2);
  }

  return {
    init,
    agregarFila,
    recalcularFila
  };
})();

//////////////////////////////////////////
// HistorialModule
//////////////////////////////////////////

const HistorialModule = (function() {
  const historialContainer = document.getElementById("historialContainer");
  const historialBody = document.getElementById("historialBody");

  function guardarSimulacion(simulacion) {
    let historial = JSON.parse(localStorage.getItem("historialSimulaciones")) || [];
    historial.push(simulacion);
    localStorage.setItem("historialSimulaciones", JSON.stringify(historial));
  }

  function cargarHistorial() {
    return JSON.parse(localStorage.getItem("historialSimulaciones")) || [];
  }

  function mostrarHistorial() {
    if (!historialBody) return;
    historialBody.innerHTML = "";
    const historial = cargarHistorial();

    historial.forEach((sim) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${sim.folio}</td>
        <td>${sim.fecha}</td>
        <td>${sim.nombreDeudor}</td>
        <td>${sim.numeroDeudas}</td>
        <td>€${sim.deudaOriginal.toLocaleString('es-ES',{ minimumFractionDigits:2 })}</td>
        <td>€${sim.deudaDescontada.toLocaleString('es-ES',{ minimumFractionDigits:2 })}</td>
        <td>€${sim.ahorro.toLocaleString('es-ES',{ minimumFractionDigits:2 })}</td>
        <td>€${sim.totalAPagar.toLocaleString('es-ES',{ minimumFractionDigits:2 })}</td>
        <td><button class="btn-eliminar-historial" data-folio="${sim.folio}">Eliminar</button></td>
      `;
      historialBody.appendChild(tr);
    });

    historialContainer.style.display = "block";
  }

  function ocultarHistorial() {
    if (!historialContainer) return;
    historialContainer.style.display = "none";
  }

  function eliminarDelHistorial(folio) {
    let historial = cargarHistorial();
    historial = historial.filter((sim) => sim.folio !== folio);
    localStorage.setItem("historialSimulaciones", JSON.stringify(historial));
    mostrarHistorial();
  }

  function init() {
    if (historialBody) {
      historialBody.addEventListener("click", (e) => {
        if (e.target.matches(".btn-eliminar-historial")) {
          confirmarAccion("¿Eliminar esta simulación del historial?", () => {
            const folio = e.target.getAttribute("data-folio");
            eliminarDelHistorial(folio);
          });
        }
      });
    }
  }

  return {
    init,
    guardarSimulacion,
    mostrarHistorial,
    ocultarHistorial
  };
})();

//////////////////////////////////////////
// SimuladorModule
//////////////////////////////////////////

const SimuladorModule = (function() {

  // Variables para el plan
  let ultimoContadorFolio = 0;

  // Referencias DOM
  const inputNombreDeudor = document.getElementById("nombreDeudor");
  const inputNumCuotas = document.getElementById("numCuotas");
  const resultadoFinalDiv = document.getElementById("resultadoFinal");
  const planContainerOuter = document.getElementById("planContainerOuter");

  const planNombreDeudor   = document.getElementById("plan-nombre-deudor");
  const planNumDeudas      = document.getElementById("plan-num-deudas");
  const planDeudaTotal     = document.getElementById("plan-deuda-total");
  const planLoQueDebes     = document.getElementById("plan-lo-que-debes");
  const planLoQuePagarias  = document.getElementById("plan-lo-que-pagarias");
  const planAhorro         = document.getElementById("plan-ahorro");
  const planCuotaMensual   = document.getElementById("plan-cuota-mensual");
  const planDescuentoTotal = document.getElementById("plan-descuento-total");
  const planDuracion       = document.getElementById("plan-duracion");
  const planFecha          = document.getElementById("plan-fecha");
  const planFolio          = document.getElementById("plan-folio");
  const planTablaBody      = document.getElementById("plan-tabla-body");

  let myChart = null;

  // Cálculo principal
  function calcularDeuda(sumaOriginal, sumaDescontada, nCuotas) {
    const ahorro = sumaOriginal - sumaDescontada;
    const comisionExito = 0.25 * ahorro;
    const comisionGestion = 0.10 * sumaOriginal;
    const totalAPagar = sumaDescontada + comisionExito + comisionGestion;
    const cuotaMensual = totalAPagar / nCuotas;
    return { ahorro, comisionExito, comisionGestion, totalAPagar, cuotaMensual };
  }

  function generarNuevoFolio() {
    let contador = parseInt(localStorage.getItem("contadorFolio")) || 0;
    contador++;
    ultimoContadorFolio = contador;
    localStorage.setItem("contadorFolio", contador);

    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}`;

    return `FOLIO-${fecha}-${contador.toString().padStart(4, '0')}`;
  }

  function calcular() {
    const filas = Array.from(document.querySelectorAll("#tablaDeudas tr"));
    const nombreDeudor = inputNombreDeudor.value.trim() || "Sin nombre";

    let sumaOriginal = 0;
    let sumaDescontada = 0;
    let sumaPorcentajes = 0;
    let numeroDeudas = 0;
    let filasData = [];

    filas.forEach((fila) => {
      numeroDeudas++;
      const inputContrato   = fila.querySelector("td:nth-child(1) input");
      const inputTipo       = fila.querySelector("td:nth-child(2) input");
      const selectEntidad   = fila.querySelector("td:nth-child(3) select");
      const inputDeudaOrig  = fila.querySelector("td:nth-child(4) input");
      const inputDesc       = fila.querySelector("td:nth-child(5) input");
      const spanDeudaDesc   = fila.querySelector("td:nth-child(6) span");

      const deudaOriginal = parseFloat(inputDeudaOrig.value) || 0;
      const descuento     = parseFloat(inputDesc.value) || 0;
      const deudaConDesc  = parseFloat(spanDeudaDesc.textContent) || 0;

      sumaOriginal   += deudaOriginal;
      sumaDescontada += deudaConDesc;
      sumaPorcentajes += descuento;

      filasData.push({
        numeroContrato: inputContrato.value,
        tipoProducto: inputTipo.value,
        entidad: selectEntidad.value,
        deudaOriginal,
        deudaConDesc
      });
    });

    const nCuotas = parseInt(inputNumCuotas.value) || 1;
    const { ahorro, comisionExito, comisionGestion, totalAPagar, cuotaMensual } =
      calcularDeuda(sumaOriginal, sumaDescontada, nCuotas);

    const promedioDesc = (numeroDeudas > 0) ? (sumaPorcentajes / numeroDeudas) : 0;

    if (resultadoFinalDiv) {
      resultadoFinalDiv.style.display = "block";
      resultadoFinalDiv.innerHTML = `
        <h3>Resultados (Simulador)</h3>
        <p><strong>Nombre Deudor:</strong> ${nombreDeudor}</p>
        <p><strong>Número de Deudas:</strong> ${numeroDeudas}</p>
        <p><strong>Deuda Original:</strong> €${sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p><strong>Deuda Descontada:</strong> €${sumaDescontada.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p><strong>Ahorro:</strong> €${ahorro.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p><strong>Promedio % Descuento:</strong> ${promedioDesc.toFixed(2)}%</p>
        <hr />
        <p><strong>Comisión de Éxito (25% Ahorro):</strong> €${comisionExito.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p><strong>Comisión de Gestión (10% Deuda Original):</strong> €${comisionGestion.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p id="resultadoPagar"><strong>Total a Pagar:</strong> €${totalAPagar.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
        <p><strong>Cuotas:</strong> ${nCuotas}</p>
        <p><strong>Cuota Mensual:</strong> €${cuotaMensual.toLocaleString('es-ES', { minimumFractionDigits:2 })}</p>
      `;
    }

    if (planContainerOuter) {
      planContainerOuter.style.display = "block";
    }

    if (planNombreDeudor) planNombreDeudor.textContent = nombreDeudor;
    if (planNumDeudas) planNumDeudas.textContent = numeroDeudas;
    if (planDeudaTotal) planDeudaTotal.textContent = "€" + sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    if (planLoQueDebes) planLoQueDebes.textContent = "€" + sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    if (planLoQuePagarias) planLoQuePagarias.textContent = "€" + sumaDescontada.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    if (planAhorro) planAhorro.textContent = "€" + ahorro.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    if (planCuotaMensual) planCuotaMensual.textContent = "€" + cuotaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2 });

    const descuentoPorc = (sumaOriginal > 0) ? (ahorro / sumaOriginal) * 100 : 0;
    if (planDescuentoTotal) planDescuentoTotal.textContent = descuentoPorc.toFixed(2) + "%";
    if (planDuracion) planDuracion.textContent = nCuotas + " meses";

    // Fecha
    const hoy = new Date();
    const dia  = String(hoy.getDate()).padStart(2, '0');
    const mes  = String(hoy.getMonth()+1).padStart(2,'0');
    const anio = hoy.getFullYear();
    if (planFecha) planFecha.textContent = `${dia}/${mes}/${anio}`;

    // Folio
    const folioGenerado = generarNuevoFolio();
    if (planFolio) planFolio.textContent = folioGenerado;

    if (planTablaBody) {
      planTablaBody.innerHTML = "";
      filasData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.entidad}</td>
          <td>€${item.deudaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
          <td>€${item.deudaConDesc.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
        `;
        planTablaBody.appendChild(row);
      });
    }

    // Crear/Actualizar gráfico (usando Chart.js)
    actualizarGrafico(ahorro, sumaDescontada);

    // Guardar en historial
    HistorialModule.guardarSimulacion({
      folio: folioGenerado,
      fecha: `${dia}/${mes}/${anio}`,
      nombreDeudor,
      numeroDeudas,
      deudaOriginal: sumaOriginal,
      deudaDescontada: sumaDescontada,
      ahorro,
      totalAPagar
    });
  }

  // Gráfico
  function actualizarGrafico(ahorro, sumaDescontada) {
    const ctx = document.getElementById("myChart")?.getContext("2d");
    if (!ctx) return;
    if (myChart) myChart.destroy();

    const data = {
      labels: ["Ahorro", "Pago"],
      datasets: [
        {
          data: [ahorro, sumaDescontada],
          backgroundColor: ["#34c759", "#007aff"]
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label(context) {
              let label = context.label || "";
              let value = context.parsed;
              return `${label}: €${value.toLocaleString('es-ES',{minimumFractionDigits:2})}`;
            }
          }
        }
      }
    };

    myChart = new Chart(ctx, {
      type: "doughnut",
      data,
      options
    });
  }

  // Re-analizar
  function reAnalizar() {
    const tablaBody = document.getElementById("tablaDeudas");
    if (tablaBody) {
      tablaBody.innerHTML = "";
    }
    if (resultadoFinalDiv) {
      resultadoFinalDiv.style.display = "none";
    }
    if (planContainerOuter) {
      planContainerOuter.style.display = "none";
    }

    if (inputNombreDeudor) inputNombreDeudor.value = "";
    if (inputNumCuotas) inputNumCuotas.value = "12";

    if (myChart) {
      myChart.destroy();
      myChart = null;
    }

    TablaDeudasModule.agregarFila();
  }

  function descargarPlan() {
    window.scrollTo(0, 0);
    const planDiv = document.getElementById("plan-de-liquidacion");
    if (!planDiv) return;

    const fechaFilename = (planFecha?.textContent || "").replaceAll("/", "-");
    const nombreDeudor = (planNombreDeudor?.textContent || "Simulacion").trim();

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${nombreDeudor}_${fechaFilename}_${ultimoContadorFolio.toString().padStart(4,'0')}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        logging: true,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    html2pdf().from(planDiv).set(opt).save();
  }

  // Retorna promesa
  function enviarDatosAGoogleSheets() {
    return new Promise((resolve, reject) => {
      const folio = (planFolio?.textContent || "").trim();
      const fecha = (planFecha?.textContent || "").trim();
      const nombreDeudor = (planNombreDeudor?.textContent || "").trim();
      const numeroDeudas = (planNumDeudas?.textContent || "").trim();
      const deudaOriginal = (planDeudaTotal?.textContent.replace("€", "") || "").trim();
      const deudaDescontada = (planLoQuePagarias?.textContent.replace("€", "") || "").trim();
      const ahorro = (planAhorro?.textContent.replace("€", "") || "").trim();

      let totalAPagar = "0";
      const elemTotal = document.getElementById("resultadoPagar");
      if (elemTotal) {
        totalAPagar = elemTotal.textContent.split("€")[1]?.trim() || "0";
      }

      const datosPlan = {
        folio,
        fecha,
        nombreDeudor,
        numeroDeudas,
        deudaOriginal,
        deudaDescontada,
        ahorro,
        totalAPagar
      };

      const formData = new URLSearchParams();
      for (const key in datosPlan) {
        formData.append(key, datosPlan[key]);
      }

      const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxLEVjy-I3.../exec"; // Ejemplo

      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      })
        .then((r) => r.text())
        .then((data) => {
          if (data.includes("OK")) {
            mostrarNotificacion("¡Plan contratado y enviado a Google Sheets!", "success");
            resolve(data);
          } else {
            mostrarNotificacion("Error al enviar datos: " + data, "error");
            reject(data);
          }
        })
        .catch((err) => {
          console.error(err);
          mostrarNotificacion("Error de conexión al enviar datos a Google Sheets.", "error");
          reject(err);
        });
    });
  }

  return {
    calcular,
    reAnalizar,
    descargarPlan,
    enviarDatosAGoogleSheets
  };
})();

//////////////////////////////////////////
// Main: Inicialización de todos los módulos
//////////////////////////////////////////

window.addEventListener("DOMContentLoaded", () => {
  // Iniciar Entidades
  EntidadesModule.init();

  // Mostrar/ocultar contenedor de entidades
  const btnToggleEntidades = document.getElementById("btnToggleEntidades");
  if (btnToggleEntidades) {
    btnToggleEntidades.addEventListener("click", () => {
      const contenedor = document.getElementById("entidadesContainer");
      if (!contenedor) return;
      if (contenedor.style.display === "none" || contenedor.style.display === "") {
        contenedor.style.display = "block";
        btnToggleEntidades.textContent = "Ocultar Administrar Entidades";
      } else {
        contenedor.style.display = "none";
        btnToggleEntidades.textContent = "Mostrar Administrar Entidades";
      }
    });
  }

  // Botón agregar entidad
  const btnAgregarEntidad = document.getElementById("btnAgregarEntidad");
  if (btnAgregarEntidad) {
    btnAgregarEntidad.addEventListener("click", () => {
      const nuevaEntidad = (document.getElementById("nuevaEntidad")?.value || "").trim();
      if (nuevaEntidad) {
        EntidadesModule.agregar(nuevaEntidad);
        document.getElementById("nuevaEntidad").value = "";
      }
    });
  }

  // Iniciar Tabla Deudas
  TablaDeudasModule.init();

  // Simulador Botones
  const btnCalcular = document.getElementById("btnCalcular");
  if (btnCalcular) {
    btnCalcular.addEventListener("click", () => {
      SimuladorModule.calcular();
    });
  }

  const btnReAnalizar = document.getElementById("btnReAnalizar");
  if (btnReAnalizar) {
    btnReAnalizar.addEventListener("click", () => {
      SimuladorModule.reAnalizar();
    });
  }

  const btnDescargarPlan = document.getElementById("btnDescargarPlan");
  if (btnDescargarPlan) {
    btnDescargarPlan.addEventListener("click", () => {
      SimuladorModule.descargarPlan();
    });
  }

  // Historial
  HistorialModule.init();
  const btnMostrarHistorial = document.getElementById("btnMostrarHistorial");
  if (btnMostrarHistorial) {
    btnMostrarHistorial.addEventListener("click", () => {
      HistorialModule.mostrarHistorial();
    });
  }

  const btnCerrarHistorial = document.getElementById("btnCerrarHistorial");
  if (btnCerrarHistorial) {
    btnCerrarHistorial.addEventListener("click", () => {
      HistorialModule.ocultarHistorial();
    });
  }

  // Contratar -> Google Sheets
  const btnContratar = document.getElementById("btnContratar");
  if (btnContratar) {
    // se reempalma para evitar handlers previos
    // Elimina el reemplazo de nodo para no perder el listener
    btnContratar.addEventListener("click", () => {
      mostrarNotificacion("Enviando datos...", "loading");
      SimuladorModule.enviarDatosAGoogleSheets()
        .then(() => {
          mostrarNotificacion("Datos enviados correctamente", "success");
        })
        .catch(() => {
          // Manejo de error adicional si se requiere
        });
    });
  }
});


//////////////////////////////////////////
// Testing y Manejo de errores adicional
//////////////////////////////////////////
// - Se recomienda implementar pruebas unitarias en Jest o Mocha
// - Manejar más casos límite (ej. inputs vacíos, nulos, etc.)
// - Manejo de exceptions con try/catch en funciones críticas

// Este código ya maneja la mayoría de flujos, sin embargo,
// un 9/10 (o 10/10) puede requerir más cobertura de pruebas,
// logging avanzado y validaciones específicas por cada flujo.
