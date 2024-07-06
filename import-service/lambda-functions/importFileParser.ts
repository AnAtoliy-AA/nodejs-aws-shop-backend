import * as AWS from "aws-sdk";
import * as csv from "csv-parser";
import { S3Event, S3Handler } from "aws-lambda";

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const tryToMoveFile = async ({
  bucket,
  key,
  resolve,
  reject,
}: {
  bucket: string;
  key: string;
  resolve: VoidFunction;
  reject: (reason?: unknown) => void;
}) => {
  try {
    const copyParams = {
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: key.replace("uploaded", "parsed"),
    };

    console.log("Copying file:", JSON.stringify(copyParams, null, 2));

    await s3.copyObject(copyParams).promise();

    console.log("File copied successfully");

    const deleteParams = {
      Bucket: bucket,
      Key: key,
    };

    console.log(
      "Deleting original file:",
      JSON.stringify(deleteParams, null, 2)
    );

    await s3.deleteObject(deleteParams).promise();

    console.log("Original file deleted successfully");

    resolve();
  } catch (error) {
    console.error("Error moving file:", error);
    reject(error);
  }
};

const processRecord = (bucket: string, key: string, queueName: string) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    console.log("params:", JSON.stringify(params, null, 2));

    const s3Stream = s3.getObject(params).createReadStream();

    s3Stream
      .pipe(csv())
      .on("data", async (data) => {
        console.log("Record:", JSON.stringify(data));

        const sqsParams = {
          QueueUrl: queueName,
          MessageBody: JSON.stringify(data),
        };

        try {
          await sqs.sendMessage(sqsParams).promise();

          console.log(`Record sent to SQS: ${JSON.stringify(data)}`);
        } catch (error) {
          console.error("Error sending record to SQS:", error);
        }
      })
      .on("end", () => {
        console.log("CSV file successfully processed");

        tryToMoveFile({ bucket, key, resolve, reject });
      })
      .on("error", (error) => {
        console.error("Error processing CSV file:", error);
        reject(error);
      });
  });
};

export const handler: S3Handler = async (event: S3Event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const queueName = process.env.SQS_QUEUE_URL!;

  console.log("queue name: ", queueName);

  const promises = event.Records.map((record) => {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    return processRecord(bucket, key, queueName);
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Error processing one or more CSV files:", error);
  }
};
