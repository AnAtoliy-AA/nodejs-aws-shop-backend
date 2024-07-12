import { APIGatewayProxyHandler } from "aws-lambda";
import * as dotenv from 'dotenv';
import * as path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
  const validCredentials = envCredentials.some(cred => {
    const [envLogin, envPassword] = cred.split('=');
    return envLogin === login && envPassword === password;
  });

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
