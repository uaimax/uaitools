"""Testes para sistema de auditoria LGPD."""

from django.db import transaction
from django.test import TestCase, TransactionTestCase

from apps.accounts.models import Workspace, User
from apps.core.audit import set_current_user
from apps.core.models import AuditLog
from apps.leads.models import Lead


class AuditLogTestCase(TransactionTestCase):
    """Testes para sistema de auditoria."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="pass123",
            workspace=self.workspace,
            first_name="Test",
            last_name="User",
        )

    def test_audit_log_creation(self) -> None:
        """Testa criação de log de auditoria."""
        set_current_user(self.user)

        # Criar lead (sem transação atômica para permitir que signals executem)
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Test Lead",
            email="test@example.com",
        )

        # Verificar se log foi criado
        logs = AuditLog.objects.filter(model_name__contains="Lead", field_name="email")
        self.assertGreater(logs.count(), 0)

        log = logs.first()
        self.assertIsNotNone(log)
        self.assertEqual(log.action, "create")
        self.assertEqual(log.field_name, "email")
        self.assertEqual(log.new_value, "test@example.com")
        self.assertTrue(log.is_personal_data)
        self.assertEqual(log.data_subject, "test@example.com")

    def test_audit_log_update(self) -> None:
        """Testa log de atualização."""
        set_current_user(self.user)

        # Criar lead
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Test Lead",
            email="old@example.com",
        )

        # Limpar logs anteriores
        AuditLog.objects.all().delete()

        # Atualizar
        lead.email = "new@example.com"
        lead.save()

        # Verificar log de atualização (fora da transação)
        logs = AuditLog.objects.filter(
            model_name__contains="Lead", field_name="email", action="update"
        )
        self.assertGreater(logs.count(), 0)

        log = logs.first()
        self.assertIsNotNone(log)
        self.assertEqual(log.action, "update")
        self.assertEqual(log.old_value, "old@example.com")
        self.assertEqual(log.new_value, "new@example.com")
        self.assertTrue(log.is_personal_data)

    def test_audit_log_tracks_user(self) -> None:
        """Testa que log rastreia usuário."""
        set_current_user(self.user)

        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Test Lead",
            email="test@example.com",
        )

        log = AuditLog.objects.filter(
            model_name__contains="Lead", field_name="email"
        ).first()

        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.workspace, self.workspace)

    def test_audit_log_identifies_personal_data(self) -> None:
        """Testa identificação de dados pessoais."""
        set_current_user(self.user)

        # Testar campo email
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Test",
            email="john@example.com",
        )

        log = AuditLog.objects.filter(
            model_name__contains="Lead", field_name="email"
        ).first()

        self.assertIsNotNone(log)
        self.assertTrue(log.is_personal_data)

    def test_audit_log_extracts_data_subject(self) -> None:
        """Testa extração do titular dos dados."""
        set_current_user(self.user)

        lead = Lead.objects.create(
            workspace=self.workspace,
            name="John Doe",
            email="john@example.com",
        )

        log = AuditLog.objects.filter(
            model_name__contains="Lead", field_name="email"
        ).first()

        self.assertIsNotNone(log)
        self.assertEqual(log.data_subject, "john@example.com")

