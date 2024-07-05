import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import AWSMock from 'aws-sdk-mock';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { handler as getProductsListHandler } from '../lambda-functions/getProductsList';
import { products } from '../lambda-functions/products';

// Mock the products data to simulate the actual data returned from DynamoDB or another AWS service
AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params: DocumentClient.ScanInput, callback: Function) => {
  callback(null, { Items: products });
});

describe('getProductsList Handler', () => {
  afterAll(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

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
