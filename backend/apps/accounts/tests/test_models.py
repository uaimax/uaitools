"""Testes para models do app accounts."""

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.accounts.models import Workspace

User = get_user_model()


@pytest.mark.django_db
class TestWorkspace:
    """Testes para modelo Workspace."""

    def test_create_workspace(self) -> None:
        """Testa criação de workspace."""
        workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")
        assert workspace.name == "Test Workspace"
        assert workspace.slug == "test-workspace"
        assert workspace.is_active is True

    def test_workspace_str(self) -> None:
        """Testa representação string do workspace."""
        workspace = Workspace.objects.create(name="My Workspace", slug="my-workspace")
        assert str(workspace) == "My Workspace"

    def test_workspace_slug_unique(self) -> None:
        """Testa que slug deve ser único."""
        Workspace.objects.create(name="Workspace 1", slug="workspace-1")
        with pytest.raises(Exception):  # IntegrityError ou ValidationError
            Workspace.objects.create(name="Workspace 2", slug="workspace-1")


@pytest.mark.django_db
class TestUser:
    """Testes para modelo User customizado."""

    def test_create_user_with_workspace(self) -> None:
        """Testa criação de usuário com workspace."""
        workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=workspace,
        )
        assert user.email == "test@example.com"
        assert user.workspace == workspace
        assert user.check_password("testpass123")

    def test_create_user_without_workspace(self) -> None:
        """Testa criação de usuário sem workspace (permitido)."""
        user = User.objects.create_user(
            email="test2@example.com",
            password="testpass123",
        )
        assert user.workspace is None

    def test_user_str(self) -> None:
        """Testa representação string do usuário."""
        workspace = Workspace.objects.create(name="My Workspace", slug="my-workspace")
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=workspace,
        )
        assert "test@example.com" in str(user)
        assert "My Workspace" in str(user)

    def test_user_str_no_workspace(self) -> None:
        """Testa representação string do usuário sem workspace."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )
        assert "test@example.com" in str(user)
        assert "Sem workspace" in str(user)

