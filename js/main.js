/**********************************************************
 * VARIABLES
 **********************************************************/
let ENTIDADES = [];
let TIPOS_PRODUCTO = [];
let myChart = null; // Chart.js

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Cargar arrays de Google Sheets (doGet)
  await cargarListasDesdeSheets();

  // 2) Asignar eventos
  document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);
  document.getElementById('btnCalcular').addEventListener('click', calcular);
  document.getElementById('btnReAnalizar').addEventListener('click', reAnalizar);
  document.getElementById('btnMostrarHistorial').addEventListener('click', mostrarHistorial);
  document.getElementById('btnCerrarHistorial').addEventListener('click', ocultarHistorial);
  document.getElementById('btnDescargarPlan').addEventListener('click', descargarPlan);
  document.getElementById('btnContratar').addEventListener('click', enviarDatosAGoogleSheets);

  // Iniciar la tabla con 1 fila
  agregarFila();
});

/**********************************************************
 * CARGA DE DATOS (doGet)
 **********************************************************/
async function cargarListasDesdeSheets() {
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
}

/**********************************************************
 * TABLA DE DEUDAS
 **********************************************************/
const tablaDeudasBody = document.getElementById('tablaDeudas');

// Manejo de input con "debounce"
function debounce(func, wait) {
  let timeout;
  return function(...args) {
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

function agregarFila(){
  const tr = document.createElement('tr');

  // Col 1) N° Contrato (input text)
  const tdContrato = document.createElement('td');
  const inContrato = document.createElement('input');
  inContrato.type = 'text';
  inContrato.placeholder = 'Ej: 12345';
  tdContrato.appendChild(inContrato);

  // Col 2) Tipo Producto (select)
  const tdTipo = document.createElement('td');
  const selTipo = document.createElement('select');
  TIPOS_PRODUCTO.forEach(tp => {
    const option = document.createElement('option');
    option.value = tp;
    option.textContent = tp;
    selTipo.appendChild(option);
  });
  tdTipo.appendChild(selTipo);

  // Col 3) Entidad (select)
  const tdEntidad = document.createElement('td');
  const selEntidad = document.createElement('select');
  ENTIDADES.forEach(ent => {
    const option = document.createElement('option');
    option.value = ent;
    // si es muy largo, recortar para visual
    let displayText = (ent.length>45)? ent.substring(0,42)+"...": ent;
    option.textContent = displayText;
    option.title = ent;
    selEntidad.appendChild(option);
  });
  tdEntidad.appendChild(selEntidad);

  // Col 4) Importe
  const tdImporte = document.createElement('td');
  const inImporte = document.createElement('input');
  inImporte.type = 'number';
  inImporte.placeholder = '3000';
  tdImporte.appendChild(inImporte);

  // Col 5) % Descuento
  const tdDesc = document.createElement('td');
  const inDesc = document.createElement('input');
  inDesc.type = 'number';
  inDesc.placeholder = '30';
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
    calcular(); // reCalcular
  });
  tdEliminar.appendChild(btnEliminar);

  tr.appendChild(tdContrato);
  tr.appendChild(tdTipo);
  tr.appendChild(tdEntidad);
  tr.appendChild(tdImporte);
  tr.appendChild(tdDesc);
  tr.appendChild(tdConDesc);
  tr.appendChild(tdEliminar);

  tablaDeudasBody.appendChild(tr);
}

function recalcularFila(fila){
  const inImporte = fila.querySelector('td:nth-child(4) input');
  const inDesc    = fila.querySelector('td:nth-child(5) input');
  const spConDesc = fila.querySelector('td:nth-child(6) span');

  const importe  = parseFloat(inImporte.value) || 0;
  const desc     = parseFloat(inDesc.value) || 0;
  const conDesc  = importe * (1 - desc/100);
  spConDesc.textContent = conDesc.toFixed(2);
}

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
  if(myChart) { myChart.destroy(); myChart=null; }
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
    labels:['Ahorro','Pago'],
    datasets:[{
      data:[ahorro, sumaDescontada],
      backgroundColor:['#34c759','#007aff']
    }]
  };
  const options = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      legend:{ position:'top' },
      tooltip:{
        callbacks:{
          label(ctx){
            let label=ctx.label||'';
            let val=ctx.parsed;
            return ${label}: €${val.toLocaleString('es-ES',{minimumFractionDigits:2})};
          }
        }
      }
    }
  };
  myChart = new Chart(ctx,{type:'doughnut',data,options});
}
