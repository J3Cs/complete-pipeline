terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# ============================================================
# PROVIDER AWS - LOCALSTACK
# ============================================================

provider "aws" {
  region = "us-east-1"

  # LocalStack no requiere credenciales reales
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Necesario para trabajar correctamente con S3 en LocalStack
  s3_use_path_style = true

  endpoints {
    s3         = "http://127.0.0.1:4566"
    sqs        = "http://127.0.0.1:4566"
    lambda     = "http://127.0.0.1:4566"
    iam        = "http://127.0.0.1:4566"
    cloudwatch = "http://127.0.0.1:4566"
    logs       = "http://127.0.0.1:4566"
  }
}


# ============================================================
# S3 - BUCKET DE ADJUNTOS
# ============================================================

resource "aws_s3_bucket" "bucket_adjuntos" {
  bucket        = "tickets-adjuntos-local"
  force_destroy = true
}


# ============================================================
# SQS - COLA DE PROCESAMIENTO
# ============================================================

resource "aws_sqs_queue" "cola_procesamiento" {
  name                       = "cola-procesamiento-tickets"
  visibility_timeout_seconds = 30
}


# ============================================================
# SQS - POLÍTICA PARA S3
# Permite que S3 envíe mensajes a la cola.
# ============================================================

resource "aws_sqs_queue_policy" "sqs_policy" {
  queue_url = aws_sqs_queue.cola_procesamiento.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "s3.amazonaws.com"
        }

        Action = "sqs:SendMessage"

        Resource = aws_sqs_queue.cola_procesamiento.arn

        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.bucket_adjuntos.arn
          }
        }
      }
    ]
  })
}


# ============================================================
# S3 -> SQS
# Notificación cuando se crea un objeto en S3.
# ============================================================

resource "aws_s3_bucket_notification" "notificacion_s3" {
  bucket = aws_s3_bucket.bucket_adjuntos.id

  queue {
    queue_arn = aws_sqs_queue.cola_procesamiento.arn

    events = [
      "s3:ObjectCreated:*"
    ]
  }

  depends_on = [
    aws_sqs_queue_policy.sqs_policy
  ]
}


# ============================================================
# ARCHIVO ZIP DE LAMBDA
# ============================================================

data "archive_file" "lambda_zip" {
  type = "zip"

  source_dir = "${path.module}/lambda"

  output_path = "${path.module}/lambda.zip"
}


# ============================================================
# IAM ROLE PARA LAMBDA
# ============================================================

resource "aws_iam_role" "role_lambda" {
  name = "role_procesador_tickets_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = "sts:AssumeRole"

        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}


# ============================================================
# IAM POLICY PARA LAMBDA
# Permisos básicos de CloudWatch Logs.
# ============================================================

resource "aws_iam_role_policy" "lambda_logs" {
  name = "lambda-cloudwatch-logs"

  role = aws_iam_role.role_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]

        Resource = "*"
      }
    ]
  })
}


# ============================================================
# LAMBDA
# ============================================================

resource "aws_lambda_function" "procesador_adjuntos" {
  filename = data.archive_file.lambda_zip.output_path

  function_name = "procesador_adjuntos_tickets"

  role = aws_iam_role.role_lambda.arn

  handler = "index.handler"

  runtime = "nodejs20.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [
    aws_iam_role_policy.lambda_logs
  ]
}


# ============================================================
# LAMBDA <- SQS
# Event Source Mapping
# ============================================================

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.cola_procesamiento.arn

  function_name = aws_lambda_function.procesador_adjuntos.arn

  batch_size = 1

  enabled = true

  depends_on = [
    aws_lambda_function.procesador_adjuntos,
    aws_sqs_queue.cola_procesamiento
  ]
}


# ============================================================
# CLOUDWATCH LOG GROUP
# ============================================================

resource "aws_cloudwatch_log_group" "log_lambda" {
  name = "/aws/lambda/procesador_adjuntos_tickets"

  retention_in_days = 7

  depends_on = [
    aws_lambda_function.procesador_adjuntos
  ]
}


# ============================================================
# CLOUDWATCH LOG METRIC FILTER
# Detecta errores en los logs de Lambda.
# ============================================================

resource "aws_cloudwatch_log_metric_filter" "lambda_error_filter" {
  name = "lambda-errores-adjuntos-filter"

  pattern = "ERROR"

  log_group_name = aws_cloudwatch_log_group.log_lambda.name

  metric_transformation {
    name = "ErroresProcesamientoAdjuntos"

    namespace = "TicketsApp/Lambda"

    value = "1"
  }

  depends_on = [
    aws_cloudwatch_log_group.log_lambda
  ]
}


# ============================================================
# CLOUDWATCH METRIC ALARM
# Se activa cuando existen 2 o más errores.
# ============================================================

resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name = "Alarma-Errores-Lambda-Procesar-Adjuntos"

  comparison_operator = "GreaterThanOrEqualToThreshold"

  evaluation_periods = 1

  metric_name = "ErroresProcesamientoAdjuntos"

  namespace = "TicketsApp/Lambda"

  period = 60

  statistic = "Sum"

  threshold = 2

  alarm_description = "Esta alarma se dispara cuando la Lambda de adjuntos registra 2 o más errores en un minuto."

  # Posteriormente puedes conectar SNS aquí.
  alarm_actions = []

  depends_on = [
    aws_cloudwatch_log_metric_filter.lambda_error_filter
  ]
}


# ============================================================
# OUTPUTS
# ============================================================

output "s3_bucket_name" {
  description = "Nombre del bucket S3 de adjuntos"

  value = aws_s3_bucket.bucket_adjuntos.bucket
}


output "sqs_queue_url" {
  description = "URL de la cola SQS"

  value = aws_sqs_queue.cola_procesamiento.id
}


output "lambda_function_name" {
  description = "Nombre de la función Lambda"

  value = aws_lambda_function.procesador_adjuntos.function_name
}


output "lambda_function_arn" {
  description = "ARN de la función Lambda"

  value = aws_lambda_function.procesador_adjuntos.arn
}


output "cloudwatch_log_group" {
  description = "Log Group de Lambda"

  value = aws_cloudwatch_log_group.log_lambda.name
}