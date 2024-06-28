import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as getProductsListHandler } from '../lambda-functions/getProductsList';
import { products } from '../lambda-functions/products';

describe('getProductsList Handler', () => {
  it('should return a list of products', async () => {
    const event: Partial<APIGatewayProxyEvent> = {};
    const context: Partial<Context> = {};

    const result = await getProductsListHandler(event as APIGatewayProxyEvent, context as Context, () => null) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(result.body)).toEqual(products);
  });
});