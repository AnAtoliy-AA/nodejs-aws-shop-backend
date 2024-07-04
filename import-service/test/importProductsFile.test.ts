import { handler as importProductsFile } from "../lambda-functions/importProductsFile";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

describe("importProductsFile", () => {
  beforeAll(() => {
    process.env.BUCKET_NAME = "test-bucket";
  });


  it("should return a signed URL when name query parameter is provided", async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: { name: "test-file.csv" },
    } as any;

    const context: Context = {} as any;

    const result = (await importProductsFile(
      event,
      context,
      () => null
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('https://test-bucket.s3.amazonaws.com/uploaded/test-file.csv?AWSAccessKeyId=');
  });

  it("should return 400 when name query parameter is missing", async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: {},
    } as any;

    const context: Context = {} as any;

    const result = (await importProductsFile(
      event,
      context,
      () => null
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      message: "Missing file name parameter",
    });
  });
});
