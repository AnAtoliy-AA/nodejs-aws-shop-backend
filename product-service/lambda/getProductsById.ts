import { APIGatewayProxyHandler } from 'aws-lambda';
import { products } from '../data/products';

export const handler: APIGatewayProxyHandler = async (event) => {
  const productId = event.pathParameters?.productId;

  const product = products.find(p => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
};