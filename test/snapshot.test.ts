import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MetaflowBackend, MetaflowProvider } from '../src';

describe('MetaflowProvider Snapshots', () => {
  test('CloudFormation template snapshot for OUTERBOUNDS backend', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'test', {});

    // WHEN
    new MetaflowProvider(stack, 'MetaflowProvider', {
      parameterName: '/metaflow/backend',
      backend: MetaflowBackend.OUTERBOUNDS,
    });

    // THEN
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });

  test('CloudFormation template snapshot for METAFLOW backend', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'test', {});

    // WHEN
    new MetaflowProvider(stack, 'MetaflowProvider', {
      parameterName: '/metaflow/backend',
      backend: MetaflowBackend.METAFLOW,
    });

    // THEN
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
