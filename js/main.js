/********************************************
 * Utilidades y funciones generales 
 ********************************************/
function formatoMoneda(num) {
  // Formatea un número como € con dos decimales
  if (isNaN(num)) return "€0.00";
  return "€" + parseFloat(num).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function validarInputNumerico(input, min = 1, max = 999999) {
  // Verifica que el valor sea un número válido dentro de [min, max]
  const valor = parseFloat(input.value);
  if (isNaN(valor) || valor < min || valor > max) {
    input.classList.add("error");
    setTimeout(() => input.classList.remove("error"), 1500);
    return false;
  }
  return true;
}

function generarFolio() {
  const now = new Date().getTime().toString();
  const rand = Math.floor(Math.random() * 1000).toString();
  return "FOLIO-" + now + "-" + rand;
}

function mostrarNotificacion(mensaje, tipo = "info") {
  // Podrías implementar un sistema de notificaciones más elaborado
  // Por simplicidad, usando alert:
  if (tipo === "error") {
    alert("[ERROR] " + mensaje);
  } else {
    console.log("[INFO] " + mensaje);
  }
}

function toggleCargando(mostrar, mensaje = "Procesando...") {
  const indicador = document.getElementById("indicadorCarga");
  const mensajeCarga = document.getElementById("mensajeCarga");
  if (!indicador) return;
  
  if (mostrar) {
    mensajeCarga.textContent = mensaje;
    indicador.style.display = "flex";
  } else {
    indicador.style.display = "none";
  }
}

function confirmarAccion(mensaje, accionSi) {
  if (confirm(mensaje)) {
    accionSi();
  }
}

/********************************************
 * GoogleSheetsModule
 ********************************************/
const GoogleSheetsModule = (function(){
  const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwKe6xmdWmgIPLCH1_VatxSuw-VUyPT5DGC41cKhwm3oYsYLY3Yx_6FTx_fHNJAiK5W/exec";
  // ↑ Cambia esta URL por la tuya propia de Apps Script

  let entidades = [];
  let tiposProducto = [];
  let datosEntidadesCargados = false;

  function cargarEntidadesYTipos() {
    return new Promise((resolve, reject) => {
      toggleCargando(true, "Cargando catálogos...");
      fetch(GOOGLE_SHEET_ENDPOINT)
        .then((resp) => resp.json())
        .then((data) => {
          if (data.error) {
            mostrarNotificacion("Error al cargar datos: " + data.error, "error");
            reject(data.error);
          } else {
            entidades = data.entidades || [];
            tiposProducto = data.tiposProducto || [];
            datosEntidadesCargados = true;
            resolve({ entidades, tiposProducto });
          }
        })
        .catch((err) => {
          mostrarNotificacion("Error de conexión al cargar datos", "error");
          reject(err);
        })
        .finally(() => {
          toggleCargando(false);
        });
    });
  }

  function obtenerEntidades() {
    if (datosEntidadesCargados) {
      return Promise.resolve(entidades);
    } else {
      return cargarEntidadesYTipos().then((res) => res.entidades);
    }
  }

  function obtenerTiposProducto() {
    if (datosEntidadesCargados) {
      return Promise.resolve(tiposProducto);
    } else {
      return cargarEntidadesYTipos().then((res) => res.tiposProducto);
    }
  }

  function guardarContrato(datosContrato) {
    return new Promise((resolve, reject) => {
      toggleCargando(true, "Guardando contrato...");
      const formData = new URLSearchParams();
      formData.append("accion", "guardarContrato");
      formData.append("folio", datosContrato.folio);
      formData.append("fecha", datosContrato.fecha);
      formData.append("nombreDeudor", datosContrato.nombreDeudor);
      formData.append("numeroDeudas", datosContrato.numeroDeudas);
      formData.append("deudaOriginal", datosContrato.deudaOriginal);
      formData.append("deudaDescontada", datosContrato.deudaDescontada);
      formData.append("ahorro", datosContrato.ahorro);
      formData.append("totalAPagar", datosContrato.totalAPagar);
      formData.append("cuotaMensual", datosContrato.cuotaMensual);
      formData.append("numCuotas", datosContrato.numCuotas);
      formData.append("detalles", JSON.stringify(datosContrato.detalles));

      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        body: formData
      })
      .then(resp => resp.json())
      .then((res) => {
        if (res && res.status === "OK") {
          resolve(res);
        } else {
          reject(res?.error || "Error desconocido al guardar contrato");
        }
      })
      .catch((err) => reject(err))
      .finally(() => toggleCargando(false));
    });
  }

  function guardarHistorial(datos) {
    // Simplificado: guardamos un registro más ligero en Historial
    return new Promise((resolve, reject) => {
      const formData = new URLSearchParams();
      formData.append("accion", "guardarHistorial");
      formData.append("folio", datos.folio);
      formData.append("fecha", datos.fecha);
      formData.append("nombreDeudor", datos.nombreDeudor);
      formData.append("numeroDeudas", datos.numeroDeudas);
      formData.append("deudaOriginal", datos.deudaOriginal);
      formData.append("deudaDescontada", datos.deudaDescontada);
      formData.append("ahorro", datos.ahorro);
      formData.append("totalAPagar", datos.deudaDescontada);

      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        body: formData
      })
      .then(resp => resp.json())
      .then((res) => {
        if (res && res.status === "OK") {
          resolve(res);
        } else {
          reject(res?.error || "Error desconocido al guardar historial");
        }
      })
      .catch((err) => reject(err));
    });
  }

  function cargarHistorial() {
    return new Promise((resolve, reject) => {
      toggleCargando(true, "Cargando historial...");
      const formData = new URLSearchParams();
      formData.append("accion", "obtenerHistorial");

      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        body: formData
      })
      .then(resp => resp.json())
      .then((res) => {
        if (res && !res.error) {
          // res.historial: array
          resolve(res.historial || []);
        } else {
          reject(res?.error || "Error desconocido al cargar historial");
        }
      })
      .catch((err) => reject(err))
      .finally(() => toggleCargando(false));
    });
  }

  function obtenerDetallesContrato(folio) {
    return new Promise((resolve, reject) => {
      toggleCargando(true, "Cargando contrato...");
      const formData = new URLSearchParams();
      formData.append("accion", "obtenerDetallesContrato");
      formData.append("folio", folio);

      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        body: formData
      })
      .then(resp => resp.json())
      .then((res) => {
        if (res && !res.error) {
          resolve(res);
        } else {
          reject(res?.error || "Error desconocido al obtener detalles");
        }
      })
      .catch((err) => reject(err))
      .finally(() => toggleCargando(false));
    });
  }

  return {
    obtenerEntidades,
    obtenerTiposProducto,
    guardarContrato,
    guardarHistorial,
    cargarHistorial,
    obtenerDetallesContrato
  };

})();

/********************************************
 * TablaDeudasModule
 ********************************************/
const TablaDeudasModule = (function(){

  let contadorFilas = 0;
  const tabla = document.getElementById("tablaDeudas");

  function inicializar() {
    // Agregar la primera fila por defecto
    agregarFila();
    // Delegar clicks en la tabla para borrar filas
    tabla.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-borrar")) {
        const fila = e.target.closest("tr");
        fila.remove();
      }
    });
  }

  function cargarOpcionesTipoProducto(selectElem) {
    GoogleSheetsModule.obtenerTiposProducto()
      .then((tipos) => {
        selectElem.innerHTML = `<option value="">Seleccionar...</option>`;
        tipos.forEach((tipo) => {
          const opt = document.createElement("option");
          opt.value = tipo;
          opt.textContent = tipo;
          selectElem.appendChild(opt);
        });
      })
      .catch((err) => {
        console.error("Error cargando tipos producto:", err);
      });
  }

  function cargarOpcionesEntidad(selectElem) {
    GoogleSheetsModule.obtenerEntidades()
      .then((ents) => {
        selectElem.innerHTML = `<option value="">Seleccionar...</option>`;
        ents.forEach((ent) => {
          const opt = document.createElement("option");
          opt.value = ent;
          opt.textContent = ent;
          selectElem.appendChild(opt);
        });
      })
      .catch((err) => {
        console.error("Error cargando entidades:", err);
      });
  }

  function agregarFila(datos = {}) {
    contadorFilas++;
    const tr = document.createElement("tr");

    // N° Contrato
    const tdNumContrato = document.createElement("td");
    const inputNumContrato = document.createElement("input");
    inputNumContrato.type = "text";
    inputNumContrato.value = datos.numeroContrato || "";
    tdNumContrato.appendChild(inputNumContrato);
    tr.appendChild(tdNumContrato);

    // Tipo Producto (select)
    const tdTipo = document.createElement("td");
    const selectTipo = document.createElement("select");
    tdTipo.appendChild(selectTipo);
    tr.appendChild(tdTipo);
    cargarOpcionesTipoProducto(selectTipo);
    if (datos.tipoProducto) {
      setTimeout(() => {
        selectTipo.value = datos.tipoProducto;
      }, 500);
    }

    // Entidad (select)
    const tdEntidad = document.createElement("td");
    const selectEntidad = document.createElement("select");
    tdEntidad.appendChild(selectEntidad);
    tr.appendChild(tdEntidad);
    cargarOpcionesEntidad(selectEntidad);
    if (datos.entidad) {
      setTimeout(() => {
        selectEntidad.value = datos.entidad;
      }, 500);
    }

    // Importe de deuda
    const tdImporte = document.createElement("td");
    const inputImporte = document.createElement("input");
    inputImporte.type = "number";
    inputImporte.min = "0";
    inputImporte.value = datos.importeDeuda || "";
    inputImporte.addEventListener("input", () => {
      calcularImporteConDescuento(tr);
    });
    tdImporte.appendChild(inputImporte);
    tr.appendChild(tdImporte);

    // % Descuento
    const tdPorcDesc = document.createElement("td");
    const inputPorcDesc = document.createElement("input");
    inputPorcDesc.type = "number";
    inputPorcDesc.min = "0";
    inputPorcDesc.max = "100";
    inputPorcDesc.value = datos.porcentajeDescuento || "";
    inputPorcDesc.addEventListener("input", () => {
      calcularImporteConDescuento(tr);
    });
    tdPorcDesc.appendChild(inputPorcDesc);
    tr.appendChild(tdPorcDesc);

    // Importe con descuento (readonly)
    const tdImporteDesc = document.createElement("td");
    const inputImporteDesc = document.createElement("input");
    inputImporteDesc.type = "text";
    inputImporteDesc.readOnly = true;
    inputImporteDesc.value = datos.importeConDescuento || "";
    tdImporteDesc.appendChild(inputImporteDesc);
    tr.appendChild(tdImporteDesc);

    // Botón eliminar
    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn-borrar");
    btnEliminar.textContent = "X";
    tdEliminar.appendChild(btnEliminar);
    tr.appendChild(tdEliminar);

    tabla.appendChild(tr);

    // Si había datos, recalculamos:
    if (datos.importeDeuda && datos.porcentajeDescuento) {
      calcularImporteConDescuento(tr);
    }
  }

  function calcularImporteConDescuento(fila) {
    const inputImporte = fila.querySelector("td:nth-child(4) input");
    const inputPorcDesc = fila.querySelector("td:nth-child(5) input");
    const inputImporteDesc = fila.querySelector("td:nth-child(6) input");

    const importe = parseFloat(inputImporte.value) || 0;
    const porc = parseFloat(inputPorcDesc.value) || 0;

    const conDesc = importe * (1 - porc/100);
    inputImporteDesc.value = conDesc.toFixed(2);
  }

  function validarDatos() {
    const filas = tabla.querySelectorAll("tr");
    let valido = true;
    filas.forEach((tr) => {
      const inputs = tr.querySelectorAll("input, select");
      let numContrato = inputs[0].value.trim();
      let tipoProd = inputs[1].value.trim();
      let entidad = inputs[2].value.trim();
      let importeDeuda = parseFloat(inputs[3].value) || 0;

      // Chequeo básico
      if (!numContrato || !tipoProd || !entidad || importeDeuda <= 0) {
        // marca error
        inputs.forEach(inp => {
          if (!inp.value) {
            inp.classList.add("error");
            setTimeout(() => inp.classList.remove("error"), 1500);
          }
        });
        valido = false;
      }
    });
    return valido;
  }

  function obtenerDatosFilas() {
    const filas = tabla.querySelectorAll("tr");
    const resultados = [];
    filas.forEach((tr) => {
      const inputs = tr.querySelectorAll("input, select");
      const numeroContrato = inputs[0].value.trim();
      const tipoProducto = inputs[1].value.trim();
      const entidad = inputs[2].value.trim();
      const importeDeuda = parseFloat(inputs[3].value) || 0;
      const porcentajeDescuento = parseFloat(inputs[4].value) || 0;
      const importeConDescuento = parseFloat(inputs[5].value) || 0;

      if (numeroContrato || tipoProducto || entidad || importeDeuda > 0) {
        resultados.push({
          numeroContrato, tipoProducto, entidad,
          importeDeuda, porcentajeDescuento,
          importeConDescuento
        });
      }
    });
    return resultados;
  }

  function cargarDatos(arrayDeudas) {
    // Limpia la tabla
    tabla.innerHTML = "";
    // Inserta filas con esos datos
    arrayDeudas.forEach(deuda => {
      agregarFila(deuda);
    });
  }

  return {
    inicializar,
    agregarFila,
    validarDatos,
    obtenerDatosFilas,
    cargarDatos
  };
})();

/********************************************
 * SimuladorModule
 ********************************************/
const SimuladorModule = (function(){

  const nombreDeudorInput = document.getElementById("nombreDeudor");
  const numCuotasInput = document.getElementById("numCuotas");
  const resultadoFinal = document.getElementById("resultadoFinal");
  const resultadoTotalAPagar = document.getElementById("resultadoTotalAPagar");
  let resultadoActual = null; // Para guardar el resultado del cálculo

  function inicializar() {
    // Botones
    document.getElementById("btnCalcular").addEventListener("click", calcular);
    document.getElementById("btnReAnalizar").addEventListener("click", reAnalizar);
    
    numCuotasInput.addEventListener("change", () => {
      if (!validarInputNumerico(numCuotasInput, 1, 120)) return;
      if (resultadoActual) {
        // Actualizar cuota
        resultadoActual.numCuotas = parseFloat(numCuotasInput.value);
        resultadoActual.cuotaMensual = (resultadoActual.deudaDescontada / resultadoActual.numCuotas).toFixed(2);
        actualizarResultados();
      }
    });
  }

  function calcular() {
    // Validar nombre
    if (nombreDeudorInput.value.trim() === "") {
      mostrarNotificacion("Debes ingresar el nombre del deudor", "error");
      nombreDeudorInput.classList.add("error");
      setTimeout(() => nombreDeudorInput.classList.remove("error"), 1500);
      return;
    }

    // Validar tabla de deudas
    if (!TablaDeudasModule.validarDatos()) {
      mostrarNotificacion("Corrige los campos marcados en rojo", "error");
      return;
    }

    // Validar Nº de cuotas
    if (!validarInputNumerico(numCuotasInput, 1, 120)) {
      mostrarNotificacion("Número de cuotas no válido", "error");
      return;
    }

    // Recopilar datos
    const deudas = TablaDeudasModule.obtenerDatosFilas();
    const deudaOriginal = deudas.reduce((acc, d) => acc + d.importeDeuda, 0);
    const deudaDescontada = deudas.reduce((acc, d) => acc + d.importeConDescuento, 0);
    const ahorro = deudaOriginal - deudaDescontada;
    const numDeudas = deudas.length;
    const numCuotas = parseFloat(numCuotasInput.value) || 12;
    const cuotaMensual = (deudaDescontada / numCuotas).toFixed(2);

    // Generar folio + fecha
    const folio = generarFolio();
    const fecha = new Date().toLocaleDateString("es-ES");

    resultadoActual = {
      folio,
      fecha,
      nombreDeudor: nombreDeudorInput.value.trim(),
      numeroDeudas: numDeudas,
      deudaOriginal: deudaOriginal.toFixed(2),
      deudaDescontada: deudaDescontada.toFixed(2),
      ahorro: ahorro.toFixed(2),
      numCuotas,
      cuotaMensual,
      detalles: deudas
    };

    // Mostrar resultados
    actualizarResultados();

    // Guardar en historial
    guardarEnHistorial(resultadoActual);

    // Mostrar plan
    PlanLiquidacionModule.mostrarPlan(resultadoActual);
  }

  function actualizarResultados() {
    resultadoFinal.style.display = "block";
    const totalAPagar = parseFloat(resultadoActual.deudaDescontada);
    resultadoTotalAPagar.innerHTML =
      `<strong>Total a Pagar:</strong> ${formatoMoneda(totalAPagar)} 
       en ${resultadoActual.numCuotas} cuotas de ${formatoMoneda(resultadoActual.cuotaMensual)}`;
  }

  function reAnalizar() {
    confirmarAccion("¿Deseas reiniciar el simulador?", () => {
      // Limpiar
      nombreDeudorInput.value = "";
      numCuotasInput.value = 12;
      TablaDeudasModule.cargarDatos([]);
      TablaDeudasModule.agregarFila();
      resultadoFinal.style.display = "none";
      resultadoTotalAPagar.innerHTML = "";
      resultadoActual = null;
      PlanLiquidacionModule.ocultarPlan();
      mostrarNotificacion("Simulador reiniciado correctamente.");
    });
  }

  function guardarEnHistorial(res) {
    GoogleSheetsModule.guardarHistorial(res)
      .then(() => {
        console.log("Simulación guardada en historial");
      })
      .catch((err) => {
        console.error("Error guardando historial:", err);
      });
  }

  function cargarContrato(datosContrato) {
    // Cargar los datos en la interfaz
    nombreDeudorInput.value = datosContrato.nombreDeudor || "";
    numCuotasInput.value = datosContrato.numCuotas || 12;
    TablaDeudasModule.cargarDatos(datosContrato.detalles || []);

    resultadoActual = {
      folio: datosContrato.folio,
      fecha: datosContrato.fecha,
      nombreDeudor: datosContrato.nombreDeudor,
      numeroDeudas: datosContrato.numeroDeudas,
      deudaOriginal: parseFloat(datosContrato.deudaOriginal),
      deudaDescontada: parseFloat(datosContrato.deudaDescontada),
      ahorro: parseFloat(datosContrato.ahorro),
      numCuotas: parseFloat(datosContrato.numCuotas),
      cuotaMensual: parseFloat(datosContrato.cuotaMensual),
      detalles: datosContrato.detalles
    };

    actualizarResultados();
    PlanLiquidacionModule.mostrarPlan(resultadoActual);

    mostrarNotificacion("Contrato " + datosContrato.folio + " cargado correctamente.", "info");
  }

  return {
    inicializar,
    cargarContrato
  };
})();

/********************************************
 * PlanLiquidacionModule
 ********************************************/
const PlanLiquidacionModule = (function(){

  const planContainerOuter = document.getElementById("planContainerOuter");
  const planDiv = document.getElementById("plan-de-liquidacion");
  const btnDescargarPlan = document.getElementById("btnDescargarPlan");
  const btnContratar = document.getElementById("btnContratar");
  const btnEditarContrato = document.getElementById("btnEditarContrato");

  let myChart = null;

  function inicializar() {
    if (!btnDescargarPlan || !btnContratar) return;
    
    btnDescargarPlan.addEventListener("click", () => {
      btnDescargarPlan.classList.add("clicked");
      setTimeout(() => btnDescargarPlan.classList.remove("clicked"), 300);
      descargarPlanMejorado();
    });

    btnContratar.addEventListener("click", () => {
      btnContratar.classList.add("clicked");
      setTimeout(() => btnContratar.classList.remove("clicked"), 300);
      contratarPlan();
    });

    btnEditarContrato.addEventListener("click", () => {
      btnEditarContrato.classList.add("clicked");
      setTimeout(() => btnEditarContrato.classList.remove("clicked"), 300);
      editarContrato();
    });
  }

  function mostrarPlan(datos) {
    planContainerOuter.style.display = "block";

    // Rellenar encabezado
    document.getElementById("plan-folio").textContent = datos.folio || "";
    document.getElementById("plan-fecha").textContent = datos.fecha || "";
    document.getElementById("plan-nombre-deudor").textContent = datos.nombreDeudor || "";
    document.getElementById("plan-num-deudas").textContent = datos.numeroDeudas || 0;

    // Valores numéricos
    const deudaOriginal = parseFloat(datos.deudaOriginal) || 0;
    const deudaDescontada = parseFloat(datos.deudaDescontada) || 0;
    const ahorro = parseFloat(datos.ahorro) || 0;
    const porcentajeDesc = (deudaOriginal > 0) ? (ahorro / deudaOriginal * 100) : 0;

    document.getElementById("plan-deuda-original").textContent = formatoMoneda(deudaOriginal);
    document.getElementById("plan-deuda-descontada").textContent = formatoMoneda(deudaDescontada);
    document.getElementById("plan-ahorro").textContent = formatoMoneda(ahorro);
    document.getElementById("plan-porcentaje-descuento").textContent = porcentajeDesc.toFixed(2) + "%";
    document.getElementById("plan-cuota-mensual").textContent = formatoMoneda(datos.cuotaMensual);
    document.getElementById("plan-duracion-meses").textContent = datos.numCuotas + " meses";

    // Tabla de detalles
    const tbody = document.getElementById("plan-tabla-body");
    tbody.innerHTML = "";
    datos.detalles.forEach((item) => {
      const tr = document.createElement("tr");
      // Añadimos data-attributes para no perder info
      tr.setAttribute("data-numero-contrato", item.numeroContrato || "");
      tr.setAttribute("data-tipo-producto", item.tipoProducto || "");

      const tdEntidad = document.createElement("td");
      tdEntidad.textContent = item.entidad;
      tr.appendChild(tdEntidad);

      const tdDeuda = document.createElement("td");
      tdDeuda.textContent = formatoMoneda(item.importeDeuda);
      tr.appendChild(tdDeuda);

      const tdDeudaDesc = document.createElement("td");
      tdDeudaDesc.textContent = formatoMoneda(item.importeConDescuento);
      tr.appendChild(tdDeudaDesc);

      tbody.appendChild(tr);
    });

    // Crear/actualizar gráfico
    crearGrafico(deudaOriginal, deudaDescontada);

    // Por defecto ocultar botón de editar
    btnEditarContrato.style.display = "none";

    // Scroll al plan
    planContainerOuter.scrollIntoView({ behavior: "smooth" });
  }

  function ocultarPlan() {
    planContainerOuter.style.display = "none";
  }

  function actualizarPlan(datos) {
    mostrarPlan(datos);
  }

  function crearGrafico(deudaOriginal, deudaDescontada) {
    const ctx = document.getElementById("chartDeuda").getContext("2d");
    if (myChart) {
      myChart.destroy();
    }
    const ahorro = deudaOriginal - deudaDescontada;

    myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Lo que pagarías", "Te ahorras"],
        datasets: [{
          data: [deudaDescontada, ahorro],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        },
        cutout: "40%"
      }
    });
  }

  function descargarPlanMejorado() {
    toggleCargando(true, "Generando PDF...");
    if (!planDiv) {
      mostrarNotificacion("No se encontró el contenido del plan.", "error");
      toggleCargando(false);
      return;
    }
    // Armar nombre de archivo
    const planFecha = (document.getElementById("plan-fecha").textContent || "").replace(/\//g, "-");
    const planNombre = (document.getElementById("plan-nombre-deudor").textContent || "").replaceAll(" ", "_");
    const planFolio = document.getElementById("plan-folio").textContent || "";
    const filename = `${planNombre}_${planFecha}_${planFolio}.pdf`;

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    // Generar PDF
    html2pdf().set(opt).from(planDiv).toPdf().outputPdf()
      .then((pdf) => {
        // pdf es un Uint8Array con el contenido
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Descargar
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 0);

        toggleCargando(false);
        mostrarNotificacion("PDF descargado correctamente");
      })
      .catch((err) => {
        toggleCargando(false);
        mostrarNotificacion("Error al generar PDF: " + err, "error");
      });
  }

  function contratarPlan() {
    toggleCargando(true, "Guardando contrato...");
    
    // Obtener datos del DOM actual
    const folio = document.getElementById("plan-folio").textContent || "";
    const fecha = document.getElementById("plan-fecha").textContent || "";
    const nombreDeudor = document.getElementById("plan-nombre-deudor").textContent || "";
    const numDeudas = parseInt(document.getElementById("plan-num-deudas").textContent) || 0;
    const deudaOriginalTxt = document.getElementById("plan-deuda-original").textContent.replace(/[€,]/g,"");
    const deudaDescontadaTxt = document.getElementById("plan-deuda-descontada").textContent.replace(/[€,]/g,"");
    const ahorroTxt = document.getElementById("plan-ahorro").textContent.replace(/[€,]/g,"");
    const cuotaMensualTxt = document.getElementById("plan-cuota-mensual").textContent.replace(/[€,]/g,"");
    const duracionTxt = document.getElementById("plan-duracion-meses").textContent || "";
    const numCuotas = parseInt(duracionTxt) || 12; // asumiendo "12 meses"

    const deudaOriginal = parseFloat(deudaOriginalTxt) || 0;
    const deudaDescontada = parseFloat(deudaDescontadaTxt) || 0;
    const ahorro = parseFloat(ahorroTxt) || 0;
    const cuotaMensual = parseFloat(cuotaMensualTxt) || 0;

    // Tabla de detalles
    const detalles = [];
    const filas = document.querySelectorAll("#plan-tabla-body tr");
    filas.forEach((tr) => {
      const entidad = tr.cells[0].textContent.trim();
      const importeDeudaStr = tr.cells[1].textContent.replace(/[€,]/g,"") || "0";
      const importeConDescStr = tr.cells[2].textContent.replace(/[€,]/g,"") || "0";
      const importeDeuda = parseFloat(importeDeudaStr);
      const importeConDescuento = parseFloat(importeConDescStr);
      const porcentajeDescuento = (importeDeuda > 0) 
                                  ? ((importeDeuda - importeConDescuento)/importeDeuda * 100).toFixed(2)
                                  : 0;
      const numeroContrato = tr.getAttribute("data-numero-contrato") || "";
      const tipoProducto = tr.getAttribute("data-tipo-producto") || "";

      detalles.push({
        numeroContrato,
        tipoProducto,
        entidad,
        importeDeuda,
        porcentajeDescuento,
        importeConDescuento
      });
    });

    const datosContrato = {
      folio,
      fecha,
      nombreDeudor,
      numeroDeudas: numDeudas,
      deudaOriginal: deudaOriginal.toFixed(2),
      deudaDescontada: deudaDescontada.toFixed(2),
      ahorro: ahorro.toFixed(2),
      totalAPagar: deudaDescontada.toFixed(2),
      cuotaMensual: cuotaMensual.toFixed(2),
      numCuotas: numCuotas,
      detalles
    };

    GoogleSheetsModule.guardarContrato(datosContrato)
      .then(() => {
        mostrarNotificacion("Contrato guardado correctamente", "info");
        btnEditarContrato.style.display = "inline-block";
      })
      .catch((err) => {
        mostrarNotificacion("Error al guardar contrato: " + err, "error");
      })
      .finally(() => {
        toggleCargando(false);
      });
  }

  function editarContrato() {
    ocultarPlan();
    mostrarNotificacion("Puedes editar los datos en la tabla y recalcular para generar un nuevo plan.");
  }

  return {
    inicializar,
    mostrarPlan,
    actualizarPlan,
    ocultarPlan
  };

})();

/********************************************
 * HistorialModule
 ********************************************/
const HistorialModule = (function(){
  const btnMostrarHistorial = document.getElementById("btnMostrarHistorial");
  const btnCerrarHistorial = document.getElementById("btnCerrarHistorial");
  const historialContainer = document.getElementById("historialContainer");
  const tablaHistorial = document.getElementById("tablaHistorial");

  function inicializar() {
    btnMostrarHistorial.addEventListener("click", mostrarHistorial);
    btnCerrarHistorial.addEventListener("click", ocultarHistorial);

    tablaHistorial.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-cargar-historial")) {
        const folio = e.target.getAttribute("data-folio");
        cargarContratoDesdeHistorial(folio);
      }
      if (e.target.classList.contains("btn-eliminar-historial")) {
        const folio = e.target.getAttribute("data-folio");
        confirmarAccion("¿Seguro que deseas eliminar este registro del historial?", () => {
          eliminarRegistroHistorial(folio);
        });
      }
    });
  }

  function mostrarHistorial() {
    historialContainer.style.display = "flex";
    tablaHistorial.innerHTML = "";

    GoogleSheetsModule.cargarHistorial()
      .then((historial) => {
        if (historial.length === 0) {
          tablaHistorial.innerHTML = `
            <tr><td colspan="9">No hay registros en el historial</td></tr>`;
          return;
        }
        // Opcional: ordenar por fecha desc. Asumiendo res.fecha="dd/mm/yyyy"
        // o “2023-05-31”
        // Por simplicidad: no implementado en detalle
        // Llenar la tabla
        historial.forEach((reg) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${reg.folio}</td>
            <td>${reg.fecha}</td>
            <td>${reg.nombreDeudor}</td>
            <td>${reg.numeroDeudas}</td>
            <td>${formatoMoneda(reg.deudaOriginal)}</td>
            <td>${formatoMoneda(reg.deudaDescontada)}</td>
            <td>${formatoMoneda(reg.ahorro)}</td>
            <td>${formatoMoneda(reg.totalAPagar)}</td>
            <td>
              <button class="btn-cargar-historial" data-folio="${reg.folio}">Cargar</button>
              <button class="btn-eliminar-historial" data-folio="${reg.folio}">Eliminar</button>
            </td>
          `;
          tablaHistorial.appendChild(tr);
        });
      })
      .catch((err) => {
        mostrarNotificacion("Error al cargar historial: " + err, "error");
        tablaHistorial.innerHTML = `
          <tr><td colspan="9">Error al cargar historial</td></tr>`;
      });
  }

  function ocultarHistorial() {
    historialContainer.style.display = "none";
  }

  function cargarContratoDesdeHistorial(folio) {
    GoogleSheetsModule.obtenerDetallesContrato(folio)
      .then((datos) => {
        // Cerrar historial
        ocultarHistorial();
        // Cargar en el Simulador
        SimuladorModule.cargarContrato(datos);
        // Mostrar botón de editar:
        const btnEditar = document.getElementById("btnEditarContrato");
        btnEditar.style.display = "inline-block";
      })
      .catch((err) => {
        mostrarNotificacion("Error al cargar contrato: " + err, "error");
      });
  }

  function eliminarRegistroHistorial(folio) {
    // Por ahora no implementado en la hoja
    mostrarNotificacion("Eliminar registro (folio: " + folio + ") no implementado en el backend", "info");
  }

  return {
    inicializar
  };
})();

/********************************************
 * Inicialización Global
 ********************************************/
window.addEventListener("DOMContentLoaded", () => {
  TablaDeudasModule.inicializar();
  SimuladorModule.inicializar();
  PlanLiquidacionModule.inicializar();
  HistorialModule.inicializar();
});
