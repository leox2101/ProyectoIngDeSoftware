# Portal de Empleo

Aplicación web que conecta candidatos con empresas. El candidato sube su hoja de vida en PDF, el sistema identifica sus habilidades, educación y experiencia, y las compara con los requisitos obligatorios (must-have) y deseables (nice-to-have) de cada vacante activa.

**Stack:** Next.js 16 (App Router) + React 19, TypeScript, Prisma ORM, PostgreSQL, bcryptjs, jose (JWT), pdf2json.

## Instalación local

Requisitos: Node.js 20 o superior y una base de datos PostgreSQL.

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz (no se sube al repositorio):

   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/portal_empleo"
   SESSION_SECRET="una-cadena-larga-y-aleatoria"
   RESEND_API_KEY="re_tu_clave_de_resend"
   RESEND_FROM_EMAIL="Portal de Empleo <correo@tu-dominio-verificado.com>"
   ```

   - `DATABASE_URL`: conexión a PostgreSQL.
   - `SESSION_SECRET`: clave con la que se firman los JWT de sesión. La aplicación no arranca sin ella.
   - `RESEND_API_KEY`: clave privada de API de Resend para enviar correos desde el servidor.
   - `RESEND_FROM_EMAIL`: remitente autorizado en Resend. En producción debe pertenecer a un dominio verificado.

3. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Inicia el servidor de desarrollo y abre [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

Otros comandos: `npm run build` (compilación de producción), `npm start` (servir la compilación) y `npm run lint`.

## Cómo probar el flujo completo

1. En la portada, crea una cuenta como **Soy empresa**. Entrarás a `/empresa`.
2. Publica una vacante, por ejemplo: *"Se requiere experiencia con React y PostgreSQL. Se valorará conocer Docker."* El panel muestra en vivo qué requisitos detecta y si son obligatorios o deseables.
3. Cierra sesión y crea una cuenta como **Busco empleo**. Entrarás a `/candidato`.
4. Sube un CV en PDF con secciones `EDUCACIÓN`, `EXPERIENCIA` y `HABILIDADES`. El panel muestra lo identificado, el texto del CV con los fragmentos resaltados y las vacantes con su porcentaje de coincidencia.

## Estructura

```
app/
  page.tsx              Portada y registro
  login/                Inicio de sesión
  candidato/            Panel del candidato (CV y vacantes recomendadas)
  empresa/              Panel de la empresa (publicar y gestionar vacantes)
  components/           Barra superior, texto resaltado, avisos
  api/                  Endpoints del servidor (ver tabla)
  lib/
    auth.ts             Creación y verificación de sesiones (JWT)
    prisma.ts           Cliente de Prisma
    parserCV.ts         Extracción de habilidades, educación y experiencia
    extractorRequisitos.ts  Detección y clasificación de requisitos
    api.ts              Cliente del front para llamar a la API
    resaltado.ts        Marca en un texto los fragmentos identificados
middleware.ts           Protege /candidato y /empresa según el rol
prisma/                 Esquema y migraciones
```

## Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/registro` | público | Crea un usuario CANDIDATO o EMPRESA |
| POST | `/api/login` | público | Valida credenciales y crea la cookie de sesión |
| POST | `/api/logout` | cualquiera | Elimina la cookie de sesión |
| GET | `/api/sesion` | cualquiera | Devuelve el usuario de la sesión activa |
| POST | `/api/cv` | CANDIDATO | Procesa el PDF y guarda habilidades, educación y experiencia |
| GET | `/api/perfil` | CANDIDATO | Devuelve el CV y lo que se extrajo de él |
| GET | `/api/coincidencias` | CANDIDATO | Calcula y guarda el porcentaje con cada vacante activa |
| GET | `/api/vacantes` | EMPRESA | Lista las vacantes de la empresa |
| POST | `/api/vacantes` | EMPRESA | Publica una vacante y extrae sus requisitos |
| PATCH | `/api/vacantes/[id]` | EMPRESA | Activa o pausa una vacante propia |
| POST | `/api/vacantes/[id]/postular` | CANDIDATO | Envía por correo la postulación con habilidades y porcentaje de compatibilidad, sin crear registros en la base de datos |

## Reglas de coincidencia

- Porcentaje = 60 % × (obligatorios cumplidos / total obligatorios) + 40 % × (deseables cumplidos / total deseables). Si una vacante no tiene requisitos de un tipo, esa parte cuenta como 100 %.
- Un candidato **cumple** la vacante si tiene todos los obligatorios y al menos un deseable.
- Las habilidades se comparan sin distinguir mayúsculas ni tildes y como palabra completa (por ejemplo, "Java" no coincide con "JavaScript").

## Envío de postulaciones por correo

El botón **Postularme** envía un correo al contacto de la vacante (o al correo de la cuenta de la empresa si no se indicó uno). El mensaje incluye el nombre y correo del candidato, sus habilidades identificadas y el porcentaje de compatibilidad calculado con los requisitos de la vacante. No se guarda una postulación en la base de datos.

Para habilitarlo, crea una cuenta en [Resend](https://resend.com), genera una API Key y configura `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en el archivo `.env`. El remitente debe estar autorizado por Resend; para enviar a destinatarios externos en producción, verifica un dominio. No compartas ni subas la API Key al repositorio.


## Postulaciones por correo

Las postulaciones se registran en la tabla `Postulacion`, con una restricción única por candidato y vacante. El registro conserva el destinatario, los datos del correo y el porcentaje calculado al momento de postularse. Los estados son `PENDIENTE`, `ENVIADA` y `ERROR`.

El endpoint bloquea postulaciones ya enviadas o en proceso. Si un envío falla, permite reintentarlo usando el mismo contenido guardado y la misma clave de idempotencia de Resend (`postulacion-<id>`), para evitar correos repetidos cuando el proveedor ya aceptó la solicitud pero se perdió la respuesta.

Para aplicar la nueva estructura en una base existente, ejecutar:

```bash
npx prisma migrate deploy
npx prisma generate
```

El destinatario se toma de `Vacante.correoContacto`; si está vacío, se usa el correo de la cuenta de la empresa. Resend exige un dominio remitente verificado para enviar a destinatarios arbitrarios.
