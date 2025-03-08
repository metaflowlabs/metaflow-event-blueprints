import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export const METAFLOW_CONFIG_PARAMETER_ENV_VAR = 'METAFLOW_CONFIG_PARAMETER_NAME';
export const DEFAULT_LAMBDA_TIMEOUT = cdk.Duration.seconds(30);
export const DEFAULT_LAMBDA_MEMORY_MB = 256;
export const DEFAULT_PYTHON_VERSION = lambda.Runtime.PYTHON_3_12;
export const DEFAULT_LAMBDA_ARCHITECTURE = lambda.Architecture.ARM_64;

export enum MetaflowBackend {
  METAFLOW = 'metaflow',
  OUTERBOUNDS = 'outerbounds',
}
