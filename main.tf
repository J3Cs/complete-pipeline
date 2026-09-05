terraform {
  required_version = ">= 1.5.0"

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
# PROVIDER AWS - DINÁMICO (LOCALSTACK vs AWS REAL)
# ============================================================

provider "aws" {
  region = var.aws_region

  # Credenciales de prueba si estamos en LocalStack
  access_key = var.use_localstack ? "test" : null
  secret_key = var.use_localstack ? "test" : null

  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_requesting_account_id  = var.use_localstack

  s3_use_path_style = var.use_localstack

  # Los endpoints solo se sobreescriben en entorno LocalStack
  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      s3         = var.localstack_endpoint
      sqs        = var.localstack_endpoint
      lambda     = var.localstack_endpoint
      iam        = var.localstack_endpoint
      cloudwatch = var.localstack_endpoint
      logs       = var.localstack_endpoint
    }
  }
}


# ============================================================
# S3 - BUCKET DE ADJUNTOS
# ============================================================

resource "aws_s3_bucket" "bucket_adjuntos" {
  bucket        = "${var.bucket_prefix}-${var.environment}"
  force_destroy = var.use_localstack ? true : false
}


# ============================================================
# SQS - COLA DE PROCESAMIENTO
# ============================================================

resource "aws_sqs_queue" "cola_procesamiento" {
  name                       = "cola-procesamiento-tickets-${var.environment}"
  visibility_timeout_seconds = 30
}


# ============================================================
# SQS - POLÍTICA PARA S3
# ============================================================

resource "aws_sqs_queue_policy" "sqs_policy" {
  queue_url = aws_sqs_queue.cola_procesamiento.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.cola_procesamiento.arn
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
# S3 -> SQS NOTIFICACIÓN
# ============================================================

resource "aws_s3_bucket_notification" "notificacion_s3" {
  bucket = aws_s3_bucket.bucket_adjuntos.id

  queue {
    queue_arn = aws_sqs_queue.cola_procesamiento.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [
    aws_sqs_queue_policy.sqs_policy
  ]
}


# ============================================================
# ARCHIVO ZIP DE LAMBDA
# ============================================================

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}


# ============================================================
# IAM ROLE Y POLICIES PARA LAMBDA
# ============================================================

resource "aws_iam_role" "role_lambda" {
  name = "role_procesador_tickets_lambda_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Action    = "sts:AssumeRole"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name = "lambda-cloudwatch-logs-${var.environment}"
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
# LAMBDA FUNCTION
# ============================================================

resource "aws_lambda_function" "procesador_adjuntos" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "procesador_adjuntos_tickets_${var.environment}"
  role             = aws_iam_role.role_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [
    aws_iam_role_policy.lambda_logs
  ]
}


# ============================================================
# LAMBDA <- SQS TRIGGER
# ============================================================

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.cola_procesamiento.arn
  function_name    = aws_lambda_function.procesador_adjuntos.arn
  batch_size       = 1
  enabled          = true

  depends_on = [
    aws_lambda_function.procesador_adjuntos,
    aws_sqs_queue.cola_procesamiento
  ]
}


# ============================================================
# CLOUDWATCH LOG GROUP & METRICS
# ============================================================

resource "aws_cloudwatch_log_group" "log_lambda" {
  name              = "/aws/lambda/procesador_adjuntos_tickets_${var.environment}"
  retention_in_days = var.use_localstack ? 7 : 30

  depends_on = [
    aws_lambda_function.procesador_adjuntos
  ]
}

resource "aws_cloudwatch_log_metric_filter" "lambda_error_filter" {
  name           = "lambda-errores-adjuntos-filter-${var.environment}"
  pattern        = "ERROR"
  log_group_name = aws_cloudwatch_log_group.log_lambda.name

  metric_transformation {
    name      = "ErroresProcesamientoAdjuntos"
    namespace = "TicketsApp/Lambda"
    value     = "1"
  }

  depends_on = [
    aws_cloudwatch_log_group.log_lambda
  ]
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "Alarma-Errores-Lambda-Procesar-Adjuntos-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ErroresProcesamientoAdjuntos"
  namespace           = "TicketsApp/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "Se dispara si la Lambda registra 2 o más errores en un minuto."

  depends_on = [
    aws_cloudwatch_log_metric_filter.lambda_error_filter
  ]
}
