"""
Shared base model that serializes to camelCase.

The frontend (Next.js) expects camelCase JSON keys (e.g. fileType, docName),
while this backend uses Python snake_case field names internally.
FastAPI serializes response models with by_alias=True, so these models
emit camelCase JSON while still accepting snake_case input.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
