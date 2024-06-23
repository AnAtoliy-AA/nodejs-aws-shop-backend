import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct } from "./product.interface";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";

export const handler: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {
  console.log("Starting getProductsList handler...");
  try {
    const params = { TableName: PRODUCTS_TABLE_NAME };

    console.log(`Scanning table: ${PRODUCTS_TABLE_NAME}`);

    const result = await dynamoDb.scan(params).promise();

    console.log("Scan result:", result);
    
    const products: Array<IProduct> = result.Items as Array<IProduct>;

    if (!products?.length) {
      console.log("No products found");
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "NO Products found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(products),
    };
  } catch (error: unknown) {
    console.error("Error scanning table:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error populating data",
        error: (error as { message: string })?.message,
      }),
    };
  }
};