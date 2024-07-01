import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct } from "./product.interface";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME || "";

export const handler: APIGatewayProxyHandler =
  async (): Promise<APIGatewayProxyResult> => {
    console.log("Starting getProductsList handler...");

    try {
      const params = { TableName: PRODUCTS_TABLE_NAME };
      const productParams = {
        TableName: PRODUCTS_TABLE_NAME,
      };

      const stockParams = {
        TableName: STOCKS_TABLE_NAME,
      };

      console.log(
        `Scanning tables: ${PRODUCTS_TABLE_NAME}, ${STOCKS_TABLE_NAME}`
      );

      const [productResult, stockResult] = await Promise.all([
        dynamoDb.scan(productParams).promise(),
        dynamoDb.scan(stockParams).promise(),
      ]);

      console.log("Scan results:", productResult, stockResult);

      const products: Array<IProduct> = (
        productResult.Items as Array<IProduct>
      )?.map((product) => {
        const { id } = product;
        const count = stockResult?.Items?.find(
          (stock) => stock?.products_id === id
        )?.count;

        if (Number.isInteger(count)) {
          return {
            ...product,
            count,
          };
        }

        return product;
      });

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
