import { GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { GetQueueAttributesCommand, GetQueueUrlCommand } from "@aws-sdk/client-sqs";
import { cloudwatch, sqs } from "../config/aws.js";

const isLocal = process.env.USE_LOCALSTACK === "true";

/**
 * Genera datos simulación para CloudWatch cuando se ejecuta en LocalStack
 */
const getMockCloudWatchMetrics = () => {
  const points = [];
  const now = new Date();
  
  // Generar 12 puntos de datos (bloques de 5 min en la última hora)
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    points.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      errores: 0, // En local sin errores simulados por defecto
    });
  }
  return points;
};

export const getDashboardMetrics = async (req, res) => {
  let sqsMetrics = { enCola: 0, enProceso: 0 };
  let errorMetrics = [];

  // 1. Métricas de SQS (Funciona 100% en LocalStack Community)
  try {
    const queueName = process.env.SQS_QUEUE_NAME || "cola-procesamiento-tickets-local";
    const urlRes = await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }));

    const sqsRes = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: urlRes.QueueUrl,
        AttributeNames: ["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible"],
      })
    );

    sqsMetrics = {
      enCola: parseInt(sqsRes.Attributes?.ApproximateNumberOfMessages || "0", 10),
      enProceso: parseInt(sqsRes.Attributes?.ApproximateNumberOfMessagesNotVisible || "0", 10),
    };
  } catch (sqsErr) {
    console.warn("Advertencia al consultar SQS:", sqsErr.message);
  }

  // 2. Métricas de CloudWatch (Consulta real en AWS vs Mock en LocalStack)
  if (isLocal) {
    // En LocalStack usamos el Mock estructurado
    errorMetrics = getMockCloudWatchMetrics();
  } else {
    // En AWS Real ejecutamos el comando CloudWatch v3
    try {
      const cwRes = await cloudwatch.send(
        new GetMetricDataCommand({
          StartTime: new Date(Date.now() - 60 * 60 * 1000),
          EndTime: new Date(),
          MetricDataQueries: [
            {
              Id: "m_errors",
              MetricStat: {
                Metric: {
                  Namespace: "TicketsApp/Lambda",
                  MetricName: "ErroresProcesamientoAdjuntos",
                },
                Period: 300,
                Stat: "Sum",
              },
            },
          ],
        })
      );

      errorMetrics = (cwRes.MetricDataResults[0]?.Timestamps || []).map((t, i) => ({
        time: new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        errores: cwRes.MetricDataResults[0]?.Values[i] || 0,
      }));
    } catch (cwErr) {
      console.warn("Error en CloudWatch Prod:", cwErr.message);
      errorMetrics = getMockCloudWatchMetrics();
    }
  }

  return res.json({
    sqs: sqsMetrics,
    errors: errorMetrics,
  });
};