import { SQSEvent, SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { validateProduct } from "./createProduct";
import { v4 as uuidv4 } from "uuid";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME || "";

const processRecord = ({
  title,
  description,
  price,
  count,
}: {
  title: string;
  description: string;
  price: number;
  count: number;
}) => {
  return new Promise<void>(async (resolve, reject) => {
    const validationMessage = validateProduct({ title, price, count });

    if (validationMessage) {
      console.log("validationMessage:", validationMessage);
      return;
    }

    const productId = uuidv4();

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: PRODUCTS_TABLE_NAME,
      Item: {
        id: productId,
        title,
        description: description || "",
        price: +price,
      },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: STOCKS_TABLE_NAME,
      Item: {
        products_id: productId,
        count: +count || 0,
      },
    };

    try {
      const [productsResult, stocksResult] = await Promise.all([
        dynamoDb.put(productParams).promise(),
        dynamoDb.put(stockParams).promise(),
      ]);

      console.log("productsResult:", productsResult);
      console.log("stocksResult:", stocksResult);
    } catch (error: unknown) {
      console.error("Error creating product:", error);
    }
  });
};

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  console.log("event:", event);

  const promises = event.Records.map(async (record) => {
    console.log("item:", record.body);

    const { title, description, price, count } = JSON.parse(
      record.body || "{}"
    );

    return processRecord({ title, description, price, count });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Error processing one or more products:", error);
  }
};
