#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '../lib/authorization-service-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = new cdk.App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack');