import os

from aws_lambda_powertools import Logger, Metrics, Tracer

SERVICE_NAME = "docs-executor"
METRICS_NAMESPACE = "MetaflowBlueprints"
LOG_LEVEL = os.environ.get("POWERTOOLS_LOG_LEVEL", "INFO")

logger = Logger(service=SERVICE_NAME, level=LOG_LEVEL)
tracer = Tracer(service=SERVICE_NAME)
metrics = Metrics(namespace=METRICS_NAMESPACE, service=SERVICE_NAME)
