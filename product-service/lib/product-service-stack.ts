import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new lambda.Function(this, 'getProductsListHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsList.handler',
      functionName: 'getProductsList'
    });

    const api = new apigateway.RestApi(this, 'productServiceApi', {
      restApiName: 'Product Service',
      description: 'This service serves products.'
    });

    const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsList);

    const products = api.root.addResource('products');
    products.addMethod('GET', getProductsListIntegration);
  }
}
