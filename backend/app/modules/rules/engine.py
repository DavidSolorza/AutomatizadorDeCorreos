import re
from typing import Optional

from app.modules.rules.repository import RuleRepository
from app.modules.rules.schemas import ClassificationResult


class RuleEngine:
    def __init__(self, rule_repository: RuleRepository):
        self.repository = rule_repository

    async def classify(self, email_data: dict, user_id: str) -> ClassificationResult:
        rules = await self.repository.get_active_by_user(user_id)

        for rule in rules:
            field_value = self._get_field_value(email_data, rule.field)
            if field_value is None:
                continue

            if self._evaluate_rule(field_value, rule.operator, rule.value):
                return ClassificationResult(
                    category=rule.category,
                    label=rule.label,
                    assigned_to=rule.assigned_to,
                    rule_id=rule.id,
                    rule_name=rule.name,
                )

        return ClassificationResult()

    def _get_field_value(self, email_data: dict, field: str) -> Optional[str]:
        field_map = {
            "sender": email_data.get("sender", ""),
            "sender_name": email_data.get("sender_name", ""),
            "subject": email_data.get("subject", ""),
            "body_plain": email_data.get("body_plain", ""),
            "recipient": email_data.get("recipient", ""),
            "domain": (email_data.get("sender", "").split("@")[-1] if "@" in email_data.get("sender", "") else ""),
        }
        return field_map.get(field)

    def _evaluate_rule(self, field_value: str, operator: str, rule_value: str) -> bool:
        try:
            if operator == "contains":
                return rule_value.lower() in field_value.lower()
            elif operator == "not_contains":
                return rule_value.lower() not in field_value.lower()
            elif operator == "equals":
                return field_value.lower() == rule_value.lower()
            elif operator == "starts_with":
                return field_value.lower().startswith(rule_value.lower())
            elif operator == "ends_with":
                return field_value.lower().endswith(rule_value.lower())
            elif operator == "regex":
                return bool(re.search(rule_value, field_value, re.IGNORECASE))
            return False
        except Exception:
            return False
