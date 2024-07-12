import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];
  
  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authorization header is not provided' }),
    };
  }

  const token = authHeader.split(' ')[1];
  const [login, password] = Buffer.from(token, 'base64').toString('utf-8').split(':');

  const envCredentials = process.env.USER_CREDENTIALS?.split(',') || [];
  console.log('envCredentials',  process.env.USER_CREDENTIALS);
  console.log('envCredentials', envCredentials);

  const validCredentials = envCredentials.some(cred => {
    const [envLogin, envPassword] = cred.split('=');
    return envLogin === login && envPassword === password;
  });

  console.log('validCredentials', validCredentials);

  if (validCredentials) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Authorization successful' }),
    };
  } else {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Access denied' }),
    };
  }
};
