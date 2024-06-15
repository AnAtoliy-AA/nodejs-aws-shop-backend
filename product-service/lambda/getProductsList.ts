import { APIGatewayProxyHandler } from "aws-lambda";
import { products } from "../data/products";

export const handler: APIGatewayProxyHandler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(products),
  };
};
