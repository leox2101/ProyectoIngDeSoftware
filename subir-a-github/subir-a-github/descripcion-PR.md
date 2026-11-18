## Panel de administración de vacantes y paleta institucional de Magneto

### Qué cambia

**1. Eliminar vacantes (API)**
- Nuevo endpoint `DELETE /api/vacantes/[id]`.
- Solo la empresa dueña puede eliminar la vacante. Se valida la sesión, el rol `EMPRESA` y que la vacante le pertenezca.
- Los requisitos, coincidencias y postulaciones de la vacante se borran en cascada, según el esquema de Prisma.

**2. Panel de administración de vacantes (`/empresa/vacantes`)**
- Tarjetas de resumen: vacantes creadas, activas, pausadas y evaluaciones de candidatos.
- Tabla con todas las vacantes de la empresa: estado, requisitos, candidatos evaluados y fecha de publicación.
- Filtro por estado (Todas / Activas / Pausadas) y búsqueda por título o ubicación.
- Botones para **pausar o activar** cada vacante y para **eliminarla**, con un diálogo de confirmación.
- Accesos nuevos desde el panel de empresa ("Administrar vacantes" y "Ver todas") y desde la barra superior ("Mis vacantes").
- En celular, la tabla se muestra como tarjetas.

**3. Paleta institucional de Magneto**
- **Morado institucional:** botones principales, enlaces, barra superior y logo.
- **Azul profundo / azul brillante:** títulos, foco del teclado e información.
- **Verde esmeralda:** botones de llamado a la acción (nueva clase `.boton-acento`). **Menta:** requisitos deseables.
- **Lavanda:** requisitos obligatorios. **Blanco y gris oscuro:** base neutra y texto.
- Se ajustó también el modo oscuro.

### Cómo probarlo
1. Inicia sesión con una cuenta de empresa y entra a **Mis vacantes**.
2. Pausa y vuelve a activar una vacante. El estado y el resumen se actualizan.
3. Elimina una vacante y confirma en el diálogo. Desaparece de la lista y deja de aparecer para los candidatos.
4. Revisa la portada, el login y los paneles para ver la paleta nueva.
