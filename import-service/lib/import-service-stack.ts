import * as cdk from "aws-cdk-lib";
import {
  aws_cloudfront as cloudfront,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_iam as iam,
} from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: 'unique-import-service-bucket-name',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const uploadedFolderDeployment = new s3deploy.BucketDeployment(this, 'DeployUploadedFolder', {
      sources: [s3deploy.Source.asset(path.join(__dirname, 'empty-folder'))], // Path to an empty folder on local machine
      destinationBucket: importBucket,
      destinationKeyPrefix: 'uploaded', // The "uploaded" folder in the bucket
    });

    const importLambda = new lambda.Function(this, 'ImportFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda-functions'),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    const importProductsFileFunction = new lambda.Function(this, 'ImportProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions')),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    importBucket.grantReadWrite(importLambda);

    importBucket.grantReadWrite(importProductsFileFunction);



    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
      description: 'This service handles import operations.',
    });

    const getImportsIntegration = new apigateway.LambdaIntegration(importLambda);

    api.root.addMethod('GET', getImportsIntegration);

    const importIntegration = new apigateway.LambdaIntegration(importProductsFileFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    api.root
    .resourceForPath('/import')
    .addMethod('GET', importIntegration, {
      requestParameters: {
        'method.request.querystring.name': true,
      },
    });

  new cdk.CfnOutput(this, 'API URL', {
    value: api.url ?? 'Something went wrong with the deploy',
  });
  }
}
