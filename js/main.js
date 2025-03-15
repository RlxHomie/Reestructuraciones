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
  const comisionExito = 0.25 * ahorro; // 25% de lo que ahorras
  const comisionGestion = 0.10 * sumaOriginal; // 10% de la deuda original
  const totalAPagar = sumaDescontada + comisionExito + comisionGestion;
  const cuotaMensual = totalAPagar / nCuotas;
  return { ahorro, comisionExito, comisionGestion, totalAPagar, cuotaMensual };
}

/**********************************************************
 * GESTIÓN DE ENTIDADES (GUARDADAS EN LOCALSTORAGE)
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

  // Botón Mostrar/ocultar historial
  document.getElementById('btnMostrarHistorial').addEventListener('click', mostrarHistorial);
  document.getElementById('btnCerrarHistorial').addEventListener('click', ocultarHistorial);

  // Botón de descargar PDF
  document.getElementById('btnDescargarPlan').addEventListener('click', descargarPlan);

  // Preparar tabla con 1 fila inicial
  agregarFila();
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

  // Columna Botón Eliminar
  const tdEliminar = document.createElement('td');
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn-borrar';
  btnEliminar.innerHTML = '🗑';
  btnEliminar.addEventListener('click', () => {
    tablaDeudasBody.removeChild(fila);
    calcular(); // recalcular cuando se borra una fila
  });
  tdEliminar.appendChild(btnEliminar);

  // Insertar todas las celdas en la fila
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
 * BOTÓN CALCULAR Y RESULTADOS
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

  // Mostrar resultados en la parte inferior
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

  // Actualizar la vista del plan
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

  // Fecha y folio
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  planFecha.textContent = `${dia}/${mes}/${anio}`;
  
  const folioGenerado = generarNuevoFolio();
  planFolio.textContent = folioGenerado;

  // Llenar la tabla de detalle de deudas en el plan
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

  // Crear y mostrar el gráfico
  actualizarGrafico(ahorro, sumaDescontada);

  // Guardar la simulación en historial
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

// Evento para eliminar simulaciones específicas
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
 * INTEGRACIÓN CON ONEDRIVE (MSAL)
 **********************************************************/
// Configuración para Azure y OneDrive
const onedriveConfig = {
  clientId: '70c93901-d8a3-46e0-a4ac-ff1100a9b04e', // TU Client ID
  redirectUri: window.location.origin,
  excelFilePath: '/Documents/PlanesContratados.xlsx', // Ajustar ruta
  worksheetName: 'Planes',
  scopes: ['Files.ReadWrite', 'Sites.ReadWrite.All'],
};

const msalInstance = new msal.PublicClientApplication({
  auth: {
    clientId: onedriveConfig.clientId,
    redirectUri: onedriveConfig.redirectUri,
  },
});

// Botón Contratar
const btnContratar = document.getElementById('btnContratar');
// Evitar listeners duplicados si se recarga
btnContratar.replaceWith(btnContratar.cloneNode(true));
document.getElementById('btnContratar').addEventListener('click', autenticarYEnviarOneDrive);

async function autenticarYEnviarOneDrive() {
  try {
    const loginResponse = await msalInstance.loginPopup({ scopes: onedriveConfig.scopes });
    if (!loginResponse.accessToken) {
      throw new Error('No se obtuvo token de acceso');
    }
    await enviarDatosAOneDriveExcel(loginResponse.accessToken);
  } catch (err) {
    alert('Error al autenticar con OneDrive: ' + err);
    console.error(err);
  }
}

async function enviarDatosAOneDriveExcel(token) {
  mostrarIndicadorCarga(true);

  // Recolectar datos actuales del plan
  const datosPlan = recopilarDatosPlan();
  const filaExcel = [
    datosPlan.folio,
    datosPlan.fecha,
    datosPlan.nombreDeudor,
    datosPlan.numeroDeudas,
    datosPlan.deudaOriginal,
    datosPlan.deudaDescontada,
    datosPlan.ahorro,
    datosPlan.totalAPagar,
    datosPlan.cuotaMensual,
    datosPlan.numeroCuotas,
    datosPlan.descuentoTotal,
    datosPlan.comisionGestion,
    datosPlan.comisionExito,
    JSON.stringify(datosPlan.detallesDeudas),
    datosPlan.asesor,
    datosPlan.emailAsesor,
    new Date().toISOString(),
  ];

  const url = `https://graph.microsoft.com/v1.0/me/drive/root:${onedriveConfig.excelFilePath}:/workbook/worksheets('${onedriveConfig.worksheetName}')/tables/Table1/rows/add`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [filaExcel] }),
    });

    if (!response.ok) {
      throw new Error('Error al enviar datos a Excel: ' + (await response.text()));
    }

    alert('Plan contratado y registrado en OneDrive Excel correctamente.');
    // Opcional: descargar PDF tras contratar
    descargarPlan();
  } catch (err) {
    alert('Error al enviar datos a OneDrive: ' + err);
    console.error(err);
  } finally {
    mostrarIndicadorCarga(false);
  }
}

// Recolectar datos del plan (lo que se muestra en la sección final)
function recopilarDatosPlan() {
  const deudaOriginalNum = parseFloat(planDeudaTotal.textContent.replace('€','').replaceAll('.', '').replace(',', '.')) || 0;
  const loQuePagariasNum = parseFloat(planLoQuePagarias.textContent.replace('€','').replaceAll('.', '').replace(',', '.')) || 0;
  const ahorroNum = parseFloat(planAhorro.textContent.replace('€','').replaceAll('.', '').replace(',', '.')) || 0;
  const totalAPagarNum = parseFloat(document.querySelector('#resultadoFinal strong + strong, #resultadoTotalAPagar').textContent?.split('€')[1]?.trim()?.replaceAll('.', '')?.replace(',', '.') || 0) || 0;
  
  const cuotaMensualNum = parseFloat(planCuotaMensual.textContent.replace('€','').replaceAll('.', '').replace(',', '.')) || 0;
  const descuentoPorc = parseFloat(planDescuentoTotal.textContent.replace('%','').replace(',', '.')) || 0;
  const numCuotasNum = parseInt(inputNumCuotas.value) || 12;

  // Recolectar filas de la tabla principal para tener detalles
  const filas = Array.from(tablaDeudasBody.querySelectorAll('tr'));
  const detallesDeudas = filas.map((fila) => {
    return {
      numeroContrato: (fila.querySelector('td:nth-child(1) input')?.value || ''),
      tipoProducto: (fila.querySelector('td:nth-child(2) input')?.value || ''),
      entidad: (fila.querySelector('td:nth-child(3) select')?.value || ''),
      deudaOriginal: parseFloat(fila.querySelector('td:nth-child(4) input')?.value) || 0,
      porcentajeDescuento: parseFloat(fila.querySelector('td:nth-child(5) input')?.value) || 0,
      deudaConDescuento: parseFloat(fila.querySelector('td:nth-child(6) span')?.textContent) || 0,
    };
  });

  return {
    folio: planFolio.textContent,
    fecha: planFecha.textContent,
    nombreDeudor: planNombreDeudor.textContent,
    numeroDeudas: parseInt(planNumDeudas.textContent) || 0,
    deudaOriginal: deudaOriginalNum,
    deudaDescontada: loQuePagariasNum,
    ahorro: ahorroNum,
    totalAPagar: totalAPagarNum,
    cuotaMensual: cuotaMensualNum,
    numeroCuotas: numCuotasNum,
    descuentoTotal: descuentoPorc,
    comisionGestion: parseFloat(document.getElementById('plan-comision-gestion').textContent.replaceAll('.', '').replace(',', '.')) || 0,
    comisionExito: parseFloat(document.getElementById('plan-comision-exito').textContent.replaceAll('.', '').replace(',', '.')) || 0,
    asesor: document.getElementById('plan-asesor').textContent,
    emailAsesor: document.getElementById('plan-asesor-email').textContent,
    detallesDeudas,
  };
}

// Mostrar / ocultar indicador de carga
function mostrarIndicadorCarga(mostrar) {
  let indicador = document.getElementById('indicadorCarga');
  if (!indicador && mostrar) {
    indicador = document.createElement('div');
    indicador.id = 'indicadorCarga';
    indicador.className = 'indicador-carga';
    indicador.innerHTML = `
      <div class="spinner"></div>
      <p>Enviando datos a OneDrive...</p>
    `;
    document.body.appendChild(indicador);
  } else if (indicador && !mostrar) {
    document.body.removeChild(indicador);
  }
}
