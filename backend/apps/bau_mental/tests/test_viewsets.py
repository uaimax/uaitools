"""Tests for bau_mental viewsets."""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import Workspace, User
from apps.bau_mental.models import Box, Note


class BoxViewSetTest(TestCase):
    """Testes para BoxViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_WORKSPACE_ID=str(self.workspace.id))

    def test_list_boxes(self) -> None:
        """Testa listagem de caixinhas."""
        Box.objects.create(workspace=self.workspace, name="Casa")
        Box.objects.create(workspace=self.workspace, name="Trabalho")

        url = "/api/v1/bau-mental/boxes/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_box(self) -> None:
        """Testa criação de caixinha."""
        url = "/api/v1/bau-mental/boxes/"
        data = {"name": "Casa", "color": "#FF5733"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Casa")
        self.assertTrue(Box.objects.filter(name="Casa").exists())

    def test_update_box(self) -> None:
        """Testa atualização de caixinha."""
        box = Box.objects.create(workspace=self.workspace, name="Casa")
        url = f"/api/v1/bau-mental/boxes/{box.id}/"
        data = {"name": "Casa Renovada"}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        box.refresh_from_db()
        self.assertEqual(box.name, "Casa Renovada")

    def test_delete_box(self) -> None:
        """Testa deleção de caixinha (soft delete)."""
        box = Box.objects.create(workspace=self.workspace, name="Casa")
        url = f"/api/v1/bau-mental/boxes/{box.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Soft delete - objeto ainda existe mas está marcado como deletado
        self.assertTrue(Box.objects.filter(id=box.id).exists())
        box.refresh_from_db()
        self.assertIsNotNone(box.deleted_at)


class NoteViewSetTest(TestCase):
    """Testes para NoteViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )
        self.box = Box.objects.create(workspace=self.workspace, name="Casa")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_WORKSPACE_ID=str(self.workspace.id))

    def test_list_notes(self) -> None:
        """Testa listagem de anotações."""
        Note.objects.create(
            workspace=self.workspace,
            box=self.box,
            audio_file="test1.mp3",
            processing_status="completed",
        )
        Note.objects.create(
            workspace=self.workspace,
            box=None,
            audio_file="test2.mp3",
            processing_status="pending",
        )

        url = "/api/v1/bau-mental/notes/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_box(self) -> None:
        """Testa filtro por caixinha."""
        Note.objects.create(
            workspace=self.workspace,
            box=self.box,
            audio_file="test1.mp3",
            processing_status="completed",
        )
        Note.objects.create(
            workspace=self.workspace,
            box=None,
            audio_file="test2.mp3",
            processing_status="completed",
        )

        url = "/api/v1/bau-mental/notes/"
        response = self.client.get(url, {"box": str(self.box.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_inbox(self) -> None:
        """Testa filtro por inbox."""
        Note.objects.create(
            workspace=self.workspace,
            box=self.box,
            audio_file="test1.mp3",
            processing_status="completed",
        )
        Note.objects.create(
            workspace=self.workspace,
            box=None,
            audio_file="test2.mp3",
            processing_status="completed",
        )

        url = "/api/v1/bau-mental/notes/"
        response = self.client.get(url, {"inbox": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

