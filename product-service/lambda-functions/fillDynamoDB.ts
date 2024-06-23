import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { IProduct } from "./product.interface";
import { APIGatewayProxyResult } from "aws-lambda";
import {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
} from "../lib/product-service-stack";

AWS.config.update({ region: "eu-central-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "eu-central-1" });

const products: Array<IProduct> = Array(10)
  .fill(1)
  .map((_, ind) => {
    const productNumber = ind + 1;

    return {
      id: uuidv4(),
      title: `Product ${productNumber}`,
      description: `Description for Product ${productNumber}`,
      price: productNumber * 100,
    };
  });

const populateProducts = async () => {
  for (const product of products) {
    const params = {
      TableName: PRODUCTS_TABLE_NAME,
      Item: product,
    };
    await dynamoDb.put(params).promise();
    console.log(`Added ${product.title} to products table`);
  }
};

const populateStocks = async () => {
  for (const product of products) {
    const stockItem = {
      product_id: product.id,
      count: 50,
    };
    const params = {
      TableName: STOCKS_TABLE_NAME,
      Item: stockItem,
    };
    await dynamoDb.put(params).promise();
    console.log(`Added stock for ${product.title} to stocks table`);
  }
};

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    await populateProducts();
    await populateStocks();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Data population complete12345." }),
    };
  } catch (error: unknown) {
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
