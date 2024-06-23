import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct } from "./product.interface";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";

export const handler: APIGatewayProxyHandler = async (event) => {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "productId and title are required" }),
    };
  }

  const params: DocumentClient.GetItemInput = {
    TableName: PRODUCTS_TABLE_NAME,
    Key: {
      id: productId,
    },
  };

  try {
    
    console.log(`Scanning table: ${PRODUCTS_TABLE_NAME}`);

    const result = await dynamoDb.get(params).promise();

    console.log("Scan result:", result);
    
    const product = result.Item as IProduct | undefined;

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Product not found" }),
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
      body: JSON.stringify(product),
    };
  } catch (error: unknown) {
    console.error("Error getting product:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error retrieving product",
        error: (error as { message: string })?.message,
      }),
    };
  }
};
