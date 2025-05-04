# Guía de Implementación y Despliegue

Este documento proporciona instrucciones detalladas para implementar y desplegar el Simulador de Reestructuración DMD en un entorno de producción.

## Cambios Realizados

### 1. Solución para el PDF en blanco

Se ha mejorado la función de generación de PDF (`descargarPlanMejorado`) con las siguientes modificaciones:

- Habilitación de `allowTaint` y `foreignObjectRendering` en la configuración de html2canvas
- Uso del método `.save()` directamente en lugar del método encadenado anterior
- Mejora en el manejo de rutas de imágenes para asegurar que sean absolutas
- Adición de notificaciones durante el proceso de generación del PDF

### 2. Corrección del almacenamiento en Google Sheets

Se ha corregido el problema de almacenamiento en Google Sheets:

- Actualización del nombre de la hoja en `appscript.js` de "DetallesContratos" a "Detalles" para que coincida con el nombre real de la hoja de cálculo
- Verificación de que todos los nombres de hojas coincidan con los especificados por el usuario

### 3. Implementación de la funcionalidad para editar contratos del historial

Se han realizado mejoras significativas para permitir la edición de contratos desde el historial:

- Adición de una variable `folioEditando` en SimuladorModule para rastrear cuando se está editando un contrato existente
- Mejora de la función `editarContratoDesdeHistorial` para cargar correctamente los datos del contrato
- Implementación de la función `actualizarContrato` en GoogleSheetsModule para permitir la actualización de contratos existentes
- Modificación de la función `contratarPlan` para detectar si es una actualización o un nuevo contrato

### 4. Reorganización de la estructura de archivos

Se ha reorganizado la estructura de archivos para una mejor organización:

- Creación de carpetas específicas para cada tipo de recurso (assets, css, js, libs, test)
- Movimiento de archivos a sus respectivas carpetas
- Actualización de referencias en el código para reflejar la nueva estructura

## Instrucciones de Despliegue

### Requisitos Previos

- Servidor web (Apache, Nginx, etc.) o servicio de hosting
- Cuenta de Google para configurar Google Apps Script
- Google Sheet existente llamada "Planes Contratados" con las hojas: Entidades, TiposProducto, Contratos, Detalles, Historial

### Pasos para el Despliegue

1. **Configuración de Google Apps Script**

   a. Accede a [Google Apps Script](https://script.google.com/)
   
   b. Crea un nuevo proyecto
   
   c. Copia el contenido del archivo `appscript.js` en el editor
   
   d. Guarda el proyecto con un nombre descriptivo (ej. "DMD-Simulador-Backend")
   
   e. Despliega como aplicación web:
      - Ejecutar como: Tu cuenta
      - Quién tiene acceso: Cualquier persona, incluso anónimo
   
   f. Copia la URL generada (será necesaria en el paso 2c)

2. **Configuración del Frontend**

   a. Descarga todos los archivos del repositorio
   
   b. Abre el archivo `js/main-improved.js` en un editor de texto
   
   c. Localiza la constante `GOOGLE_SHEET_ENDPOINT` (aproximadamente en la línea 91) y actualiza su valor con la URL obtenida en el paso 1f
   
   d. Guarda los cambios

3. **Subida de Archivos al Servidor**

   a. Sube todos los archivos y carpetas a tu servidor web manteniendo la estructura de directorios
   
   b. Asegúrate de que los permisos de archivos sean correctos (generalmente 644 para archivos y 755 para directorios)

4. **Verificación de la Instalación**

   a. Accede a la URL donde has subido los archivos
   
   b. Verifica que la página se cargue correctamente
   
   c. Realiza una prueba completa siguiendo el plan de pruebas en `test/test-plan.md`

## Solución de Problemas Comunes

### Error de CORS en Google Apps Script

Si encuentras errores de CORS al intentar comunicarte con Google Apps Script:

1. Verifica que la aplicación web esté configurada para permitir acceso anónimo
2. Asegúrate de que la URL del endpoint sea correcta y no contenga errores tipográficos
3. Intenta añadir el siguiente código al inicio de tu función `doGet` y `doPost` en `appscript.js`:

```javascript
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    // Configurar CORS
    var headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (e.parameter.accion === 'obtenerHistorial') {
      // Código existente para obtenerHistorial
    } else if (e.parameter.accion === 'guardarContrato') {
      // Código existente para guardarContrato
    }
    // ... resto del código
  } catch(error) {
    // Manejo de errores
  } finally {
    lock.releaseLock();
  }
}
```

### PDF se genera en blanco o incompleto

Si el PDF sigue generándose en blanco o incompleto:

1. Verifica que todas las bibliotecas (html2canvas, jsPDF, html2pdf) estén correctamente cargadas
2. Asegúrate de que las rutas a las imágenes sean correctas y accesibles
3. Revisa la consola del navegador para identificar posibles errores de JavaScript
4. Intenta aumentar el valor de `scale` en la configuración de html2canvas (línea 1307 aproximadamente en `main-improved.js`)

### Datos no se guardan en Google Sheets

Si los datos no se guardan correctamente en Google Sheets:

1. Verifica que la URL del endpoint en `main-improved.js` sea correcta
2. Asegúrate de que las hojas en Google Sheets tengan los nombres exactos: "Contratos", "Detalles", "Historial", "Entidades", "TiposProducto"
3. Revisa los permisos de la aplicación web en Google Apps Script
4. Verifica que la hoja de cálculo esté compartida con la cuenta que ejecuta el script

## Mantenimiento

Para mantener la aplicación funcionando correctamente:

1. **Actualizaciones regulares**:
   - Revisa periódicamente las bibliotecas utilizadas (html2canvas, jsPDF, html2pdf) para actualizaciones de seguridad
   - Actualiza el código según sea necesario

2. **Copia de seguridad**:
   - Realiza copias de seguridad regulares de la hoja de cálculo de Google Sheets
   - Mantén una copia del código fuente en un repositorio de control de versiones

3. **Monitoreo**:
   - Revisa periódicamente los registros de errores en la consola del navegador
   - Verifica que la comunicación con Google Apps Script funcione correctamente

## Contacto para Soporte

Si encuentras problemas durante la implementación o necesitas asistencia adicional, puedes contactar al equipo de soporte técnico.
