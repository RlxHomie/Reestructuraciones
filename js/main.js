/**********************************************************
 * VARIABLES Y FUNCIONES DE APOYO
 **********************************************************/
let ultimoContadorFolio = 0;

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function calcularDeuda(sumaOriginal, sumaDescontada, nCuotas) {
  const ahorro = sumaOriginal - sumaDescontada;
  const comisionExito = 0.25 * ahorro;     // 25% de lo que ahorras
  const comisionGestion = 0.10 * sumaOriginal; // 10% de la deuda original
  const totalAPagar = sumaDescontada + comisionExito + comisionGestion;
  const cuotaMensual = totalAPagar / nCuotas;
  return { ahorro, comisionExito, comisionGestion, totalAPagar, cuotaMensual };
}

/**********************************************************
 * GESTIÓN DE ENTIDADES (LOCALSTORAGE)
 **********************************************************/
const defaultEntidades = [
  "ID FINANCE SPAIN, S.A.U. [MONEYMAN]",
  "PLAZO CREDIT, S.L.U.",
  "4FINANCE SPAIN FINANCIAL SERVICES, S.A.U. [VIVUS]",
  /* ... (resto de entidades) ... */
  "HISPANIA IURIS, S.L."
];

let storedEntidades = JSON.parse(localStorage.getItem('entidades'));
let ENTIDADES = (storedEntidades && storedEntidades.length > 0) ? storedEntidades : defaultEntidades;

function guardarEntidades() {
  localStorage.setItem('entidades', JSON.stringify(ENTIDADES));
}

function actualizarListaEntidades() {
  const lista = document.getElementById('listaEntidades');
  lista.innerHTML = '';
  ENTIDADES.forEach((entidad, index) => {
    const li = document.createElement('li');
    let displayText = entidad;
    if (entidad.length > 45) {
      displayText = entidad.substring(0, 42) + '...';
    }
    li.textContent = displayText;
    li.title = entidad;
    
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.className = 'btn btn-borrar';
    btnEliminar.addEventListener('click', () => {
      ENTIDADES.splice(index, 1);
      guardarEntidades();
      actualizarListaEntidades();
    });
    
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

/**********************************************************
 * AL INICIAR LA PÁGINA
 **********************************************************/
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar lista de entidades
  actualizarListaEntidades();

  // Botón Agregar Entidad
  document.getElementById('btnAgregarEntidad').addEventListener('click', () => {
    const nuevaEntidad = document.getElementById('nuevaEntidad').value.trim();
    if (nuevaEntidad) {
      ENTIDADES.push(nuevaEntidad);
      guardarEntidades();
      actualizarListaEntidades();
      document.getElementById('nuevaEntidad').value = '';
    }
  });

  // Botón Toggle Gestor de Entidades
  document.getElementById('btnToggleEntidades').addEventListener('click', () => {
    const contenedor = document.getElementById('entidadesContainer');
    const btn = document.getElementById('btnToggleEntidades');
    if (contenedor.style.display === 'none' || contenedor.style.display === '') {
      contenedor.style.display = 'block';
      btn.textContent = 'Ocultar Administrar Entidades';
    } else {
      contenedor.style.display = 'none';
      btn.textContent = 'Mostrar Administrar Entidades';
    }
  });

  // Botones de la tabla
  document.getElementById('btnAgregarFila').addEventListener('click', () => {
    agregarFila();
  });
  
  document.getElementById('btnCalcular').addEventListener('click', () => {
    calcular();
  });
  
  document.getElementById('btnReAnalizar').addEventListener('click', reAnalizar);

  // Botones Historial
  document.getElementById('btnMostrarHistorial').addEventListener('click', mostrarHistorial);
  document.getElementById('btnCerrarHistorial').addEventListener('click', ocultarHistorial);

  // Botón Descargar Plan
  document.getElementById('btnDescargarPlan').addEventListener('click', descargarPlan);

  // Iniciar tabla con 1 fila
  agregarFila();

  // Botón Contratar -> Google Sheets
  const btnContratar = document.getElementById('btnContratar');
  btnContratar.replaceWith(btnContratar.cloneNode(true));
  document.getElementById('btnContratar').addEventListener('click', enviarDatosAGoogleSheets);
});

/**********************************************************
 * TABLA DE DEUDAS
 **********************************************************/
const tablaDeudasBody = document.getElementById('tablaDeudas');
tablaDeudasBody.addEventListener(
  'input',
  debounce(function(event) {
    if (event.target.tagName === 'INPUT') {
      validarInputPositivo(event.target);
      const fila = event.target.closest('tr');
      if (fila) recalcularFila(fila);
    }
  }, 300)
);

function agregarFila() {
  const fila = document.createElement('tr');

  // Columna N° Contrato
  const tdContrato = document.createElement('td');
  const inputContrato = document.createElement('input');
  inputContrato.type = 'text';
  inputContrato.placeholder = 'Ej: 12345';
  tdContrato.appendChild(inputContrato);

  // Columna Tipo Producto
  const tdTipo = document.createElement('td');
  const inputTipo = document.createElement('input');
  inputTipo.type = 'text';
  inputTipo.placeholder = 'Ej: Préstamo';
  tdTipo.appendChild(inputTipo);

  // Columna Entidad (select)
  const tdEntidad = document.createElement('td');
  const selectEntidad = document.createElement('select');
  ENTIDADES.forEach(entidad => {
    const option = document.createElement('option');
    option.value = entidad;
    
    let displayText = entidad;
    if (entidad.length > 45) {
      displayText = entidad.substring(0,42) + '...';
    }
    option.textContent = displayText;
    option.title = entidad;
    
    selectEntidad.appendChild(option);
  });
  tdEntidad.appendChild(selectEntidad);

  // Columna Deuda Original
  const tdDeudaOrig = document.createElement('td');
  const inputDeudaOrig = document.createElement('input');
  inputDeudaOrig.type = 'number';
  inputDeudaOrig.placeholder = '3000';
  tdDeudaOrig.appendChild(inputDeudaOrig);

  // Columna % Descuento
  const tdDescuento = document.createElement('td');
  const inputDesc = document.createElement('input');
  inputDesc.type = 'number';
  inputDesc.placeholder = '30';
  tdDescuento.appendChild(inputDesc);

  // Columna Deuda con Descuento
  const tdDeudaDesc = document.createElement('td');
  const spanDeudaDesc = document.createElement('span');
  spanDeudaDesc.textContent = '0.00';
  tdDeudaDesc.appendChild(spanDeudaDesc);

  // Columna Eliminar
  const tdEliminar = document.createElement('td');
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn-borrar';
  btnEliminar.innerHTML = '🗑';
  btnEliminar.addEventListener('click', () => {
    tablaDeudasBody.removeChild(fila);
    calcular();
  });
  tdEliminar.appendChild(btnEliminar);

  // Insertar a la fila
  fila.appendChild(tdContrato);
  fila.appendChild(tdTipo);
  fila.appendChild(tdEntidad);
  fila.appendChild(tdDeudaOrig);
  fila.appendChild(tdDescuento);
  fila.appendChild(tdDeudaDesc);
  fila.appendChild(tdEliminar);

  tablaDeudasBody.appendChild(fila);
}

function validarInputPositivo(inputElem) {
  let val = parseFloat(inputElem.value);
  if (isNaN(val) || val < 0) {
    inputElem.value = 0;
    inputElem.classList.add('error');
    setTimeout(() => inputElem.classList.remove('error'), 1200);
  }
}

function recalcularFila(fila) {
  const inputDeudaOriginal = fila.querySelector('td:nth-child(4) input');
  const inputDescuento = fila.querySelector('td:nth-child(5) input');
  const spanDeudaDesc = fila.querySelector('td:nth-child(6) span');

  const deudaOriginal = parseFloat(inputDeudaOriginal.value) || 0;
  const descuento = parseFloat(inputDescuento.value) || 0;
  const deudaConDescuento = deudaOriginal * (1 - descuento / 100);
  
  spanDeudaDesc.textContent = deudaConDescuento.toFixed(2);
}

/**********************************************************
 * CÁLCULO Y RESULTADOS
 **********************************************************/
const inputNombreDeudor = document.getElementById('nombreDeudor');
const inputNumCuotas = document.getElementById('numCuotas');
const resultadoFinalDiv = document.getElementById('resultadoFinal');
const planContainerOuter = document.getElementById('planContainerOuter');

const planNombreDeudor = document.getElementById('plan-nombre-deudor');
const planNumDeudas = document.getElementById('plan-num-deudas');
const planDeudaTotal = document.getElementById('plan-deuda-total');
const planLoQueDebes = document.getElementById('plan-lo-que-debes');
const planLoQuePagarias = document.getElementById('plan-lo-que-pagarias');
const planAhorro = document.getElementById('plan-ahorro');
const planCuotaMensual = document.getElementById('plan-cuota-mensual');
const planDescuentoTotal = document.getElementById('plan-descuento-total');
const planDuracion = document.getElementById('plan-duracion');
const planFecha = document.getElementById('plan-fecha');
const planFolio = document.getElementById('plan-folio');
const planTablaBody = document.getElementById('plan-tabla-body');

let myChart = null;

function calcular() {
  const filas = Array.from(tablaDeudasBody.querySelectorAll('tr'));
  const nombreDeudor = inputNombreDeudor.value.trim() || 'Sin nombre';
  
  let sumaOriginal = 0;
  let sumaDescontada = 0;
  let sumaPorcentajes = 0;
  let numeroDeudas = 0;

  let filasData = [];

  filas.forEach((fila) => {
    numeroDeudas++;
    const inputContrato = fila.querySelector('td:nth-child(1) input');
    const inputTipo = fila.querySelector('td:nth-child(2) input');
    const selectEntidad = fila.querySelector('td:nth-child(3) select');
    const inputDeudaOrig = fila.querySelector('td:nth-child(4) input');
    const inputDesc = fila.querySelector('td:nth-child(5) input');
    const spanDeudaDesc = fila.querySelector('td:nth-child(6) span');

    const deudaOriginal = parseFloat(inputDeudaOrig.value) || 0;
    const descuento = parseFloat(inputDesc.value) || 0;
    const deudaConDesc = parseFloat(spanDeudaDesc.textContent) || 0;

    sumaOriginal += deudaOriginal;
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
  const { ahorro, comisionExito, comisionGestion, totalAPagar, cuotaMensual } = calcularDeuda(sumaOriginal, sumaDescontada, nCuotas);
  
  const promedioDesc = (numeroDeudas > 0) ? (sumaPorcentajes / numeroDeudas) : 0;

  // Muestra resultados
  resultadoFinalDiv.style.display = 'block';
  resultadoFinalDiv.innerHTML = `
    <h3>Resultados (Simulador)</h3>
    <p><strong>Nombre Deudor:</strong> ${nombreDeudor}</p>
    <p><strong>Número de Deudas:</strong> ${numeroDeudas}</p>
    <p><strong>Deuda Original:</strong> €${sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Deuda Descontada:</strong> €${sumaDescontada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Ahorro:</strong> €${ahorro.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Promedio % Descuento:</strong> ${promedioDesc.toFixed(2)}%</p>
    <hr />
    <p><strong>Comisión de Éxito (25% Ahorro):</strong> €${comisionExito.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Comisión de Gestión (10% Deuda Original):</strong> €${comisionGestion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Total a Pagar:</strong> €${totalAPagar.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Cuotas:</strong> ${nCuotas}</p>
    <p><strong>Cuota Mensual:</strong> €${cuotaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
  `;

  // Actualizar el plan
  planContainerOuter.style.display = 'block';
  planNombreDeudor.textContent = nombreDeudor;
  planNumDeudas.textContent = numeroDeudas;
  planDeudaTotal.textContent = '€' + sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  planLoQueDebes.textContent = '€' + sumaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  planLoQuePagarias.textContent = '€' + sumaDescontada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  planAhorro.textContent = '€' + ahorro.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  planCuotaMensual.textContent = '€' + cuotaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  let descuentoPorc = (sumaOriginal > 0) ? (ahorro / sumaOriginal) * 100 : 0;
  planDescuentoTotal.textContent = descuentoPorc.toFixed(2) + '%';
  planDuracion.textContent = nCuotas + ' meses';

  // Fecha y Folio
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  planFecha.textContent = `${dia}/${mes}/${anio}`;
  
  const folioGenerado = generarNuevoFolio();
  planFolio.textContent = folioGenerado;

  // Llenar la tabla de deudas en el plan
  planTablaBody.innerHTML = '';
  filasData.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.entidad}</td>
      <td>€${item.deudaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>€${item.deudaConDesc.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    planTablaBody.appendChild(row);
  });

  // Gráfico
  actualizarGrafico(ahorro, sumaDescontada);

  // Guardar en historial
  guardarSimulacion({
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

function generarNuevoFolio() {
  let contador = parseInt(localStorage.getItem('contadorFolio')) || 0;
  contador++;
  ultimoContadorFolio = contador;
  localStorage.setItem('contadorFolio', contador);
  
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${(hoy.getMonth()+1).toString().padStart(2,'0')}${hoy.getDate().toString().padStart(2,'0')}`;
  
  return `FOLIO-${fecha}-${contador.toString().padStart(4, '0')}`;
}

/**********************************************************
 * HISTORIAL DE SIMULACIONES
 **********************************************************/
function guardarSimulacion(simulacion) {
  let historial = JSON.parse(localStorage.getItem('historialSimulaciones')) || [];
  historial.push(simulacion);
  localStorage.setItem('historialSimulaciones', JSON.stringify(historial));
}

function cargarHistorial() {
  return JSON.parse(localStorage.getItem('historialSimulaciones')) || [];
}

function mostrarHistorial() {
  const historial = cargarHistorial();
  const historialBody = document.getElementById('historialBody');
  historialBody.innerHTML = '';
  
  historial.forEach((sim) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sim.folio}</td>
      <td>${sim.fecha}</td>
      <td>${sim.nombreDeudor}</td>
      <td>${sim.numeroDeudas}</td>
      <td>€${sim.deudaOriginal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>€${sim.deudaDescontada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>€${sim.ahorro.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>€${sim.totalAPagar.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>
        <button class="btn-eliminar-historial" data-folio="${sim.folio}">
          Eliminar
        </button>
      </td>
    `;
    historialBody.appendChild(tr);
  });
  
  document.getElementById('historialContainer').style.display = 'block';
}

// Eliminar entradas específicas del historial
document.getElementById('historialBody').addEventListener('click', (e) => {
  if (e.target.matches('.btn-eliminar-historial')) {
    const folio = e.target.getAttribute('data-folio');
    let historial = cargarHistorial();
    historial = historial.filter((sim) => sim.folio !== folio);
    localStorage.setItem('historialSimulaciones', JSON.stringify(historial));
    mostrarHistorial();
  }
});

function ocultarHistorial() {
  document.getElementById('historialContainer').style.display = 'none';
}

/**********************************************************
 * RE-ANALIZAR
 **********************************************************/
function reAnalizar() {
  tablaDeudasBody.innerHTML = '';
  resultadoFinalDiv.style.display = 'none';
  planContainerOuter.style.display = 'none';
  inputNombreDeudor.value = '';
  inputNumCuotas.value = '12';

  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
  // Se vuelve a iniciar con una fila
  agregarFila();
}

/**********************************************************
 * GRÁFICO (Chart.js)
 **********************************************************/
let myChart = null;
function actualizarGrafico(ahorro, sumaDescontada) {
  const ctx = document.getElementById('myChart').getContext('2d');
  if (myChart) {
    myChart.destroy();
  }
  
  const data = {
    labels: ['Ahorro', 'Pago'],
    datasets: [
      {
        data: [ahorro, sumaDescontada],
        backgroundColor: ['#34c759', '#007aff'],
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || '';
            let value = context.parsed;
            return `${label}: €${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
  };
  
  myChart = new Chart(ctx, {
    type: 'doughnut',
    data,
    options,
  });
}

/**********************************************************
 * DESCARGAR PLAN EN PDF
 **********************************************************/
function descargarPlan() {
  window.scrollTo(0, 0);
  const planDiv = document.getElementById('plan-de-liquidacion');
  const fechaFilename = planFecha.textContent.replaceAll('/', '-');
  const nombreDeudor = planNombreDeudor.textContent.trim() || 'Simulacion';
  
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${nombreDeudor}_${fechaFilename}_${ultimoContadorFolio.toString().padStart(4, '0')}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 2,
      logging: true,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
    },
  };

  html2pdf().from(planDiv).set(opt).save();
}

/**********************************************************
 * INTEGRACIÓN CON GOOGLE SHEETS
 **********************************************************/
function enviarDatosAGoogleSheets() {
  // 1. Recolectar datos
  const folio = planFolio.textContent.trim();
  const fecha = planFecha.textContent.trim();
  const nombreDeudor = planNombreDeudor.textContent.trim();
  const numeroDeudas = planNumDeudas.textContent.trim();
  const deudaOriginal = planDeudaTotal.textContent.replace('€','').trim();
  const deudaDescontada = planLoQuePagarias.textContent.replace('€','').trim();
  const ahorro = planAhorro.textContent.replace('€','').trim();
  let totalAPagar = document.getElementById('resultadoTotalAPagar')
                     .textContent.split('€')[1]?.trim() || 0;

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

  // 2. Convertir a x-www-form-urlencoded
  const formData = new URLSearchParams();
  for (const key in datosPlan) {
    formData.append(key, datosPlan[key]);
  }

  // 3. URL de tu Web App de Google Apps Script
  const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxLEVjy-I3VrnhJKFW9NORhI1QoHJ3LDgDIcHg0OccsAIULynDTVzgRhUXn1XJmFfa1/exec";

  // 4. Hacer el POST
  fetch(GOOGLE_SHEET_ENDPOINT, {
    method: "POST",
    mode: "cors", // O "no-cors" si surge problema
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  })
  .then(response => response.text())
  .then(data => {
    if (data.includes("OK")) {
      alert("¡Plan contratado y enviado a Google Sheets!");
    } else {
      alert("Error al enviar datos: " + data);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error de conexión o CORS al enviar datos a Google Sheets.");
  });
}

/**********************************************************
 // SI NO QUIERES USAR ONEDRIVE, COMENTAR/ELIMINAR
**********************************************************/
/*
// Configuración para Azure y OneDrive
const onedriveConfig = {
  clientId: '70c93901-d8a3-46e0-a4ac-ff1100a9b04e',
  redirectUri: 'https://rlxhomie.github.io/Reestructuraciones/',
  excelFilePath: '/Documents/PlanesContratados.xlsx',
  worksheetName: 'Planes',
  scopes: ['Files.ReadWrite', 'Sites.ReadWrite.All'],
};

const msalInstance = new msal.PublicClientApplication({
  auth: {
    clientId: onedriveConfig.clientId,
    redirectUri: onedriveConfig.redirectUri,
  },
});

async function autenticarYEnviarOneDrive() { ... }
async function enviarDatosAOneDriveExcel(token) { ... }
function recopilarDatosPlan() { ... }
function mostrarIndicadorCarga(mostrar) { ... }
*/
