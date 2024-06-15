import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler as getProductsByIdHandler } from '../lambda-functions/getProductsById';

describe('getProductsById Handler', () => {
  it('should return a product by ID', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        productId: '1',
      },
    };
    const context: Partial<Context> = {};

    const result = await getProductsByIdHandler(event as APIGatewayProxyEvent, context as Context, () => null) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(result.body)).toEqual({ id: '1', title: 'ProductOne', price: 24, description: "Short Product Description1", });
  });

  it('should return 404 if product is not found', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        productId: '999',
      },
    };
    const context: Partial<Context> = {};

    const result = await getProductsByIdHandler(event as APIGatewayProxyEvent, context as Context, () => null) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(result.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });

  it('should return 404 if productId is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {};
    const context: Partial<Context> = {};

    const result = await getProductsByIdHandler(event as APIGatewayProxyEvent, context as Context, () => null) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(result.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });
});