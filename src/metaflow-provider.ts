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

  constructor(scope: Construct, id: string, props: MetaflowProviderProps) {
    super(scope, id);

    this.parameter = ssm.StringParameter.fromStringParameterAttributes(this, 'MetaflowParameter', {
      parameterName: props.parameterName!,
    });

    this.layers = resolvePythonLayers(this, props.backend);
  }
}
