import * as path from 'path';
import * as python from '@aws-cdk/aws-lambda-python-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as consts from './constants';

export function resolvePythonLayers(
  scope: Construct,
  backend: consts.MetaflowBackend = consts.MetaflowBackend.OUTERBOUNDS,
): lambda.ILayerVersion[] {
  const layerPath = path.join(__dirname, 'layers', backend);
  const layerName = backend === consts.MetaflowBackend.OUTERBOUNDS ? 'OuterboundsLayer' : 'MetaflowLayer';
  const description =
    backend === consts.MetaflowBackend.OUTERBOUNDS
      ? 'Layer containing the Outerbounds Metaflow dependencies'
      : 'Layer containing the Metaflow dependencies';

  const metaflowLayer = new python.PythonLayerVersion(scope, layerName, {
    entry: layerPath,
    compatibleRuntimes: [consts.DEFAULT_PYTHON_VERSION],
    compatibleArchitectures: [consts.DEFAULT_LAMBDA_ARCHITECTURE],
    description,
  });

  const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
    scope,
    'PowertoolsLayer',
    `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPythonV3-python312-arm64:7`,
  );

  return [metaflowLayer, powertoolsLayer];
}
