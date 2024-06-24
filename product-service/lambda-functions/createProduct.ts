import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME || "";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { title, description, price, count } = JSON.parse(event.body || "{}");

  if (!title || !price) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  const productId = uuidv4();

  const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: PRODUCTS_TABLE_NAME,
    Item: {
      id: productId,
      title,
      description: description || '',
      price,
    },
  };

  const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: STOCKS_TABLE_NAME,
    Item: {
      products_id: productId,
      count: count || 0,
    },
  };

  try {
    await dynamoDb.put(productParams).promise();
    await dynamoDb.put(stockParams).promise();

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Product created successfully" }),
    };
  } catch (error: unknown) {
    console.error("Error creating product:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to create product",
        error: (error as { message: string })?.message,
      }),
    };
  }
};
