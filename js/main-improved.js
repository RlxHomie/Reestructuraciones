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

// Notificaciones mejoradas
function mostrarNotificacion(mensaje, tipo = "info") {
  // Eliminar notificaciones anteriores
  const notificacionesAnteriores = document.querySelectorAll('.notificacion');
  notificacionesAnteriores.forEach(notif => {
    notif.classList.add("fadeOut");
    setTimeout(() => notif.remove(), 500);
  });

  const notif = document.createElement("div");
  notif.className = `notificacion ${tipo}`;
  notif.textContent = mensaje;
  document.body.appendChild(notif);

  // Añadir efecto de entrada
  setTimeout(() => {
    notif.style.transform = "translateY(0)";
    notif.style.opacity = "1";
  }, 10);

  // Configurar temporizador para eliminar
  setTimeout(() => {
    notif.classList.add("fadeOut");
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

// Confirmar acciones críticas con diálogo mejorado
function confirmarAccion(mensaje, accionSi) {
  // En una implementación real, podríamos crear un modal personalizado
  // Por ahora, usamos el confirm nativo para simplicidad
  if (confirm(mensaje)) {
    accionSi();
  }
}

// Validación robusta de inputs numéricos
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

// Función para formatear números como moneda
function formatoMoneda(numero) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
}

// Función para mostrar/ocultar el indicador de carga
function toggleCargando(mostrar, mensaje = "Procesando...") {
  const indicador = document.getElementById("indicadorCarga");
  const mensajeCarga = document.getElementById("mensajeCarga");
  
  if (mostrar) {
    mensajeCarga.textContent = mensaje;
    indicador.style.display = "flex";
  } else {
    indicador.style.display = "none";
  }
}

//////////////////////////////////////////
// GoogleSheetsModule
//////////////////////////////////////////

const GoogleSheetsModule = (function() {
  // URL del script de Google Apps Script
  // Esta URL debe ser actualizada con la URL real del script desplegado
  const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzqGQkEbUcxT_1PnNwpptV5wSMKedyg9Wb2ffOi5HK8xamFcfeH6NrW04ygrLrusCUl/exec";
  
  // Variables para almacenar datos cargados
  let entidades = [];
  let tiposProducto = [];
  let datosEntidadesCargados = false;
  
  // Función para cargar entidades y tipos de producto desde Google Sheets
  function cargarEntidadesYTipos() {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Cargando datos desde Google Sheets...", "info");
      toggleCargando(true, "Cargando catálogos...");
      
      fetch(GOOGLE_SHEET_ENDPOINT)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(`Error del servidor: ${data.error}`);
          }
          
          entidades = data.entidades || [];
          tiposProducto = data.tiposProducto || [];
          datosEntidadesCargados = true;
          
          mostrarNotificacion("Datos cargados correctamente", "success");
          toggleCargando(false);
          resolve({ entidades, tiposProducto });
        })
        .catch(error => {
          console.error("Error al cargar datos:", error);
          mostrarNotificacion(`Error al cargar datos: ${error.message}`, "error");
          toggleCargando(false);
          
          // Si hay un error, usar datos de respaldo
          entidades = ["Banco Santander", "BBVA", "CaixaBank", "Bankinter", "Sabadell"];
          tiposProducto = ["Préstamo Personal", "Tarjeta de Crédito", "Hipoteca", "Línea de Crédito", "Crédito al Consumo"];
          datosEntidadesCargados = true;
          
          resolve({ entidades, tiposProducto });
        });
    });
  }
  
  // Función para guardar contrato en Google Sheets
  function guardarContrato(datosContrato) {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Guardando contrato...", "info");
      toggleCargando(true, "Guardando contrato...");
      
      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append('accion', 'guardarContrato');
      
      // Añadir datos principales
      Object.keys(datosContrato).forEach(key => {
        if (key !== 'detalles') {
          formData.append(key, datosContrato[key]);
        }
      });
      
      // Añadir detalles como JSON
      if (datosContrato.detalles && datosContrato.detalles.length > 0) {
        formData.append('detalles', JSON.stringify(datosContrato.detalles));
      }
      
      // Configurar opciones de fetch
      const options = {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      };
      
      // Realizar la petición
      fetch(GOOGLE_SHEET_ENDPOINT, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.text();
        })
        .then(result => {
          if (result.startsWith("ERROR:")) {
            throw new Error(result.substring(7));
          }
          
          mostrarNotificacion("Contrato guardado correctamente", "success");
          toggleCargando(false);
          resolve(result);
        })
        .catch(error => {
          console.error("Error al guardar contrato:", error);
          mostrarNotificacion(`Error al guardar contrato: ${error.message}`, "error");
          toggleCargando(false);
          reject(error);
        });
    });
  }
  
  // Función para guardar en historial
  function guardarHistorial(datosContrato) {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Guardando en historial...", "info");
      toggleCargando(true, "Guardando en historial...");
      
      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append('accion', 'guardarHistorial');
      
      // Añadir datos principales
      Object.keys(datosContrato).forEach(key => {
        if (key !== 'detalles') {
          formData.append(key, datosContrato[key]);
        }
      });
      
      // Configurar opciones de fetch
      const options = {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      };
      
      // Realizar la petición
      fetch(GOOGLE_SHEET_ENDPOINT, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.text();
        })
        .then(result => {
          if (result.startsWith("ERROR:")) {
            throw new Error(result.substring(7));
          }
          
          mostrarNotificacion("Historial guardado correctamente", "success");
          toggleCargando(false);
          resolve(result);
        })
        .catch(error => {
          console.error("Error al guardar historial:", error);
          mostrarNotificacion(`Error al guardar historial: ${error.message}`, "error");
          toggleCargando(false);
          reject(error);
        });
    });
  }
  
  // Función para obtener historial
  function obtenerHistorial() {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Cargando historial...", "info");
      toggleCargando(true, "Cargando historial...");
      
      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append('accion', 'obtenerHistorial');
      
      // Configurar opciones de fetch
      const options = {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      };
      
      // Realizar la petición
      fetch(GOOGLE_SHEET_ENDPOINT, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(`Error del servidor: ${data.error}`);
          }
          
          mostrarNotificacion("Historial cargado correctamente", "success");
          toggleCargando(false);
          resolve(data);
        })
        .catch(error => {
          console.error("Error al cargar historial:", error);
          mostrarNotificacion(`Error al cargar historial: ${error.message}`, "error");
          toggleCargando(false);
          reject(error);
        });
    });
  }
  
  // Función para obtener detalles de un contrato específico
  function obtenerDetallesContrato(folio) {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Cargando detalles del contrato...", "info");
      toggleCargando(true, "Cargando detalles...");
      
      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append('accion', 'obtenerDetallesContrato');
      formData.append('folio', folio);
      
      // Configurar opciones de fetch
      const options = {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      };
      
      // Realizar la petición
      fetch(GOOGLE_SHEET_ENDPOINT, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(`Error del servidor: ${data.error}`);
          }
          
          mostrarNotificacion("Detalles cargados correctamente", "success");
          toggleCargando(false);
          resolve(data);
        })
        .catch(error => {
          console.error("Error al cargar detalles:", error);
          mostrarNotificacion(`Error al cargar detalles: ${error.message}`, "error");
          toggleCargando(false);
          reject(error);
        });
    });
  }
  
  // Función para actualizar un contrato existente
  function actualizarContrato(datosContrato) {
    return new Promise((resolve, reject) => {
      mostrarNotificacion("Actualizando contrato...", "info");
      toggleCargando(true, "Actualizando contrato...");
      
      // Crear FormData para enviar los datos
      const formData = new FormData();
      formData.append('accion', 'actualizarContrato');
      
      // Añadir datos principales
      Object.keys(datosContrato).forEach(key => {
        if (key !== 'detalles') {
          formData.append(key, datosContrato[key]);
        }
      });
      
      // Añadir detalles como JSON
      if (datosContrato.detalles && datosContrato.detalles.length > 0) {
        formData.append('detalles', JSON.stringify(datosContrato.detalles));
      }
      
      // Configurar opciones de fetch
      const options = {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      };
      
      // Realizar la petición
      fetch(GOOGLE_SHEET_ENDPOINT, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
          }
          return response.text();
        })
        .then(result => {
          if (result.startsWith("ERROR:")) {
            throw new Error(result.substring(7));
          }
          
          mostrarNotificacion("Contrato actualizado correctamente", "success");
          toggleCargando(false);
          resolve(result);
        })
        .catch(error => {
          console.error("Error al actualizar contrato:", error);
          mostrarNotificacion(`Error al actualizar contrato: ${error.message}`, "error");
          toggleCargando(false);
          reject(error);
        });
    });
  }
  
  // Exponer funciones públicas
  return {
    cargarEntidadesYTipos,
    guardarContrato,
    guardarHistorial,
    obtenerHistorial,
    obtenerDetallesContrato,
    actualizarContrato,
    getEntidades: () => entidades,
    getTiposProducto: () => tiposProducto,
    isDatosCargados: () => datosEntidadesCargados
  };
})();

//////////////////////////////////////////
// SimuladorModule
//////////////////////////////////////////

const SimuladorModule = (function() {
  // Elementos DOM
  const btnAgregarFila = document.getElementById("btnAgregarFila");
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReAnalizar = document.getElementById("btnReAnalizar");
  const tablaDeudas = document.getElementById("tablaDeudas");
  const nombreDeudorInput = document.getElementById("nombreDeudor");
  const numCuotasInput = document.getElementById("numCuotas");
  const resultadoFinal = document.getElementById("resultadoFinal");
  const resultadoTotalAPagar = document.getElementById("resultadoTotalAPagar");
  
  // Variables para almacenar datos
  let contadorFilas = 0;
  let resultadoCalculado = null;
  let folioEditando = null; // Para guardar el folio cuando se está editando un contrato existente
  
  // Inicializar módulo
  function inicializar() {
    // Configurar eventos
    btnAgregarFila.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      agregarFila();
    });
    
    btnCalcular.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      calcularTotales();
    });
    
    btnReAnalizar.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      reAnalizar();
    });
    
    // Agregar primera fila automáticamente
    agregarFila();
    
    // Cargar datos de entidades y tipos de producto
    if (!GoogleSheetsModule.isDatosCargados()) {
      GoogleSheetsModule.cargarEntidadesYTipos()
        .then(() => {
          // Actualizar selectores en filas existentes
          actualizarSelectoresEnFilas();
        })
        .catch(error => {
          console.error("Error al inicializar datos:", error);
        });
    } else {
      actualizarSelectoresEnFilas();
    }
  }
  
  // Función para actualizar selectores en filas existentes
  function actualizarSelectoresEnFilas() {
    const filas = tablaDeudas.querySelectorAll("tr");
    filas.forEach(fila => {
      const selectorTipoProducto = fila.querySelector(".selector-tipo-producto");
      const selectorEntidad = fila.querySelector(".selector-entidad");
      
      if (selectorTipoProducto) {
        actualizarSelector(selectorTipoProducto, GoogleSheetsModule.getTiposProducto());
      }
      
      if (selectorEntidad) {
        actualizarSelector(selectorEntidad, GoogleSheetsModule.getEntidades());
      }
    });
  }
  
  // Función para actualizar un selector con opciones
  function actualizarSelector(selector, opciones) {
    // Guardar valor actual
    const valorActual = selector.value;
    
    // Limpiar opciones actuales
    selector.innerHTML = "";
    
    // Añadir opción por defecto
    const opcionDefecto = document.createElement("option");
    opcionDefecto.value = "";
    opcionDefecto.textContent = "Seleccionar...";
    selector.appendChild(opcionDefecto);
    
    // Añadir nuevas opciones
    opciones.forEach(opcion => {
      const nuevaOpcion = document.createElement("option");
      nuevaOpcion.value = opcion;
      nuevaOpcion.textContent = opcion;
      selector.appendChild(nuevaOpcion);
    });
    
    // Restaurar valor si existía
    if (valorActual && opciones.includes(valorActual)) {
      selector.value = valorActual;
    }
  }
  
  // Función para agregar una nueva fila
  function agregarFila() {
    contadorFilas++;
    
    const fila = document.createElement("tr");
    fila.dataset.id = contadorFilas;
    
    // Crear celdas
    const celdaNumeroContrato = document.createElement("td");
    const inputNumeroContrato = document.createElement("input");
    inputNumeroContrato.type = "text";
    inputNumeroContrato.className = "input-numero-contrato";
    inputNumeroContrato.placeholder = "Ej: 123456";
    celdaNumeroContrato.appendChild(inputNumeroContrato);
    
    const celdaTipoProducto = document.createElement("td");
    const selectorTipoProducto = document.createElement("select");
    selectorTipoProducto.className = "selector-tipo-producto";
    actualizarSelector(selectorTipoProducto, GoogleSheetsModule.getTiposProducto());
    celdaTipoProducto.appendChild(selectorTipoProducto);
    
    const celdaEntidad = document.createElement("td");
    const selectorEntidad = document.createElement("select");
    selectorEntidad.className = "selector-entidad";
    actualizarSelector(selectorEntidad, GoogleSheetsModule.getEntidades());
    celdaEntidad.appendChild(selectorEntidad);
    
    const celdaImporteDeuda = document.createElement("td");
    const inputImporteDeuda = document.createElement("input");
    inputImporteDeuda.type = "number";
    inputImporteDeuda.className = "input-importe-deuda";
    inputImporteDeuda.placeholder = "Ej: 5000";
    inputImporteDeuda.min = "0";
    inputImporteDeuda.step = "0.01";
    celdaImporteDeuda.appendChild(inputImporteDeuda);
    
    const celdaPorcentajeDescuento = document.createElement("td");
    const inputPorcentajeDescuento = document.createElement("input");
    inputPorcentajeDescuento.type = "number";
    inputPorcentajeDescuento.className = "input-porcentaje-descuento";
    inputPorcentajeDescuento.placeholder = "Ej: 30";
    inputPorcentajeDescuento.min = "0";
    inputPorcentajeDescuento.max = "100";
    inputPorcentajeDescuento.addEventListener("input", function() {
      const fila = this.closest("tr");
      const importeDeuda = parseFloat(fila.querySelector(".input-importe-deuda").value) || 0;
      const porcentaje = parseFloat(this.value) || 0;
      
      if (porcentaje < 0 || porcentaje > 100) {
        mostrarNotificacion("El porcentaje debe estar entre 0 y 100", "error");
        this.value = Math.max(0, Math.min(100, porcentaje));
      }
      
      const importeConDescuento = importeDeuda * (1 - porcentaje / 100);
      fila.querySelector(".input-importe-con-descuento").value = importeConDescuento.toFixed(2);
    });
    celdaPorcentajeDescuento.appendChild(inputPorcentajeDescuento);
    
    const celdaImporteConDescuento = document.createElement("td");
    const inputImporteConDescuento = document.createElement("input");
    inputImporteConDescuento.type = "number";
    inputImporteConDescuento.className = "input-importe-con-descuento";
    inputImporteConDescuento.placeholder = "Calculado";
    inputImporteConDescuento.readOnly = true;
    celdaImporteConDescuento.appendChild(inputImporteConDescuento);
    
    const celdaEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-eliminar";
    btnEliminar.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
    btnEliminar.addEventListener("click", function() {
      const fila = this.closest("tr");
      fila.classList.add("fade-out");
      setTimeout(() => {
        fila.remove();
        // Si no quedan filas, agregar una nueva
        if (tablaDeudas.querySelectorAll("tr").length === 0) {
          agregarFila();
        }
      }, 300);
    });
    celdaEliminar.appendChild(btnEliminar);
    
    // Añadir celdas a la fila
    fila.appendChild(celdaNumeroContrato);
    fila.appendChild(celdaTipoProducto);
    fila.appendChild(celdaEntidad);
    fila.appendChild(celdaImporteDeuda);
    fila.appendChild(celdaPorcentajeDescuento);
    fila.appendChild(celdaImporteConDescuento);
    fila.appendChild(celdaEliminar);
    
    // Añadir fila a la tabla
    tablaDeudas.appendChild(fila);
    
    // Configurar evento para recalcular al cambiar importe
    inputImporteDeuda.addEventListener("input", function() {
      const fila = this.closest("tr");
      const importeDeuda = parseFloat(this.value) || 0;
      const porcentaje = parseFloat(fila.querySelector(".input-porcentaje-descuento").value) || 0;
      
      const importeConDescuento = importeDeuda * (1 - porcentaje / 100);
      fila.querySelector(".input-importe-con-descuento").value = importeConDescuento.toFixed(2);
    });
    
    // Animar entrada
    fila.classList.add("fade-in");
    setTimeout(() => {
      fila.classList.remove("fade-in");
    }, 500);
    
    // Enfocar el primer input
    inputNumeroContrato.focus();
    
    return fila;
  }
  
  // Función para calcular totales
  function calcularTotales() {
    // Validar nombre del deudor
    if (!nombreDeudorInput.value.trim()) {
      mostrarNotificacion("Por favor, ingrese el nombre del cliente", "error");
      nombreDeudorInput.focus();
      return;
    }
    
    // Validar número de cuotas
    if (!validarInputNumerico(numCuotasInput, 1, 120)) {
      numCuotasInput.focus();
      return;
    }
    
    // Obtener filas de la tabla
    const filas = tablaDeudas.querySelectorAll("tr");
    
    // Validar que haya al menos una fila con datos
    let hayFilasValidas = false;
    
    // Preparar arrays para almacenar datos
    const detalles = [];
    
    // Variables para totales
    let deudaOriginalTotal = 0;
    let deudaDescontadaTotal = 0;
    
    // Procesar cada fila
    filas.forEach(fila => {
      const numeroContrato = fila.querySelector(".input-numero-contrato").value.trim();
      const tipoProducto = fila.querySelector(".selector-tipo-producto").value;
      const entidad = fila.querySelector(".selector-entidad").value;
      const importeDeuda = parseFloat(fila.querySelector(".input-importe-deuda").value) || 0;
      const porcentajeDescuento = parseFloat(fila.querySelector(".input-porcentaje-descuento").value) || 0;
      const importeConDescuento = parseFloat(fila.querySelector(".input-importe-con-descuento").value) || 0;
      
      // Validar datos mínimos
      if (numeroContrato && tipoProducto && entidad && importeDeuda > 0) {
        hayFilasValidas = true;
        
        // Acumular totales
        deudaOriginalTotal += importeDeuda;
        deudaDescontadaTotal += importeConDescuento;
        
        // Añadir a detalles
        detalles.push({
          numeroContrato,
          tipoProducto,
          entidad,
          importeDeuda,
          porcentajeDescuento,
          importeConDescuento
        });
      }
    });
    
    // Validar que haya al menos una fila válida
    if (!hayFilasValidas) {
      mostrarNotificacion("Por favor, complete al menos una fila con todos los datos", "error");
      return;
    }
    
    // Calcular valores finales
    const ahorro = deudaOriginalTotal - deudaDescontadaTotal;
    const numCuotas = parseInt(numCuotasInput.value) || 12;
    const cuotaMensual = deudaDescontadaTotal / numCuotas;
    
    // Generar folio único o mantener el existente si estamos editando
    const folio = folioEditando || generarFolio();
    
    // Obtener fecha actual formateada
    const fechaActual = new Date();
    const fechaFormateada = `${fechaActual.getDate().toString().padStart(2, '0')}/${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}/${fechaActual.getFullYear()}`;
    
    // Crear objeto con resultados
    resultadoCalculado = {
      folio,
      fecha: fechaFormateada,
      nombreDeudor: nombreDeudorInput.value.trim(),
      numeroDeudas: detalles.length,
      deudaOriginal: deudaOriginalTotal,
      deudaDescontada: deudaDescontadaTotal,
      ahorro,
      totalAPagar: deudaDescontadaTotal,
      cuotaMensual,
      numCuotas,
      detalles
    };
    
    // Mostrar resultado
    resultadoTotalAPagar.innerHTML = `<strong>Total a Pagar:</strong> ${formatoMoneda(deudaDescontadaTotal)}`;
    resultadoFinal.style.display = "block";
    
    // Mostrar plan de liquidación
    PlanLiquidacionModule.mostrarPlan(resultadoCalculado);
    
    // Notificar éxito
    mostrarNotificacion("Cálculo completado correctamente", "success");
  }
  
  // Función para generar un folio único
  function generarFolio() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FOLIO-${timestamp}${random}`;
  }
  
  // Función para re-analizar (limpiar y empezar de nuevo)
  function reAnalizar() {
    // Confirmar acción
    confirmarAccion("¿Está seguro de querer reiniciar el análisis? Se perderán los datos actuales.", () => {
      // Limpiar nombre del deudor
      nombreDeudorInput.value = "";
      
      // Restaurar número de cuotas
      numCuotasInput.value = "12";
      
      // Limpiar tabla
      tablaDeudas.innerHTML = "";
      
      // Agregar una nueva fila
      agregarFila();
      
      // Ocultar resultado
      resultadoFinal.style.display = "none";
      
      // Ocultar plan de liquidación
      document.getElementById("planContainerOuter").style.display = "none";
      
      // Resetear resultado calculado y folio editando
      resultadoCalculado = null;
      folioEditando = null;
      
      // Notificar
      mostrarNotificacion("Análisis reiniciado", "info");
    });
  }
  
  // Función para establecer el folio que se está editando
  function setFolioEditando(folio) {
    folioEditando = folio;
  }
  
  // Exponer funciones públicas
  return {
    inicializar,
    agregarFila,
    calcularTotales,
    reAnalizar,
    setFolioEditando,
    getResultadoCalculado: () => resultadoCalculado
  };
})();

//////////////////////////////////////////
// HistorialModule
//////////////////////////////////////////

const HistorialModule = (function() {
  // Elementos DOM
  const btnMostrarHistorial = document.getElementById("btnMostrarHistorial");
  const btnCerrarHistorial = document.getElementById("btnCerrarHistorial");
  const historialContainer = document.getElementById("historialContainer");
  const historialBody = document.getElementById("historialBody");
  
  // Inicializar módulo
  function inicializar() {
    // Configurar eventos
    btnMostrarHistorial.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      mostrarHistorial();
    });
    
    btnCerrarHistorial.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      cerrarHistorial();
    });
  }
  
  // Función para mostrar historial
  function mostrarHistorial() {
    // Cargar datos del historial
    GoogleSheetsModule.obtenerHistorial()
      .then(data => {
        // Limpiar tabla
        historialBody.innerHTML = "";
        
        // Verificar si hay datos
        if (!data.historial || data.historial.length === 0) {
          const fila = document.createElement("tr");
          const celda = document.createElement("td");
          celda.colSpan = 9;
          celda.textContent = "No hay registros en el historial";
          celda.style.textAlign = "center";
          fila.appendChild(celda);
          historialBody.appendChild(fila);
        } else {
          // Añadir filas
          data.historial.forEach(item => {
            const fila = document.createElement("tr");
            
            // Crear celdas
            const celdaFolio = document.createElement("td");
            celdaFolio.textContent = item.Folio || "";
            
            const celdaFecha = document.createElement("td");
            celdaFecha.textContent = item.Fecha || "";
            
            const celdaNombre = document.createElement("td");
            celdaNombre.textContent = item["Nombre Deudor"] || "";
            
            const celdaNumDeudas = document.createElement("td");
            celdaNumDeudas.textContent = item["Número Deudas"] || "0";
            
            const celdaDeudaOriginal = document.createElement("td");
            celdaDeudaOriginal.textContent = formatoMoneda(parseFloat(item["Deuda Original"]) || 0);
            
            const celdaDeudaDescontada = document.createElement("td");
            celdaDeudaDescontada.textContent = formatoMoneda(parseFloat(item["Deuda Descontada"]) || 0);
            
            const celdaAhorro = document.createElement("td");
            celdaAhorro.textContent = formatoMoneda(parseFloat(item.Ahorro) || 0);
            
            const celdaTotalAPagar = document.createElement("td");
            celdaTotalAPagar.textContent = formatoMoneda(parseFloat(item["Total a Pagar"]) || 0);
            
            const celdaAcciones = document.createElement("td");
            const btnVerDetalle = document.createElement("button");
            btnVerDetalle.className = "btn-accion";
            btnVerDetalle.innerHTML = `
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
            `;
            btnVerDetalle.title = "Ver detalle";
            btnVerDetalle.addEventListener("click", function() {
              cargarYMostrarContrato(item.Folio);
            });
            
            const btnEditar = document.createElement("button");
            btnEditar.className = "btn-accion";
            btnEditar.innerHTML = `
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-4-7l4-4m-4 4l-8 8v4h4l8-8m0-4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
            `;
            btnEditar.title = "Editar contrato";
            btnEditar.addEventListener("click", function() {
              editarContratoDesdeHistorial(item.Folio);
            });
            
            celdaAcciones.appendChild(btnVerDetalle);
            celdaAcciones.appendChild(btnEditar);
            
            // Añadir celdas a la fila
            fila.appendChild(celdaFolio);
            fila.appendChild(celdaFecha);
            fila.appendChild(celdaNombre);
            fila.appendChild(celdaNumDeudas);
            fila.appendChild(celdaDeudaOriginal);
            fila.appendChild(celdaDeudaDescontada);
            fila.appendChild(celdaAhorro);
            fila.appendChild(celdaTotalAPagar);
            fila.appendChild(celdaAcciones);
            
            // Añadir fila a la tabla
            historialBody.appendChild(fila);
          });
        }
        
        // Mostrar contenedor
        historialContainer.style.display = "block";
      })
      .catch(error => {
        console.error("Error al cargar historial:", error);
        mostrarNotificacion("Error al cargar historial: " + error.message, "error");
      });
  }
  
  // Función para cerrar historial
  function cerrarHistorial() {
    historialContainer.style.display = "none";
  }
  
  // Función para cargar y mostrar un contrato desde el historial
  function cargarYMostrarContrato(folio) {
    GoogleSheetsModule.obtenerDetallesContrato(folio)
      .then(data => {
        // Verificar si hay datos
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Crear objeto con datos del contrato
        const contrato = {
          folio: data.contrato.Folio || "",
          fecha: data.contrato.Fecha || "",
          nombreDeudor: data.contrato["Nombre Deudor"] || "",
          numeroDeudas: parseInt(data.contrato["Número Deudas"]) || 0,
          deudaOriginal: parseFloat(data.contrato["Deuda Original"]) || 0,
          deudaDescontada: parseFloat(data.contrato["Deuda Descontada"]) || 0,
          ahorro: parseFloat(data.contrato.Ahorro) || 0,
          totalAPagar: parseFloat(data.contrato["Total a Pagar"]) || 0,
          cuotaMensual: parseFloat(data.contrato["Cuota Mensual"]) || 0,
          numCuotas: parseInt(data.contrato["Número Cuotas"]) || 12,
          detalles: data.detalles || []
        };
        
        // Mostrar plan de liquidación
        PlanLiquidacionModule.mostrarPlan(contrato);
        
        // Mostrar botón de editar contrato
        document.getElementById("btnEditarContrato").style.display = "inline-block";
        
        // Cerrar historial
        cerrarHistorial();
      })
      .catch(error => {
        console.error("Error al cargar contrato:", error);
        mostrarNotificacion("Error al cargar contrato: " + error.message, "error");
      });
  }
  
  // Función para editar un contrato desde el historial
  function editarContratoDesdeHistorial(folio) {
    GoogleSheetsModule.obtenerDetallesContrato(folio)
      .then(data => {
        // Verificar si hay datos
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Establecer el folio que se está editando
        SimuladorModule.setFolioEditando(folio);
        
        // Limpiar tabla actual
        document.getElementById("tablaDeudas").innerHTML = "";
        
        // Actualizar nombre del deudor
        document.getElementById("nombreDeudor").value = data.contrato["Nombre Deudor"] || "";
        
        // Actualizar número de cuotas
        document.getElementById("numCuotas").value = data.contrato["Número Cuotas"] || "12";
        
        // Añadir filas con los detalles
        if (data.detalles && data.detalles.length > 0) {
          data.detalles.forEach(detalle => {
            // Agregar una nueva fila
            SimuladorModule.agregarFila();
            
            // Actualizar valores en la fila
            setTimeout(() => {
              const filas = document.getElementById("tablaDeudas").querySelectorAll("tr");
              const ultimaFila = filas[filas.length - 1];
              
              ultimaFila.querySelector(".input-numero-contrato").value = detalle["Número Contrato"] || "";
              ultimaFila.querySelector(".selector-tipo-producto").value = detalle["Tipo Producto"] || "";
              ultimaFila.querySelector(".selector-entidad").value = detalle.Entidad || "";
              ultimaFila.querySelector(".input-importe-deuda").value = detalle["Deuda Original"] || "0";
              ultimaFila.querySelector(".input-porcentaje-descuento").value = detalle["Porcentaje Descuento"] || "0";
              
              // Disparar evento input para calcular importe con descuento
              const event = new Event("input", { bubbles: true });
              ultimaFila.querySelector(".input-porcentaje-descuento").dispatchEvent(event);
            }, 100);
          });
        } else {
          // Si no hay detalles, añadir una fila vacía
          SimuladorModule.agregarFila();
        }
        
        // Cerrar historial y plan
        cerrarHistorial();
        document.getElementById("planContainerOuter").style.display = "none";
        
        // Mostrar notificación
        mostrarNotificacion("Contrato cargado para edición. Realice los cambios necesarios y haga clic en Calcular para ver el resultado actualizado.", "success");
      })
      .catch(error => {
        console.error("Error al cargar contrato para edición:", error);
        mostrarNotificacion("Error al cargar contrato: " + error.message, "error");
      });
  }
  
  // Exponer funciones públicas
  return {
    inicializar,
    mostrarHistorial,
    cerrarHistorial,
    cargarYMostrarContrato,
    editarContratoDesdeHistorial
  };
})();

//////////////////////////////////////////

const PlanLiquidacionModule = (function() {
  // Elementos DOM
  const planContainerOuter = document.getElementById("planContainerOuter");
  const btnDescargarPlan = document.getElementById("btnDescargarPlan");
  const btnContratar = document.getElementById("btnContratar");
  const btnEditarContrato = document.getElementById("btnEditarContrato");
  
  // Variables para el gráfico
  let myChart = null;
  
  // Inicializar módulo
  function inicializar() {
    // Configurar eventos
    btnDescargarPlan.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      descargarPlanMejorado();
    });
    
    btnContratar.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      contratarPlan();
    });
    
    btnEditarContrato.addEventListener("click", function() {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      editarContrato();
    });
  }
  
  // Mostrar plan de liquidación
  function mostrarPlan(datos) {
    // Actualizar datos del plan
    document.getElementById("plan-nombre-deudor").textContent = datos.nombreDeudor;
    document.getElementById("plan-num-deudas").textContent = datos.numeroDeudas;
    document.getElementById("plan-deuda-total").textContent = formatoMoneda(datos.deudaOriginal);
    document.getElementById("plan-folio").textContent = datos.folio;
    document.getElementById("plan-fecha").textContent = datos.fecha;
    
    document.getElementById("plan-lo-que-debes").textContent = formatoMoneda(datos.deudaOriginal);
    document.getElementById("plan-lo-que-pagarias").textContent = formatoMoneda(datos.deudaDescontada);
    document.getElementById("plan-ahorro").textContent = formatoMoneda(datos.ahorro);
    
    document.getElementById("plan-cuota-mensual").textContent = formatoMoneda(datos.cuotaMensual);
    const porcentajeDescuento = (datos.ahorro / datos.deudaOriginal) * 100;
    document.getElementById("plan-descuento-total").textContent = `${porcentajeDescuento.toFixed(2)}%`;
    document.getElementById("plan-duracion").textContent = `${datos.numCuotas} meses`;
    
    // Actualizar tabla de detalles
    const tablaBody = document.getElementById("plan-tabla-body");
    tablaBody.innerHTML = "";
    
    datos.detalles.forEach(detalle => {
      const fila = document.createElement("tr");
      
      const celdaEntidad = document.createElement("td");
      celdaEntidad.textContent = detalle.entidad;
      
      const celdaDeudaOriginal = document.createElement("td");
      celdaDeudaOriginal.textContent = formatoMoneda(detalle.importeDeuda);
      
      const celdaDeudaDescontada = document.createElement("td");
      celdaDeudaDescontada.textContent = formatoMoneda(detalle.importeConDescuento);
      
      fila.appendChild(celdaEntidad);
      fila.appendChild(celdaDeudaOriginal);
      fila.appendChild(celdaDeudaDescontada);
      
      tablaBody.appendChild(fila);
    });
    
    // Actualizar gráfico
    actualizarGrafico(datos.deudaOriginal, datos.deudaDescontada);
    
    // Mostrar contenedor
    planContainerOuter.style.display = "block";
    
    // Ocultar botón de editar contrato por defecto
    btnEditarContrato.style.display = "none";
  }
  
  // Actualizar gráfico
  function actualizarGrafico(deudaOriginal, deudaDescontada) {
    const ctx = document.getElementById("myChart").getContext("2d");
    
    // Destruir gráfico anterior si existe
    if (myChart) {
      myChart.destroy();
    }
    
    // Crear nuevo gráfico
    myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Lo que pagarías", "Te ahorras"],
        datasets: [{
          data: [deudaDescontada, deudaOriginal - deudaDescontada],
          backgroundColor: ["#0071e3", "#34c759"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return formatoMoneda(value);
              }
            }
          }
        }
      }
    });
  }
  
  // Contratar plan
  function contratarPlan() {
    // Obtener datos calculados
    const datosContrato = SimuladorModule.getResultadoCalculado();
    
    if (!datosContrato) {
      mostrarNotificacion("No hay datos para contratar", "error");
      return;
    }
    
    // Confirmar acción
    confirmarAccion("¿Está seguro de querer contratar este plan?", () => {
      // Determinar si es un contrato nuevo o una actualización
      const esActualizacion = datosContrato.folio.startsWith("FOLIO-") && datosContrato.folio !== generarFolio();
      
      if (esActualizacion) {
        // Actualizar contrato existente
        GoogleSheetsModule.actualizarContrato(datosContrato)
          .then(() => {
            // Guardar en historial
            return GoogleSheetsModule.guardarHistorial(datosContrato);
          })
          .then(() => {
            mostrarNotificacion("Plan actualizado correctamente", "success");
          })
          .catch(error => {
            console.error("Error al actualizar plan:", error);
            mostrarNotificacion("Error al actualizar plan: " + error.message, "error");
          });
      } else {
        // Guardar nuevo contrato
        GoogleSheetsModule.guardarContrato(datosContrato)
          .then(() => {
            // Guardar en historial
            return GoogleSheetsModule.guardarHistorial(datosContrato);
          })
          .then(() => {
            mostrarNotificacion("Plan contratado correctamente", "success");
          })
          .catch(error => {
            console.error("Error al contratar plan:", error);
            mostrarNotificacion("Error al contratar plan: " + error.message, "error");
          });
      }
    });
  }
  
  // Editar contrato
  function editarContrato() {
    // Obtener folio del contrato actual
    const folio = document.getElementById("plan-folio").textContent;
    
    // Cargar contrato para edición
    GoogleSheetsModule.obtenerDetallesContrato(folio)
      .then(data => {
        // Verificar si hay datos
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Establecer el folio que se está editando
        SimuladorModule.setFolioEditando(folio);
        
        // Limpiar tabla actual
        document.getElementById("tablaDeudas").innerHTML = "";
        
        // Actualizar nombre del deudor
        document.getElementById("nombreDeudor").value = data.contrato["Nombre Deudor"] || "";
        
        // Actualizar número de cuotas
        document.getElementById("numCuotas").value = data.contrato["Número Cuotas"] || "12";
        
        // Añadir filas con los detalles
        if (data.detalles && data.detalles.length > 0) {
          data.detalles.forEach(detalle => {
            // Agregar una nueva fila
            SimuladorModule.agregarFila();
            
            // Actualizar valores en la fila
            setTimeout(() => {
              const filas = document.getElementById("tablaDeudas").querySelectorAll("tr");
              const ultimaFila = filas[filas.length - 1];
              
              ultimaFila.querySelector(".input-numero-contrato").value = detalle["Número Contrato"] || "";
              ultimaFila.querySelector(".selector-tipo-producto").value = detalle["Tipo Producto"] || "";
              ultimaFila.querySelector(".selector-entidad").value = detalle.Entidad || "";
              ultimaFila.querySelector(".input-importe-deuda").value = detalle["Deuda Original"] || "0";
              ultimaFila.querySelector(".input-porcentaje-descuento").value = detalle["Porcentaje Descuento"] || "0";
              
              // Disparar evento input para calcular importe con descuento
              const event = new Event("input", { bubbles: true });
              ultimaFila.querySelector(".input-porcentaje-descuento").dispatchEvent(event);
            }, 100);
          });
        } else {
          // Si no hay detalles, añadir una fila vacía
          SimuladorModule.agregarFila();
        }
        
        // Ocultar plan
        planContainerOuter.style.display = "none";
        
        // Mostrar notificación
        mostrarNotificacion("Contrato cargado para edición. Realice los cambios necesarios y haga clic en Calcular para ver el resultado actualizado.", "success");
      })
      .catch(error => {
        console.error("Error al cargar contrato para edición:", error);
        mostrarNotificacion("Error al cargar contrato: " + error.message, "error");
      });
  }
  
  // Exponer funciones públicas
  return {
    inicializar,
    mostrarPlan,
    actualizarGrafico,
    contratarPlan,
    editarContrato
  };
})();

// Función para descargar PDF mejorada
//////////////////////////////////////////

function descargarPlanMejorado() {
  // Mostrar notificación de inicio
  mostrarNotificacion("Generando PDF, por favor espere...", "info");
  toggleCargando(true, "Generando PDF...");
  
  // Obtener el elemento que contiene el plan
  const planDiv = document.getElementById("plan-de-liquidacion");
  if (!planDiv) {
    mostrarNotificacion("Error: No se encontró el contenido del plan", "error");
    toggleCargando(false);
    return;
  }
  
  // Preparar datos para el nombre del archivo
  const fechaFilename = (document.getElementById("plan-fecha")?.textContent || "").replaceAll("/", "-");
  const nombreDeudor = (document.getElementById("plan-nombre-deudor")?.textContent || "Simulacion").trim();
  const folioActual = document.getElementById("plan-folio")?.textContent || "";
  
  // Crear una copia del elemento para manipularlo sin afectar la visualización
  const planDivClone = planDiv.cloneNode(true);
  
  // Asegurarse de que todas las imágenes tengan rutas absolutas
  const images = planDivClone.querySelectorAll('img');
  images.forEach(img => {
    if (img.src.startsWith('assets/')) {
      img.src = window.location.origin + '/' + img.src;
    }
  });
  
  // Configuración para html2pdf
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${nombreDeudor}_${fechaFilename}_${folioActual.replace("FOLIO-", "")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      logging: true,
      letterRendering: true,
      allowTaint: true,
      foreignObjectRendering: true
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true
    }
  };
  
  // Usar html2pdf directamente con promesas
  html2pdf().from(planDiv).set(opt).save()
    .then(() => {
      mostrarNotificacion("PDF descargado correctamente", "success");
      toggleCargando(false);
    })
    .catch(function(error) {
      console.error("Error al generar PDF:", error);
      mostrarNotificacion("Error al generar PDF: " + error, "error");
      toggleCargando(false);
    });
}

//////////////////////////////////////////
// Inicialización
//////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function() {
  // Inicializar módulos
  SimuladorModule.inicializar();
  PlanLiquidacionModule.inicializar();
  HistorialModule.inicializar();
});
