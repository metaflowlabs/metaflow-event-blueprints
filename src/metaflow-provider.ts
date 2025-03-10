import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { resolvePythonLayers } from './lambda';
import * as consts from './lambda/constants';

export interface MetaflowProviderProps {
  readonly parameterName?: string;
  readonly backend?: consts.MetaflowBackend;
}

export class MetaflowProvider extends Construct {
  public readonly parameter: ssm.IParameter;
  public readonly layers: lambda.ILayerVersion[];
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: MetaflowProviderProps) {
    super(scope, id);

    this.parameter = ssm.StringParameter.fromStringParameterAttributes(this, 'MetaflowParameter', {
      parameterName: props.parameterName!,
    });

    this.layers = resolvePythonLayers(this, props.backend);

    this.lambdaFunction = new lambda.Function(this, 'ExecutorFunction', {
      runtime: consts.DEFAULT_PYTHON_VERSION,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/metaflow-executor')),
      layers: this.layers,
      memorySize: consts.DEFAULT_LAMBDA_MEMORY_MB,
      timeout: consts.DEFAULT_LAMBDA_TIMEOUT,
      architecture: consts.DEFAULT_LAMBDA_ARCHITECTURE,
      environment: {
        [consts.METAFLOW_CONFIG_PARAMETER_ENV_VAR]: props.parameterName!,
      },
    });
    this.parameter.grantRead(this.lambdaFunction);
    this.createRestApi();
  }

  private createRestApi(): { restApi: apigateway.RestApi; apiKey: apigateway.IApiKey } {
    const restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: 'Metaflow Executor API',
      description: 'API Gateway for Metaflow Executor Lambda',
      deployOptions: {
        stageName: 'test',
        description: 'Test stage for Metaflow Executor API',
        tracingEnabled: true,
      },
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction);

    restApi.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: 'MetaflowExecutorTestApiKey',
      description: 'API Key for testing Metaflow Executor API',
      enabled: true,
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'MetaflowExecutorTestUsagePlan',
      description: 'Usage plan for testing Metaflow Executor API',
      apiStages: [
        {
          api: restApi,
          stage: restApi.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    const stack = cdk.Stack.of(this);

    new cdk.CfnOutput(stack, 'MetaflowApiEndpoint', {
      value: restApi.url,
      description: 'Metaflow Executor API Endpoint URL',
      exportName: 'MetaflowApiEndpoint',
    });

    new cdk.CfnOutput(stack, 'MetaflowApiKeyId', {
      value: `aws apigateway get-api-key --api-key ${apiKey.keyId} --include-value`,
      description: 'Metaflow Executor API Key awscli command',
      exportName: 'MetaflowApiKeyId',
    });

    new cdk.CfnOutput(stack, 'MetaflowHealthEndpointCurl', {
      value: `curl -X GET "${restApi.url}health" -H "x-api-key: \${API_KEY_VALUE}"`,
    });

    new cdk.CfnOutput(stack, 'MetaflowLatestFlowEndpointCurl', {
      value: `curl -X GET "${restApi.url}flows/latest" -H "x-api-key: \${API_KEY_VALUE}"`,
    });

    return { restApi, apiKey };
  }
}
