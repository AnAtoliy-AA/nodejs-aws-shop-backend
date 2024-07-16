import { APIGatewayEventDefaultAuthorizerContext } from "aws-lambda";

export const handler = async (
  event: APIGatewayEventDefaultAuthorizerContext
) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const authHeader =
    event?.headers?.["Authorization"] ||
    event?.headers?.["authorization"] ||
    (event as APIGatewayEventDefaultAuthorizerContext)?.["authorizationToken"];

  console.log("Auth header:", authHeader);

  if (!authHeader) {
    generatePolicy(authHeader, "Deny", event?.methodArn);
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

  return generatePolicy(authHeader, effect, event?.methodArn);
};

const generatePolicy = (
  principalId: string,
  effect = "Deny",
  resource: string
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
  };
  return authResponse;
};
