import pytest
from httpx import AsyncClient

from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_create_rule(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "rule@test.com", "full_name": "Rule Tester", "password": "testpassword123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "rule@test.com", "password": "testpassword123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/v1/rules",
        json={
            "name": "University emails",
            "field": "domain",
            "operator": "contains",
            "value": "universidad.edu.co",
            "category": "universidad",
            "priority": 10,
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "University emails"
    assert data["field"] == "domain"
    assert data["category"] == "universidad"


@pytest.mark.asyncio
async def test_get_rules(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "rules@test.com", "full_name": "Rules Tester", "password": "testpassword123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "rules@test.com", "password": "testpassword123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post(
        "/api/v1/rules",
        json={"name": "Rule 1", "field": "subject", "operator": "contains", "value": "test", "category": "test"},
        headers=headers,
    )
    await client.post(
        "/api/v1/rules",
        json={"name": "Rule 2", "field": "sender", "operator": "contains", "value": "@company.com", "category": "work"},
        headers=headers,
    )

    response = await client.get("/api/v1/rules", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_rule_engine_domain_classification(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "classifier@test.com", "full_name": "Classifier", "password": "testpassword123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "classifier@test.com", "password": "testpassword123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post(
        "/api/v1/rules",
        json={"name": "Uni", "field": "domain", "operator": "contains", "value": "universidad", "category": "universidad"},
        headers=headers,
    )

    from app.modules.rules.engine import RuleEngine
    from app.modules.rules.repository import RuleRepository
    from app.database.session import async_session_factory

    async with async_session_factory() as session:
        repo = RuleRepository(session)
        engine = RuleEngine(repo)
        result = await engine.classify(
            {"sender": "profesor@universidad.edu.co", "subject": "Parcial final"},
            "some-user-id",
        )
        assert result.category == "universidad"
