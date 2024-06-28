import * as AWS from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";

const s3 = new AWS.S3();

export const handler: APIGatewayProxyHandler = async (event) => {
    const bucketName = process.env.BUCKET_NAME;
    const fileName = event.queryStringParameters?.name;
    console.log('file name: ', fileName);
    console.log('bucket name: ', bucketName);
  
    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing file name parameter' }),
      };
    }
  
    const params = {
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
      Expires: 60 * 5, // URL expires in 5 minutes
    };
  
    try {
      const signedUrl = s3.getSignedUrl('putObject', params);
      return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
          },
        body: signedUrl,
      };
    } catch (error: unknown) {
        console.error("Error creating product:", error);
    
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Failed to import products file",
            error: (error as { message: string })?.message,
          }),
        };
      }
  };