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
   ```

   - `DATABASE_URL`: conexión a PostgreSQL.
   - `SESSION_SECRET`: clave con la que se firman los JWT de sesión. La aplicación no arranca sin ella.

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

## Reglas de coincidencia

- Porcentaje = 60 % × (obligatorios cumplidos / total obligatorios) + 40 % × (deseables cumplidos / total deseables). Si una vacante no tiene requisitos de un tipo, esa parte cuenta como 100 %.
- Un candidato **cumple** la vacante si tiene todos los obligatorios y al menos un deseable.
- Las habilidades se comparan sin distinguir mayúsculas ni tildes y como palabra completa (por ejemplo, "Java" no coincide con "JavaScript").
