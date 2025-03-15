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
  const deudaConDescuento = deudaOriginal * (1 - 
