import { SQSEvent, SQSRecord } from "aws-lambda";
import * as AWS from "aws-sdk";
import AWSMock from "aws-sdk-mock";
import { handler } from "../lambda-functions/catalogBatchProcess";
import { validateProduct } from "../lambda-functions/createProduct";
import { v4 as uuidv4 } from "uuid";

jest.mock("../lambda-functions/createProduct");
jest.mock("uuid");

const PRODUCTS_TABLE_NAME = "ProductsTable";
const STOCKS_TABLE_NAME = "StocksTable";


const DEFAULT_CONTEXT = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "",
    functionVersion: "",
    invokedFunctionArn: "",
    memoryLimitInMB: "",
    awsRequestId: "",
    logGroupName: "",
    logStreamName: "",
    getRemainingTimeInMillis: function (): number {
        throw new Error("Function not implemented.");
    },
    done: function (error?: Error, result?: any): void {
        throw new Error("Function not implemented.");
    },
    fail: function (error: Error | string): void {
        throw new Error("Function not implemented.");
    },
    succeed: function (messageOrObject: any): void {
        throw new Error("Function not implemented.");
    }
}

describe("handler", () => {
  beforeAll(() => {
    process.env.PRODUCTS_TABLE_NAME = PRODUCTS_TABLE_NAME;
    process.env.STOCKS_TABLE_NAME = STOCKS_TABLE_NAME;

    AWSMock?.setSDKInstance(AWS);

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, "success");
    });
  });

  afterAll(() => {
    AWSMock.restore();
  });

  it("should process SQS records and store products and stocks in DynamoDB", async () => {
    const mockProductId = "test-product-id";
    (uuidv4 as jest.Mock).mockReturnValue(mockProductId);
    (validateProduct as jest.Mock).mockReturnValue(null);

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            description: "This is a test product",
            price: 100,
            count: 10,
          }),
        } as SQSRecord,
      ],
    };

    console.log = jest.fn();
    console.error = jest.fn();

    await handler(event, DEFAULT_CONTEXT, () => {});

    expect(validateProduct).toHaveBeenCalledWith({
      title: "Test Product",
      price: 100,
      count: 10,
    });

    expect(console.log).toHaveBeenCalledWith("productsResult:", "success");
    expect(console.log).toHaveBeenCalledWith("stocksResult:", "success");
  });

  it("should log validation messages and not process invalid products", async () => {
    (validateProduct as jest.Mock).mockReturnValue("Invalid product data");

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Invalid Product",
            description: "This is an invalid product",
            price: -1,
            count: -1,
          }),
        } as SQSRecord,
      ],
    };

    console.log = jest.fn();
    console.error = jest.fn();

    await handler(event, DEFAULT_CONTEXT, () => {});

    expect(validateProduct).toHaveBeenCalledWith({
      title: "Invalid Product",
      price: -1,
      count: -1,
    });

    expect(console.log).toHaveBeenCalledWith(
      "validationMessage:",
      "Invalid product data"
    );

    expect(console.log).not.toHaveBeenCalledWith("productsResult:", "success");
    expect(console.log).not.toHaveBeenCalledWith("stocksResult:", "success");
  });

  it("should handle errors during product and stock creation", async () => {
    (uuidv4 as jest.Mock).mockReturnValue("test-product-id");
    (validateProduct as jest.Mock).mockReturnValue(null);

    AWSMock.remock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(new Error("DynamoDB error"));
    });

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            description: "This is a test product",
            price: 100,
            count: 10,
          }),
        } as SQSRecord,
      ],
    };

    console.log = jest.fn();
    console.error = jest.fn();

    await handler(event, DEFAULT_CONTEXT, () => {});

    expect(console.error).toHaveBeenCalledWith(
      "Error creating product:",
      expect.any(Error)
    );
  });
});
