<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Optimizado</title>
</head>
<body>

<!-- Elementos de UI, tabla y botones -->
<button id="btnAgregarFila">Agregar Fila</button>
<button id="btnCalcular">Calcular</button>
<button id="btnReAnalizar">Re-Analizar</button>
<button id="btnMostrarHistorial">Mostrar Historial</button>
<button id="btnCerrarHistorial">Cerrar Historial</button>
<button id="btnDescargarPlan">Descargar Plan</button>
<button id="btnContratar">Contratar</button>

<input id="nombreDeudor" type="text" placeholder="Nombre Deudor"/>
<input id="numCuotas" type="number" value="12"/>

<div id="resultadoFinal" style="display:none;">Resultado</div>
<div id="planContainerOuter" style="display:none;">Plan Container</div>
<div id="historialContainer" style="display:none;">Historial</div>

<table>
  <thead>
    <tr>
      <th>N° Contrato</th>
      <th>Tipo Producto</th>
      <th>Entidad</th>
      <th>Importe</th>
      <th>% Descuento</th>
      <th>Importe c/desc</th>
      <th>Eliminar</th>
    </tr>
  </thead>
  <tbody id="tablaDeudas"></tbody>
</table>

<canvas id="myChart"></canvas>

<script>
/**********************************************************
 * VARIABLES
 **********************************************************/
let ENTIDADES = [];
let TIPOS_PRODUCTO = [];
let myChart = null; // Chart.js

// Referencias a elementos del DOM para reutilizar
const tablaDeudasBody = document.getElementById('tablaDeudas');
const btnAgregarFila = document.getElementById('btnAgregarFila');
const btnCalcular = document.getElementById('btnCalcular');
const btnReAnalizar = document.getElementById('btnReAnalizar');
const btnMostrarHistorial = document.getElementById('btnMostrarHistorial');
const btnCerrarHistorial = document.getElementById('btnCerrarHistorial');
const btnDescargarPlan = document.getElementById('btnDescargarPlan');
const btnContratar = document.getElementById('btnContratar');

/**********************************************************
 * EVENTOS DOM
 **********************************************************/
document.addEventListener('DOMContentLoaded', async () => {
  await cargarListasDesdeSheets();

  // Asignar eventos
  btnAgregarFila.addEventListener('click', agregarFila);
  btnCalcular.addEventListener('click', calcular);
  btnReAnalizar.addEventListener('click', reAnalizar);
  btnMostrarHistorial.addEventListener('click', mostrarHistorial);
  btnCerrarHistorial.addEventListener('click', ocultarHistorial);
  btnDescargarPlan.addEventListener('click', descargarPlan);
  btnContratar.addEventListener('click', enviarDatosAGoogleSheets);

  // Iniciar con 1 fila
  agregarFila();
});

// Manejo de input con "debounce" para optimizar recálculos
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

tablaDeudasBody.addEventListener('input', debounce((evt) => {
  if(evt.target.tagName === 'INPUT'){
    const fila = evt.target.closest('tr');
    if(fila) recalcularFila(fila);
  }
}, 300));

/**********************************************************
 * CARGA DE DATOS (doGet)
 **********************************************************/
const cargarListasDesdeSheets = async () => {
  const url = "https://script.google.com/macros/s/AKfycbyn0xR5H88NT0m_QQc9GEta46hoOiLJzgxb5WVcW19A7yqxwjb-4XUEb06-oHr48dOC/exec";
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    // Se esperan data.entidades y data.tiposProducto
    ENTIDADES = data.entidades || [];
    TIPOS_PRODUCTO = data.tiposProducto || [];
    console.log("ENTIDADES cargadas:", ENTIDADES);
    console.log("TIPOS_PRODUCTO cargados:", TIPOS_PRODUCTO);
  } catch(err) {
    console.error("Error al cargar doGet:", err);
    ENTIDADES = [];
    TIPOS_PRODUCTO = [];
  }
};

/**********************************************************
 * FUNCIONES AUXILIARES PARA CREAR ELEMENTOS
 **********************************************************/
const crearOpcion = (valor, texto, title = '') => {
  const option = document.createElement('option');
  option.value = valor;
  option.textContent = texto;
  if(title) option.title = title;
  return option;
};

const crearInput = (type, placeholder = '') => {
  const inp = document.createElement('input');
  inp.type = type;
  if(placeholder) inp.placeholder = placeholder;
  return inp;
};

const crearSelectConOpciones = (opciones) => {
  const sel = document.createElement('select');
  opciones.forEach((op) => {
    // Limita la vista a 45 caracteres
    const displayText = op.length > 45 ? op.substring(0,42) + "..." : op;
    const nuevaOpcion = crearOpcion(op, displayText, op);
    sel.appendChild(nuevaOpcion);
  });
  return sel;
};

/**********************************************************
 * TABLA DE DEUDAS
 **********************************************************/
const agregarFila = () => {
  const tr = document.createElement('tr');

  // Col 1) N° Contrato
  const tdContrato = document.createElement('td');
  const inContrato = crearInput('text', 'Ej: 12345');
  tdContrato.appendChild(inContrato);

  // Col 2) Tipo Producto
  const tdTipo = document.createElement('td');
  const selTipo = document.createElement('select');
  TIPOS_PRODUCTO.forEach(tp => {
    const opcion = crearOpcion(tp, tp);
    selTipo.appendChild(opcion);
  });
  tdTipo.appendChild(selTipo);

  // Col 3) Entidad
  const tdEntidad = document.createElement('td');
  const selEntidad = crearSelectConOpciones(ENTIDADES);
  tdEntidad.appendChild(selEntidad);

  // Col 4) Importe
  const tdImporte = document.createElement('td');
  const inImporte = crearInput('number', '3000');
  tdImporte.appendChild(inImporte);

  // Col 5) % Descuento
  const tdDesc = document.createElement('td');
  const inDesc = crearInput('number', '30');
  tdDesc.appendChild(inDesc);

  // Col 6) Importe con desc
  const tdConDesc = document.createElement('td');
  const spConDesc = document.createElement('span');
  spConDesc.textContent = '0.00';
  tdConDesc.appendChild(spConDesc);

  // Col 7) Eliminar
  const tdEliminar = document.createElement('td');
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn-borrar';
  btnEliminar.textContent = '🗑';
  btnEliminar.addEventListener('click', () => {
    tablaDeudasBody.removeChild(tr);
    calcular(); // re-calcular cuando se elimina fila
  });
  tdEliminar.appendChild(btnEliminar);

  // Agregar tds al tr
  tr.appendChild(tdContrato);
  tr.appendChild(tdTipo);
  tr.appendChild(tdEntidad);
  tr.appendChild(tdImporte);
  tr.appendChild(tdDesc);
  tr.appendChild(tdConDesc);
  tr.appendChild(tdEliminar);

  // Agregar tr al tbody
  tablaDeudasBody.appendChild(tr);
};

const recalcularFila = (fila) => {
  const inImporte = fila.querySelector('td:nth-child(4) input');
  const inDesc    = fila.querySelector('td:nth-child(5) input');
  const spConDesc = fila.querySelector('td:nth-child(6) span');

  const importe  = parseFloat(inImporte.value) || 0;
  const desc     = parseFloat(inDesc.value) || 0;
  const conDesc  = importe * (1 - desc/100);
  spConDesc.textContent = conDesc.toFixed(2);
};

/**********************************************************
 * CALCULAR
 **********************************************************/
function calcular(){
  console.log("Aquí pones la lógica para sumar deudas, etc. y actualizar plan, chart...");
  // Semejante a tu simulador actual
}

/**********************************************************
 * RE-ANALIZAR
 **********************************************************/
function reAnalizar(){
  tablaDeudasBody.innerHTML = '';
  document.getElementById('resultadoFinal').style.display='none';
  document.getElementById('planContainerOuter').style.display='none';
  document.getElementById('nombreDeudor').value='';
  document.getElementById('numCuotas').value='12';
  if(myChart) {
    myChart.destroy();
    myChart = null;
  }
  agregarFila();
}

/**********************************************************
 * HISTORIAL
 **********************************************************/
function mostrarHistorial(){
  document.getElementById('historialContainer').style.display='block';
  // Lógica para llenar tu tablaHistorial
}

function ocultarHistorial(){
  document.getElementById('historialContainer').style.display='none';
}

/**********************************************************
 * DESCARGAR PDF
 **********************************************************/
function descargarPlan(){
  console.log("Usa html2pdf + canvas para descargar plan-de-liquidacion en PDF");
}

/**********************************************************
 * ENVIAR DATOS A GOOGLE SHEETS (ejemplo)
 **********************************************************/
function enviarDatosAGoogleSheets(){
  console.log("Recopilar datos y POST al Apps Script doPost...");
  // Similar a tu envío con fetch. 
  // Recorre filas, arma objeto JSON con {folio, filas: [...]} etc.
  // fetch(...) ...
}

/**********************************************************
 * CHART (ejemplo)
 **********************************************************/
function actualizarGrafico(ahorro, sumaDescontada){
  const ctx = document.getElementById('myChart').getContext('2d');
  if(myChart) myChart.destroy();

  const data = {
    labels: ['Ahorro','Pago'],
    datasets: [{
      data: [ahorro, sumaDescontada],
      backgroundColor: ['#34c759','#007aff']
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label(ctx) {
            let label = ctx.label || '';
            let val = ctx.parsed;
            return `${label}: €${val.toLocaleString('es-ES',{minimumFractionDigits:2})}`;
          }
        }
      }
    }
  };
  myChart = new Chart(ctx, {type: 'doughnut', data, options});
}
</script>
</body>
</html>
