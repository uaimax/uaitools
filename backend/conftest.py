"""Fixtures globais para testes pytest-django."""

import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Workspace

User = get_user_model()


@pytest.fixture
def workspace(db) -> Workspace:
    """Cria um workspace de teste."""
    return Workspace.objects.create(name="Test Workspace", slug="test-workspace", is_active=True)


@pytest.fixture
def tenant(db) -> Workspace:
    """Alias para workspace (compatibilidade)."""
    return Workspace.objects.create(name="Test Workspace", slug="test-workspace", is_active=True)


@pytest.fixture
def user(db, workspace: Workspace) -> User:
    """Cria um usuário de teste com workspace."""
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        workspace=workspace,
        first_name="Test",
        last_name="User",
    )

