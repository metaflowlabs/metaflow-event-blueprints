import json
from typing import Any

from aws_lambda_powertools.utilities.typing import LambdaContext

from api import app
from config import with_metaflow_config
from observability import logger, metrics, tracer


@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
@with_metaflow_config
def handler(event: dict[str, Any], context: LambdaContext) -> dict[str, Any]:
    logger.info(f"Event received {event}")

    if context:
        logger.info(
            f"Remaining execution time: {context.get_remaining_time_in_millis()}ms"
        )
        logger.info(f"Function name: {context.function_name}")
        logger.info(f"Request ID: {context.aws_request_id}")

    if is_api_gateway_event(event):
        logger.info("Processing API Gateway REST API event")
        return app.resolve(event, context)

    logger.info("Processing non-API Gateway event")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Event processed successfully", "event": event}),
    }


def is_api_gateway_event(event: dict[str, Any]) -> bool:
    return (
            isinstance(event, dict)
            and "httpMethod" in event
            and "resource" in event
            and "requestContext" in event
    )
