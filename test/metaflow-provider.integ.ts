import { App, Stack } from 'aws-cdk-lib';
import { MetaflowBackend, MetaflowProvider } from '../src';

const app = new App();
const stack = new Stack(app, 'test', {});

new MetaflowProvider(stack, 'MetaflowProvider', {
  parameterName: 'metaflow-config',
  backend: MetaflowBackend.OUTERBOUNDS,
});

// Aspects.of(stack).add(new AwsSolutionsChecks());

app.synth();
