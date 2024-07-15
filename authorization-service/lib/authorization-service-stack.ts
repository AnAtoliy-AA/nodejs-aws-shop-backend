import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";

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

    const api = new apigateway.RestApi(this, "AuthApi", {
      restApiName: "Authorization Service",
      description: "This service handles user authorization.",
    });

    const postAuthIntegration = new apigateway.LambdaIntegration(authLambda);

    api.root.addMethod("POST", postAuthIntegration);
  }
}
