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
  const historialContainer
