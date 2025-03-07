import json
import os
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aws_lambda_powertools.middleware_factory import lambda_handler_decorator
from aws_lambda_powertools.utilities.parameters import get_parameter
from aws_lambda_powertools.utilities.typing import LambdaContext
from observability import logger

METAFLOW_CONFIG_DIR = "/tmp/.metaflowconfig"
METAFLOW_CONFIG_FILE = "config.json"


@dataclass
class MetaflowConfig:
    config_path: str
    raw_config: dict[str, Any]
    is_valid: bool = True


def load_metaflow_config() -> MetaflowConfig | None:
    config_dir = METAFLOW_CONFIG_DIR
    config_path = f"{config_dir}/{METAFLOW_CONFIG_FILE}"
    Path(config_dir).mkdir(parents=True, exist_ok=True)

    param_name = os.environ.get("METAFLOW_CONFIG_PARAMETER_NAME")
    if not param_name:
        logger.error("METAFLOW_CONFIG_PARAMETER_NAME environment variable not set")
        return None

    try:
        config_dict = get_parameter(name=param_name, decrypt=True, transform="json")

        if not validate_config(config_dict):
            logger.error("Invalid Metaflow configuration: missing required fields")
            return MetaflowConfig(config_path=config_path, raw_config=config_dict, is_valid=False)

        with Path(config_path).open("w", encoding="utf-8") as f:
            json.dump(config_dict, f)

        logger.info(f"Successfully loaded Metaflow configuration to {config_path}")
        return MetaflowConfig(config_path=config_path, raw_config=config_dict)
    except (ValueError, TypeError, KeyError) as e:
        logger.exception(f"Failed to process Metaflow config due to invalid data: {e!s}")
        return MetaflowConfig(config_path=config_path, raw_config={}, is_valid=False)
    except (OSError, PermissionError) as e:
        logger.exception(f"Failed to write Metaflow config to file: {e!s}")
        return MetaflowConfig(config_path=config_path, raw_config={}, is_valid=False)
    except ImportError as e:
        logger.exception(f"Failed to import required module: {e!s}")
        return MetaflowConfig(config_path=config_path, raw_config={}, is_valid=False)


def validate_config(config: dict[str, Any]) -> bool:
    required_fields = []
    if required_fields:
        return all(field in config for field in required_fields)
    else:
        return True


def setup_metaflow_environment() -> MetaflowConfig | None:
    os.environ["METAFLOW_HOME"] = METAFLOW_CONFIG_DIR
    return load_metaflow_config()


@lambda_handler_decorator
def with_metaflow_config(
    handler: Callable[[dict, LambdaContext], dict],
    event: dict,
    context: LambdaContext,
) -> dict:
    config = setup_metaflow_environment()
    if not config or not config.is_valid:
        logger.error("Metaflow configuration initialization failed")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "Metaflow configuration initialization failed",
                "config_path": config.config_path if config else None,
            }),
        }

    if "metaflow_context" not in event:
        event["metaflow_context"] = {}
    event["metaflow_context"]["config_path"] = config.config_path

    return handler(event, context)
