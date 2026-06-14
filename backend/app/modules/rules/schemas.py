from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

VALID_FIELDS = {"sender", "sender_name", "subject", "body_plain", "recipient", "domain"}
VALID_OPERATORS = {"contains", "equals", "starts_with", "ends_with", "regex", "not_contains"}
VALID_PRIORITIES = {"bajo", "medio", "alto", "urgente"}


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    field: str
    operator: str
    value: str
    category: Optional[str] = None
    label: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = "medio"

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        if v not in VALID_FIELDS:
            raise ValueError(f"Invalid field. Must be one of: {', '.join(sorted(VALID_FIELDS))}")
        return v

    @field_validator("operator")
    @classmethod
    def validate_operator(cls, v: str) -> str:
        if v not in VALID_OPERATORS:
            raise ValueError(f"Invalid operator. Must be one of: {', '.join(sorted(VALID_OPERATORS))}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}")
        return v


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[str] = None
    category: Optional[str] = None
    label: Optional[str] = None
    assigned_to: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[str] = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v is not None and v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}")
        return v


class RuleResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    field: str
    operator: str
    value: str
    category: Optional[str] = None
    label: Optional[str] = None
    assigned_to: Optional[str] = None
    is_active: bool
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClassificationResult(BaseModel):
    category: Optional[str] = None
    label: Optional[str] = None
    assigned_to: Optional[str] = None
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
