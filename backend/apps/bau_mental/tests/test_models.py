"""Tests for bau_mental models."""

from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.accounts.models import Workspace, User
from apps.bau_mental.models import Box, Note


class BoxModelTest(TestCase):
    """Testes para modelo Box."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )

    def test_create_box(self) -> None:
        """Testa criação de caixinha."""
        box = Box.objects.create(
            workspace=self.workspace,
            name="Casa",
            color="#FF5733",
            description="Anotações sobre casa",
        )
        self.assertEqual(box.name, "Casa")
        self.assertEqual(box.workspace, self.workspace)
        self.assertEqual(box.note_count, 0)

    def test_box_str(self) -> None:
        """Testa representação string da caixinha."""
        box = Box.objects.create(workspace=self.workspace, name="Trabalho")
        self.assertIn("Trabalho", str(box))
        self.assertIn(self.workspace.name, str(box))

    def test_box_notes_count(self) -> None:
        """Testa contagem de anotações (campo cacheado)."""
        box = Box.objects.create(workspace=self.workspace, name="Casa")
        self.assertEqual(box.note_count, 0)

        # Criar anotação (trigger atualiza note_count automaticamente)
        note = Note.objects.create(
            workspace=self.workspace,
            box=box,
            audio_file="test.mp3",
            processing_status="completed",
        )
        box.refresh_from_db()
        # Trigger atualiza note_count automaticamente
        self.assertEqual(box.note_count, 1)


class NoteModelTest(TestCase):
    """Testes para modelo Note."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )
        self.box = Box.objects.create(workspace=self.workspace, name="Casa")

    def test_create_note(self) -> None:
        """Testa criação de anotação."""
        note = Note.objects.create(
            workspace=self.workspace,
            box=self.box,
            audio_file="test.mp3",
            source_type="memo",
            processing_status="pending",
        )
        self.assertEqual(note.workspace, self.workspace)
        self.assertEqual(note.box, self.box)
        self.assertEqual(note.source_type, "memo")
        self.assertEqual(note.processing_status, "pending")

    def test_note_in_inbox(self) -> None:
        """Testa anotação na inbox (sem caixinha)."""
        note = Note.objects.create(
            workspace=self.workspace,
            box=None,
            audio_file="test.mp3",
            processing_status="pending",
        )
        self.assertTrue(note.is_in_inbox)
        self.assertIsNone(note.box)

    def test_note_str(self) -> None:
        """Testa representação string da anotação."""
        note = Note.objects.create(
            workspace=self.workspace,
            box=self.box,
            audio_file="test.mp3",
            processing_status="completed",
        )
        self.assertIn(self.box.name, str(note))



