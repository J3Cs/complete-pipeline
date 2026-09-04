# 🎫 Complete Serverless Ticket Processing Pipeline

Pipeline de procesamiento asíncrono e infraestructura como código (IaC) para la gestión y monitoreo de adjuntos en solicitudes de soporte/tickets. El sistema utiliza una arquitectura orientada a eventos (**Event-Driven Architecture**) desplegada localmente mediante **LocalStack** y orquestada con **Terraform**.

---

## 📐 Arquitectura del Sistema

```text
[ Usuario / S3 Bucket ]
          │
          │ (s3:ObjectCreated)
          ▼
   [ SQS Queue ]
          │
          │ (Event Source Mapping)
          ▼
  [ AWS Lambda Node.js ] ──► [ CloudWatch Logs ]
                                    │
                                    │ (Log Metric Filter)
                                    ▼
                          [ CloudWatch Alarm ]
```

### Componentes

1. **Amazon S3 (`tickets-adjuntos-local`)**: Almacena los archivos adjuntos subidos al sistema de tickets.
2. **Amazon SQS (`cola-procesamiento-tickets`)**: Recibe notificaciones automáticas desde S3 al crearse nuevos objetos.
3. **AWS Lambda (`procesador_adjuntos_tickets`)**: Función en Node.js 18.x que consume eventos encolados en SQS para procesar adjuntos.
4. **Amazon CloudWatch**:
   - **Log Group**: Captura las ejecuciones y trazabilidad de la Lambda.
   - **Metric Filter**: Filtra patrones de error (`ERROR`) y los contabiliza en la métrica `ErroresProcesamientoAdjuntos`.
   - **Alarm**: Activa un estado `ALARM` si ocurren 2 o más errores en un intervalo de 1 minuto.

---

## 🛠️ Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas en tu entorno de desarrollo:

- Docker Desktop (para la ejecución de LocalStack).
- Terraform `>= 1.5.0`.
- AWS CLI v2.
- Node.js `>= 18.x` y npm.
- PowerShell o Bash.

---

## 🚀 Despliegue en Entorno Local

### 1. Iniciar LocalStack

Asegúrate de tener LocalStack corriendo en el puerto predeterminado `4566`.

```bash
docker run --rm -it \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  localstack/localstack
```

### 2. Inicializar y Aplicar la Infraestructura con Terraform

```powershell
# Inicializar proveedores y módulos
terraform init

# Validar la sintaxis del proyecto
terraform validate

# Planificar y aplicar los cambios
terraform apply --auto-approve
```

---

## 🧪 Pruebas e Inyección de Métricas

### 1. Crear el archivo `metric.json`

```json
[
  {
    "MetricName": "ErroresProcesamientoAdjuntos",
    "Value": 1,
    "Unit": "Count"
  }
]
```

### 2. Enviar métricas a LocalStack

```powershell
aws --endpoint-url=http://localhost:4566 cloudwatch put-metric-data `
  --namespace "TicketsApp/Lambda" `
  --metric-data file://metric.json `
  --region us-east-1
```

### 3. Verificar el estado de la alarma

```powershell
aws --endpoint-url=http://localhost:4566 cloudwatch describe-alarms `
  --alarm-names "Alarma-Errores-Lambda-Procesar-Adjuntos" `
  --region us-east-1
```

---

## 🔄 Estrategia de CI/CD (GitHub Actions)

El proyecto incluye un pipeline automatizado para validación de código, pruebas y despliegue continuo.

```yaml
name: CI/CD Infrastructure & Lambda Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate-and-test:
    name: Code Quality & Lambda Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install Lambda Dependencies
        run: |
          cd lambda
          npm ci || npm install

      - name: Run Unit Tests
        run: |
          cd lambda
          npm test --if-present

  terraform-ci:
    name: Terraform Lint & Validate
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Init
        run: terraform init -backend-config="noop"

      - name: Terraform Validate
        run: terraform validate
```

---

## 📁 Estructura del Repositorio

```text
.
├── lambda/
│   ├── index.js                  # Código principal de la Lambda
│   └── package.json              # Dependencias de Node.js
├── main.tf                       # Declaración principal de infraestructura en Terraform
├── metric.json                   # Payload de pruebas para CloudWatch
├── README.md                     # Documentación del proyecto
└── .gitignore
```