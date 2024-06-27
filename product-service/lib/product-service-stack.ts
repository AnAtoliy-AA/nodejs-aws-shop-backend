import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

export const PRODUCTS_TABLE_NAME = "products";
export const STOCKS_TABLE_NAME = "stocks";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "Products", {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    const stocksTable = new dynamodb.Table(this, "StocksTable", {
      tableName: STOCKS_TABLE_NAME,
      partitionKey: {
        name: "products_id",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const dynamoPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
      ],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    const getProductsList = new lambda.Function(
      this,
      "getProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsList.handler",
        functionName: "getProductsList",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName
        },
      }
    );

    getProductsList.addToRolePolicy(dynamoPolicy);

    const getProductsById = new lambda.Function(
      this,
      "getProductsByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsById.handler",
        functionName: "getProductsById",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName
        },
      }
    );

    const createProduct = new lambda.Function(
      this,
      "createProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "createProduct.handler",
        functionName: "createProduct",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName
        },
      }
    );

    getProductsById.addToRolePolicy(dynamoPolicy);

    const api = new apigateway.RestApi(this, "productServiceApi", {
      restApiName: "Product Service",
      description: "This service serves products.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsList
    );

    const products = api.root.addResource("products");
    products.addMethod("GET", getProductsListIntegration);

    const getProductsByIdIntegration = new apigateway.LambdaIntegration(
      getProductsById
    );

    const product = products.addResource("{productId}");
    product.addMethod("GET", getProductsByIdIntegration);

    const fillTables = new lambda.Function(this, "fillDynamoDBHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda-functions"),
      handler: "fillDynamoDB.handler",
      functionName: "fillDynamoDB",
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    const fillProductsListIntegration = new apigateway.LambdaIntegration(
      fillTables
    );

    const fillProducts = api.root.addResource("fill-products");
    fillProducts.addMethod("POST", fillProductsListIntegration);

    const createProductIntegration = new apigateway.LambdaIntegration(createProduct);

    products.addMethod('POST', createProductIntegration);
  }
}
