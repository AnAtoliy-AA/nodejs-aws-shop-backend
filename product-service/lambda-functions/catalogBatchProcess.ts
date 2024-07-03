import { SQSEvent, SQSHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME;

export const handler: SQSHandler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    const params = {
      TableName: productsTableName!,
      Item: {
        productId: product.productId,
        name: product.name,
        price: product.price,
        // Add other product attributes here
      },
    };

    try {
      await dynamoDb.put(params).promise();
      console.log(`Product ${product.productId} inserted successfully.`);
    } catch (error) {
      console.error(`Error inserting product ${product.productId}:`, error);
    }
  }
};
