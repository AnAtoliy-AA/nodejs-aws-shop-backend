import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const productId = event.pathParameters?.productId;
  
  const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
  const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME || "";

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

  try {
    const productParams: DocumentClient.GetItemInput = {
      TableName: PRODUCTS_TABLE_NAME,
      Key: {
        id: productId,
      },
    };
  
    const stockParams: DocumentClient.GetItemInput = {
      TableName: STOCKS_TABLE_NAME,
      Key: {
        products_id: productId,
      },
    };
    
    console.log(`Scanning tables: ${PRODUCTS_TABLE_NAME}, ${STOCKS_TABLE_NAME}`);

    const [productResult, stockResult] = await Promise.all([
      dynamoDb.get(productParams).promise(),
      dynamoDb.get(stockParams).promise()
    ]);
    
    console.log("Scan results:", productResult, stockResult);

    if (!productResult || !stockResult) {
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

    const finalProduct = {
      ...productResult?.Item,
      count: stockResult?.Item?.count
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalProduct),
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
