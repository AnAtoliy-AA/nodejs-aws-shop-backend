import { APIGatewayEventDefaultAuthorizerContext } from "aws-lambda";

const NUMBER_OF_WORDS_IN_TOKEN = 2;

export const handler = async (
  event: APIGatewayEventDefaultAuthorizerContext
) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const authHeader =
    event?.headers?.["Authorization"] ||
    event?.headers?.["authorization"] ||
    (event as APIGatewayEventDefaultAuthorizerContext)?.["authorizationToken"];

  console.log("Auth header:", authHeader);

  if (!authHeader || !authHeader?.includes('Basic') || authHeader?.split(" ")?.length < NUMBER_OF_WORDS_IN_TOKEN) {
    generatePolicy(authHeader, "Deny", event?.methodArn, 401);
  }

  const token = authHeader.split(" ")[1];
  const [login, password] = Buffer.from(token, "base64")
    .toString("utf-8")
    .split(":");

  console.log("[login, password]", [login, password]);

  const envCredentials = process.env.USER_CREDENTIALS?.split(",") || [];
  console.log("envCredentials", process.env.USER_CREDENTIALS);
  console.log("envCredentials", envCredentials);

  const validCredentials = envCredentials.some((cred) => {
    const [envLogin, envPassword] = cred.split("=");
    return envLogin === login && envPassword === password;
  });

  console.log("validCredentials", validCredentials);

  const effect = validCredentials ? "Allow" : "Deny";

  return generatePolicy(authHeader, effect, event?.methodArn, 403);
};

const generatePolicy = (
  principalId: string,
  effect = "Deny",
  resource: string,
  statusCode: number,
) => {
  const authResponse = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      statusCode,
    },
  };
  return authResponse;
};
