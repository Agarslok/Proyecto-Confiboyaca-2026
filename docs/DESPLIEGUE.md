# Publicar el Radar IA en Netlify con Supabase

Es **un solo sitio** con dos zonas:

| Zona | Dirección | Quién la usa |
|---|---|---|
| Pública | `/`, `/diagnostico`, `/resultado`, `/sitio`, `/encuestas`, `/flyer` | Las empresas |
| Privada | `/consultor` (con contraseña) | El equipo: ver, exportar y reiniciar los datos |

En Netlify los datos **no** pueden quedar en un archivo (no hay disco que se conserve), por eso van en Supabase.

## 1. Supabase (una vez)

1. Entre a [supabase.com](https://supabase.com) y cree un proyecto (región: la más cercana, por ejemplo São Paulo). Guarde la contraseña de la base en un lugar seguro.
2. Vaya a **SQL Editor → New query**, pegue todo el contenido de `supabase/schema.sql` y pulse **Run**. Crea las tablas `diagnoses` y `diagnoses_backup`, con RLS activado y sin políticas (nadie puede leerlas con la llave pública).
3. Vaya a **Project Settings → API** (o **API Keys**) y copie:
   - **Project URL** → será `SUPABASE_URL`.
   - La llave **secreta** (`service_role` o «secret key», nunca la `anon`/«publishable») → será `SUPABASE_SECRET_KEY`.

## 2. Netlify

1. **Add new site → Import an existing project → GitHub** y elija `Agarslok/Proyecto-Confiboyaca-2026`.
2. En **Branch to deploy** elija `prueba/radar-ia` (o la rama que vayan a publicar).
3. El comando y la versión de Node ya están en `netlify.toml`; no hace falta cambiarlos.
4. Antes de publicar, en **Site configuration → Environment variables**, agregue:

| Variable | Valor |
|---|---|
| `RADAR_STORE` | `supabase` |
| `SUPABASE_URL` | La Project URL del paso 1.3 |
| `SUPABASE_SECRET_KEY` | La llave secreta del paso 1.3 |
| `CONSULTOR_PASSWORD` | La contraseña del equipo para `/consultor` (mínimo 10 caracteres) |
| `SESSION_SECRET` | 32 caracteres o más al azar (ver abajo) |

Para generar `SESSION_SECRET` en su computador:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Use una contraseña y un secreto **distintos** a los de su `.env.local`.

5. **Deploy**. Al terminar, abra `https://<su-sitio>.netlify.app` y `https://<su-sitio>.netlify.app/consultor`.

## 3. Comprobar

1. Llene una encuesta completa en el sitio publicado.
2. Entre a `/consultor`: arriba debe decir «base: Supabase» y aparecer el diagnóstico.
3. En Supabase, **Table Editor → diagnoses** debe mostrar la fila.

## Exportar y empezar de cero

- En `/consultor`, al final: **Excel (.xlsx)** con dos hojas, o **CSV**. El PDF de cada empresa es su «Flyer en PDF».
- **Reiniciar la base** (escribir BORRAR) copia todo a `diagnoses_backup` y luego borra `diagnoses`. Úselo antes del lanzamiento final para quitar las pruebas. La copia se puede consultar o borrar desde el Table Editor de Supabase.

## Trabajar en local

Sin cambiar nada, el proyecto usa SQLite (`data/radar.db`). Para probar contra Supabase desde su computador, agregue a `.env.local`:

```
RADAR_STORE=supabase
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

## Pendiente antes de recibir datos reales

- Probar el flujo completo contra el Supabase real: el adaptador está probado contra una imitación de la API, no contra un proyecto de verdad.
- Revisar la política de tratamiento de datos que se enlaza en la autorización (Ley 1581).
- Decidir cuentas por consultor (hoy es una contraseña compartida).
