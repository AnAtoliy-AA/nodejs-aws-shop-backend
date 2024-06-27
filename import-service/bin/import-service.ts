import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ImportServiceStack } from '../lib/import-service-stack';

const app = new cdk.App();
new ImportServiceStack(app, 'ImportServiceStack');