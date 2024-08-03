import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

exports.handler = async () => {
  const bucketName = process.env.BUCKET_NAME || "";
  const params = {
    Bucket: bucketName,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Contents),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
