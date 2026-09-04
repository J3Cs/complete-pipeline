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

# Configuración del proveedor apuntando a LocalStack
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3         = "http://127.0.0.1:4566"
    sqs        = "http://127.0.0.1:4566"
    lambda     = "http://127.0.0.1:4566"
    cloudwatch = "http://127.0.0.1:4566"
    logs       = "http://127.0.0.1:4566"
    iam        = "http://127.0.0.1:4566"
  }
}

# 1. Bucket S3 para adjuntos de tickets
resource "aws_s3_bucket" "bucket_adjuntos" {
  bucket        = "tickets-adjuntos-local"
  force_destroy = true
}

# 2. Cola SQS para encolar eventos de subida
resource "aws_sqs_queue" "cola_procesamiento" {
  name                       = "cola-procesamiento-tickets"
  visibility_timeout_seconds = 30
}

# Política de SQS para permitir notificaciones desde S3
resource "aws_sqs_queue_policy" "sqs_policy" {
  queue_url = aws_sqs_queue.cola_procesamiento.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
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

# 3. Notificación de S3 a SQS
resource "aws_s3_bucket_notification" "notificacion_s3" {
  bucket = aws_s3_bucket.bucket_adjuntos.id

  queue {
    queue_arn     = aws_sqs_queue.cola_procesamiento.arn
    events        = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sqs_queue_policy.sqs_policy]
}

# 4. Empaquetar código Lambda en archivo ZIP
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

# Rol IAM para la Lambda
resource "aws_iam_role" "role_lambda" {
  name = "role_procesador_tickets_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

# 5. Función Lambda
resource "aws_lambda_function" "procesador_adjuntos" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "procesador_adjuntos_tickets"
  role             = aws_iam_role.role_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
}

# 6. Event Source Mapping: SQS desencadena a la Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.cola_procesamiento.arn
  function_name    = aws_lambda_function.procesador_adjuntos.arn
  batch_size       = 1
}

# 7. CloudWatch Log Group para monitoreo
resource "aws_cloudwatch_log_group" "log_lambda" {
  name              = "/aws/lambda/procesador_adjuntos_tickets"
  retention_in_days = 7
}

# 1. Filtro de Métricas para errores en los Logs de la Lambda
resource "aws_cloudwatch_log_metric_filter" "lambda_error_filter" {
  name           = "lambda-errores-adjuntos-filter"
  pattern        = "ERROR"
  log_group_name = "/aws/lambda/${aws_lambda_function.procesador_adjuntos.function_name}"

  metric_transformation {
    name      = "ErroresProcesamientoAdjuntos"
    namespace = "TicketsApp/Lambda"
    value     = "1"
  }
}

# 2. Alarma de CloudWatch activada si ocurren > 2 errores en 1 minuto
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "Alarma-Errores-Lambda-Procesar-Adjuntos"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ErroresProcesamientoAdjuntos"
  namespace           = "TicketsApp/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "Esta alarma se dispara cuando la Lambda de adjuntos registra 2 o más errores en un minuto."
  
  alarm_actions       = [] # Aquí se conectaría un ARN de SNS para enviar correos o SMS
}