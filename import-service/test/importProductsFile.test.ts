import { handler as importProductsFile } from "../lambda-functions/importProductsFile";
import * as AWS from "aws-sdk-mock";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import * as AWS_SDK from 'aws-sdk';

const AWSMock = AWS as any;

describe("importProductsFile", () => {
  beforeAll(() => {
    process.env.BUCKET_NAME = "test-bucket";
  });

  beforeEach(() => {
    AWSMock.setSDKInstance(AWS_SDK);
    AWSMock.mock(
      "S3",
      "getSignedUrl",
      (
        operation: unknown,
        params: unknown,
        callback: (arg0: null, arg1: string) => void
      ) => {
        callback(null, "https://signed-url.com");
      }
    );
  });

  afterEach(() => {
    AWSMock.restore("S3");
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

  // it("should return 500 on internal error", async () => {
  //   AWSMock.remock(
  //     "S3",
  //     "getSignedUrl",
  //     (
  //       operation: unknown,
  //       params: unknown,
  //       callback: (arg0: null | Error, arg1: string | null) => void
  //     ) => {
  //       callback(new Error("Internal Error"), null);
  //     }
  //   );

  //   const event: APIGatewayProxyEvent = {
  //     queryStringParameters: { name: "test-file.csv" },
  //   } as any;

  //   const context: Context = {} as any;

  //   const result = (await importProductsFile(
  //     event,
  //     context,
  //     () => null
  //   )) as APIGatewayProxyResult;

  //   expect(result.statusCode).toBe(500);
  //   expect(JSON.parse(result.body)).toEqual({
  //     message: "Error generating signed URL",
  //   });
  // });
});
