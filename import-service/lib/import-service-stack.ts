import * as cdk from "aws-cdk-lib";
import {
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_iam as iam,
  aws_sqs as sqs,
} from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: "unique-import-service-bucket-name",
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [`${process?.env?.FE_CLOUD_FRONT}`],
        },
      ],
    });

    console.log("CloudFront:", process?.env?.FE_CLOUD_FRONT);

    const uploadedFolderDeployment = new s3deploy.BucketDeployment(
      this,
      "DeployUploadedFolder",
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, "empty-folder"))], // Path to an empty folder on local machine
        destinationBucket: importBucket,
        destinationKeyPrefix: "uploaded", // The "uploaded" folder in the bucket
      }
    );

    const catalogItemsQueueArn = cdk.Fn.importValue("CatalogItemsQueueArn");
    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      catalogItemsQueueArn
    );

    const importProductsFileFunction = new lambda.Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "importProductsFile.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda-functions")
        ),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    const importFileParser = new lambda.Function(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "importFileParser.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-functions")),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        SQS_QUEUE_URL: catalogItemsQueue?.queueUrl,
      },
    });

    importBucket.grantReadWrite(importProductsFileFunction);
    importBucket.grantReadWrite(importFileParser);

    catalogItemsQueue.grantSendMessages(importFileParser);

    const myBasicAuthorizerArn = cdk.Fn.importValue(
      "MyBasicAuthorizerFunctionArn"
    );

    console.log("myBasicAuthorizerArn", myBasicAuthorizerArn);

    const basicAuthorizer = lambda.Function.fromFunctionArn(
      this,
      "basicAuthorizerFromFunctionArn",
      myBasicAuthorizerArn
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "RequestAuthorizer",
      {
        handler: basicAuthorizer,
        identitySource: apigateway.IdentitySource.header("Authorization"),
      }
    );

    basicAuthorizer.addPermission("APIGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*/authorizers/*`,
    });

    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Import Service",
      description: "This service handles import operations.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const resp = {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    };

    api.addGatewayResponse("UnauthorizedResponse", resp);
    api.addGatewayResponse("ForbiddenResponse", resp);

    const importIntegration = new apigateway.LambdaIntegration(
      importProductsFileFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    api.root.resourceForPath("/import").addMethod("GET", importIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },

      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
          },
        },
        {
          statusCode: "401",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
          },
        },
        {
          statusCode: "403",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
          },
        },
      ],
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: authorizer,
    });

    new cdk.CfnOutput(this, "ImportApiEndpoint", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "API URL", {
      value: api.url ?? "Something went wrong with the deploy",
    });

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    importProductsFileFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [`${importBucket.bucketArn}/uploaded/*`],
      })
    );

    importFileParser.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${importBucket.bucketArn}/uploaded/*`],
      })
    );
  }
}
