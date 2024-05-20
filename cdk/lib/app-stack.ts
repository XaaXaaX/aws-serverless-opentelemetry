import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join, resolve } from 'path';
import { LambdaConfiguration } from '../helper/lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { region } = cdk.Stack.of(this);
    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');

    const extensionArn = StringParameter.fromStringParameterName(
      this, 'extensionId', `/dev/extension/telemetry/kinesis/extension/arn`).stringValue;
  
    const managedPolicyName = StringParameter.fromStringParameterName(
      this, 'policyName', `/dev/extension/telemetry/kinesis/runtime/policy/arn`).stringValue;
  
    const triggerFunctionRole = new Role(this, 'TriggerFunctionRole', { 
      assumedBy: lambdaServiceRole,
      managedPolicies: [ 
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromManagedPolicyArn(this, 'managed-policy', managedPolicyName)
      ]
     });

    const triggerFunction =  new NodejsFunction(this, 'TriggerFunction', {
      entry: resolve(join(__dirname, '../../src/handler/index.ts')),
      handler: 'handler',
      role: triggerFunctionRole,
      ...LambdaConfiguration,
      layers: [ 
        LayerVersion.fromLayerVersionArn(this, 'KinesisExtensionArn', extensionArn),
        LayerVersion.fromLayerVersionArn(this, 'OtelExtensionArn', `arn:aws:lambda:${region}:901920570463:layer:aws-otel-nodejs-arm64-ver-1-18-1:1`),
      ],
      environment: {
        STAGE: 'dev',
        LOG_INDEX: 'test-otel-logs',
        OTEL_SERVICE_NAME: 'test-otel',
        OTEL_PROPAGATORS: 'tracecontext,baggage',
        OPENTELEMETRY_COLLECTOR_CONFIG_FILE: '/var/task/collector-config.yaml',
      }
    });

    new LogGroup(this, 'TriggerFunctionLogGroup', {
      logGroupName: `/aws/lambda/${triggerFunction.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY
    });

    
  }
}
