from datetime import UTC, datetime
from http import HTTPStatus
from typing import Any

from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler import Response, content_types
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    InternalServerError,
    NotFoundError,
)
from pydantic import BaseModel, Field

from observability import logger, metrics, tracer

app = APIGatewayRestResolver()


class FlowResponse(BaseModel):
    flow_id: str = Field(..., description="Flow identifier")
    flow_name: str = Field(..., description="Name of the flow")
    timestamp: str = Field(..., description="Response timestamp")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: dict[str, Any] | None = Field(None, description="Additional error details")


@app.get(
    "/flows/latest",
    summary="Latest Flow endpoint",
    description="Returns information about the latest available flow (hard-coded for now)",
)
@tracer.capture_method
def get_latest_flow() -> dict[str, Any]:
    logger.info("Latest flow endpoint called")
    metrics.add_metric(name="GetLatestFlowApiCalls", unit="Count", value=1)
    timestamp = datetime.now(UTC).isoformat()
    flow_id = "123456"
    flow_name = "DataProcessingFlow"

    logger.info(f"Returning flow information: id={flow_id}, name={flow_name}")

    return FlowResponse(flow_id=flow_id, flow_name=flow_name, timestamp=timestamp).model_dump()


@app.get(
    "/health",
    summary="Health check endpoint",
    description="Returns the current health status of the API",
)
def health_check() -> dict[str, str]:
    logger.info("Health check endpoint called")
    return {"status": "healthy"}


@app.exception_handler(BadRequestError)
def handle_bad_request_error(ex: BadRequestError):
    logger.warning(f"Bad request: {ex!s}")
    detail = {
        "request_id": app.current_event.request_context.get("requestId", "unknown"),
        "path": app.current_event.get("path", ""),
        "timestamp": datetime.now(UTC).isoformat(),
    }

    return Response(
        status_code=HTTPStatus.BAD_REQUEST,
        content_type=content_types.APPLICATION_JSON,
        body=ErrorResponse(
            error="Bad Request", message=str(ex), detail=detail
        ).model_dump_json(),
    )


@app.exception_handler(NotFoundError)
def handle_not_found_error(ex: NotFoundError):
    logger.warning(f"Resource not found: {ex!s}")
    detail = {
        "request_id": app.current_event.request_context.get("requestId", "unknown"),
        "path": app.current_event.get("path", ""),
        "requested_resource": app.current_event.get("path", ""),
        "timestamp": datetime.now(UTC).isoformat(),
    }

    return Response(
        status_code=HTTPStatus.NOT_FOUND,
        content_type=content_types.APPLICATION_JSON,
        body=ErrorResponse(
            error="Not Found", message=str(ex), detail=detail
        ).model_dump_json(),
    )


@app.exception_handler(InternalServerError)
def handle_internal_server_error(ex: InternalServerError):
    logger.error(f"Internal server error: {ex!s}")
    detail = {
        "request_id": app.current_event.request_context.get("requestId", "unknown"),
        "timestamp": datetime.now(UTC).isoformat(),
        "service_name": "Metaflow Executor API",
        "error_type": ex.__class__.__name__,
    }

    return Response(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        content_type=content_types.APPLICATION_JSON,
        body=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred",
            detail=detail,
        ).model_dump_json(),
    )


@app.exception_handler(Exception)
def handle_generic_error(ex: Exception):
    logger.exception(f"Unhandled exception: {ex!s}")
    detail = {
        "request_id": app.current_event.request_context.get("requestId", "unknown"),
        "timestamp": datetime.now(UTC).isoformat(),
        "service_name": "Metaflow Executor API",
        "error_type": ex.__class__.__name__,
        "exception_message": str(ex),
    }

    return Response(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        content_type=content_types.APPLICATION_JSON,
        body=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred",
            detail=detail,
        ).model_dump_json(),
    )
