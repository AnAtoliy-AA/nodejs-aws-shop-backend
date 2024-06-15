import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new lambda.Function(
      this,
      "getProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsList.handler",
        functionName: "getProductsList",
      }
    );

    const getProductsById = new lambda.Function(
      this,
      "getProductsByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsById.handler",
        functionName: "getProductsById",
      }
    );

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
  }
}
