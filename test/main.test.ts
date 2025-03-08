import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MetaflowBackend, MetaflowProvider } from '../src';

test('Snapshot', () => {
  const app = new App();
  const stack = new Stack(app, 'test', {});

  new MetaflowProvider(stack, 'MetaflowProvider', {
    parameterName: '/metaflow/backend',
    backend: MetaflowBackend.OUTERBOUNDS,
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
