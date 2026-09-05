variable "environment" {
  description = "Entorno de despliegue (local, staging, prod)"
  type        = string
  default     = "local"
}

variable "aws_region" {
  description = "Región de AWS para los recursos"
  type        = string
  default     = "us-east-1"
}

variable "use_localstack" {
  description = "Determina si los recursos se desplegarán en LocalStack o en AWS real"
  type        = bool
  default     = true
}

variable "localstack_endpoint" {
  description = "URL del endpoint de LocalStack"
  type        = string
  default     = "http://127.0.0.1:4566"
}

variable "bucket_prefix" {
  description = "Prefijo para el nombre del bucket de adjuntos"
  type        = string
  default     = "tickets-adjuntos"
}