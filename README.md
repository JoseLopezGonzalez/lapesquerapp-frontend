# PesquerApp – Laravel API (Backend)

**PesquerApp** es una plataforma ERP multiempresa (_multi-tenant_) diseñada especialmente para pequeñas y medianas industrias del sector pesquero y distribuidores. Este repositorio contiene la API principal, desarrollada en Laravel, que sirve como núcleo de comunicación entre las interfaces de usuario y las bases de datos de cada empresa.

---

## 🚀 Características principales

- 🌐 Arquitectura SaaS multi-tenant con subdominios tipo `empresa.pesquerapp.es`
- 🔁 Cambio dinámico de base de datos según el subdominio (`X-Tenant`)
- 🧾 Módulo avanzado de gestión de pedidos con generación de documentos PDF y envío por email
- 🏷️ Generación e impresión de etiquetas con códigos de barras y QR
- 📦 Control de stock en almacenes reales mediante mapas interactivos de palets y cajas
- 🧠 Análisis de producción con sistema de diagrama de nodos
- 🤖 Extracción de datos con IA desde PDFs de lonjas locales
- 🔐 Sistema de autenticación por token (Laravel Sanctum)

---

## 🧱 Tecnologías utilizadas

- **Laravel 11**
- **MySQL** (una base central + una por tenant)
- **Sanctum** para autenticación
- **Docker / Coolify** para despliegue

---

## ⚙️ Arquitectura

- Una sola API (`api.pesquerapp.es`) sirve a todas las empresas
- Cada empresa tiene su propia base de datos (`db_empresa1`, `db_empresa2`, etc.)
- Se utiliza un **middleware** que:
  - Detecta la cabecera `X-Tenant`
  - Busca el subdominio en la tabla `tenants` de la base central
  - Cambia la conexión activa a la base de datos correspondiente (`DB::setDefaultConnection`)

---

## 🧑‍💼 Superusuario (modo invisible)

- Existen usuarios `superadmin` definidos en la base central
- Estos pueden iniciar sesión desde cualquier subdominio sin estar presentes en su base de datos
- Laravel simula la sesión de forma segura y sin alterar el sistema de usuarios del tenant

---

## 📦 Instalación local

```bash
git clone https://github.com/tuusuario/pesquerapp-backend.git
cd pesquerapp-backend

composer install
cp .env.example .env
php artisan key:generate

# Configura tu .env con la base de datos central (ej: db_pesquerapp_main)

php artisan migrate
php artisan serve
