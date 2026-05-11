# Operations-Management-System

## Requisitos

- Docker
- Docker Compose

## Levantar el proyecto desde cero

Este proyecto corre una API en Node.js/TypeScript y una base de datos PostgreSQL usando Docker.

Desde la raiz del repositorio, ejecutar:

```bash
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
```

## Que hace cada comando

- `docker compose up --build -d`: construye y levanta los contenedores de la API y la base de datos.
- `docker compose exec api npx prisma migrate deploy`: aplica las migraciones de Prisma sobre la base de datos.

## Accesos

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Credenciales de la base de datos

- Usuario: `user`
- Password: `password`
- Base de datos: `midb`

## Notas

- La variable `DATABASE_URL` del proyecto esta configurada para usar el servicio `db` de Docker.
- No hay un seed configurado en este repositorio, por lo que no hace falta ejecutar una carga inicial de datos.
