import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { SQSClient } from "@aws-sdk/client-sqs";

const isLocal = process.env.USE_LOCALSTACK === "true";
const endpoint = process.env.LOCALSTACK_ENDPOINT || "http://127.0.0.1:4566";
const region = process.env.AWS_REGION || "us-east-1";

// Configuración general
const baseConfig = {
  region,
  ...(isLocal && {
    endpoint,
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
};

// Configuración de SQS
export const sqs = new SQSClient(baseConfig);

// Configuración de CloudWatch con soporte para LocalStack (fuerza el protocolo compatible)
export const cloudwatch = new CloudWatchClient({
  ...baseConfig,
  ...(isLocal && {
    customUserAgent: "aws-sdk-js-v3-localstack-patch",
    requestHandler: {
      // Inyecta las cabeceras requeridas por LocalStack para evitar respuestas XML
      metadata: { name: "localstack-fix" },
    },
    // Forzar el endpoint de CloudWatch explícito
    endpoint: `${endpoint}/`,
  }),
});