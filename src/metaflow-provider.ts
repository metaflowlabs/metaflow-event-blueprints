import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface MetaflowProviderProps {
  readonly parameterName?: string;
}

export class MetaflowProvider extends Construct {
  public readonly parameter: ssm.IParameter;

  constructor(scope: Construct, id: string, props: MetaflowProviderProps) {
    super(scope, id);

    this.parameter = ssm.StringParameter.fromStringParameterAttributes(this, 'MetaflowParameter', {
      parameterName: props.parameterName!,
    });
  }
}
