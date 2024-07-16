import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authLambda = new lambda.Function(this, "BasicAuthorizerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-functions")),
      handler: "basicAuthorizer.handler",
      environment: {
        USER_CREDENTIALS:
          process.env.USER_CREDENTIALS ||
          "your_github_account_login=TEST_PASSWORD",
      },
      functionName: "MyBasicAuthorizerFunction",
    });

    authLambda.addPermission("ApiGatewayInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*/authorizers/*`,
    });

    const api = new apigateway.RestApi(this, "AuthApi", {
      restApiName: "Authorization Service",
      description: "This service handles user authorization.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const postAuthIntegration = new apigateway.LambdaIntegration(authLambda);

    api.root.addMethod("POST", postAuthIntegration, {
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
    });

    const name = "MyBasicAuthorizerFunctionArn";
    new cdk.CfnOutput(this, name, {
      value: authLambda.functionArn,
      exportName: name,
    });
  }
}
