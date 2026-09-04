const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const endpoint = process.env.LOCALSTACK_HOSTNAME
  ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
  : "http://localhost:4566";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: endpoint,
  forcePathStyle: true,
});

exports.handler = async (event) => {
  console.log("=== INICIO PROCESAMIENTO ASÍNCRONO DE ADJUNTO ===");

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      if (!body.Records) continue;

      for (const s3Record of body.Records) {
        const bucketName = s3Record.s3.bucket.name;
        const rawKey = s3Record.s3.object.key.replace(/\+/g, " ");
        const objectKey = decodeURIComponent(rawKey);

        console.log(`[Lambda] Leyendo objeto '${objectKey}' desde el bucket '${bucketName}'...`);

        // Obtener metadata o contenido del archivo subido
        const s3Object = await s3.send(
          new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
        );

        const tamaño = s3Object.ContentLength;
        const tipoContenido = s3Object.ContentType;

        console.log(`[Lambda] Archivo '${objectKey}' verificado. Tamaño: ${tamaño} bytes, Tipo: ${tipoContenido}`);
        console.log(`[Lambda] Estado: Ticket adjunto validado y marcado como procesado.`);
      }
    } catch (err) {
      console.error("[Lambda ERROR]: Error procesando mensaje de SQS:", err);
      throw err;
    }
  }

  return { statusCode: 200, body: "Procesado correctamente" };
};