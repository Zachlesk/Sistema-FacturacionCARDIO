# 🏥 Sistema de Facturación Médica

Aplicación web desarrollada como parte de una **Sistema de Facturacion Medica**, cuyo objetivo es permitir el registro, gestión y visualización de información básica, financiera y complementaria de pacientes, cumpliendo con reglas de negocio y generación de reportes.

---

## 🎯 Objetivo

Desarrollar un sistema web que permita almacenar por medio de un formulario web los datos:
- Básicos
- Financieros
- Complementarios

De los pacientes, garantizando validaciones, persistencia en base de datos y visualización de la información.

---

## 🧾 Descripción General

El sistema permite registrar pacientes, gestionar procedimientos médicos y realizar facturación de servicios, además de generar reportes en formato gráfico y exportable.  
La aplicación es completamente **responsiva** y accesible desde cualquier dispositivo.

---

## ✅ Cumplimiento de Requerimientos

### a) Formulario web y base de datos
- Formulario web para el registro de pacientes
- Validaciones de datos numéricos, fechas y cálculos financieros
- Almacenamiento en una **base de datos relacional (PostgreSQL)** correctamente normalizada con Supabase
- Persistencia de datos mediante Supabase

---

### b) Microservicio WS
- Implementación de un microservicio a través de Supabase
- Consulta de los datos principales del paciente registrado
- Retorno de información en formato JSON
- Consumo del servicio desde el frontend mediante llamadas asíncronas

---

### c) Diseño responsivo
- Interfaz adaptable a:
  - PC
  - Celular
- Diseño flexible usando CSS y componentes React
- Correcta visualización en distintos tamaños de pantalla

---

### d) Módulo visor de libros
- Acceso fácil al contenido cargado en el sistema

---

### e) Módulo de reportes
- Visualización de reportes en tablas
- Generación de gráficas dinámicas (barras)
- Exportación de información a formato **Excel**
- Reportes basados en los datos ingresados al sistema

---

### f) Carga de información mediante archivos `.xlsx`
- Módulo de carga masiva de información
- Lectura de archivos `.xlsx`
- Validación de datos
- Inserción directa a la base de datos
- Soporte para información básica y financiera del paciente


## 🔌 Conexión con Supabase

La conexión a la base de datos se realiza mediante Supabase, configurado a través de variables de entorno.

### Archivo de conexión

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ongdfwxtpajtnemwocdh.supabase.co'
const supabaseAnonKey = 'sb_publishable_Q933oVS43cO5GJPlatSN_A_MMot0WJ3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
