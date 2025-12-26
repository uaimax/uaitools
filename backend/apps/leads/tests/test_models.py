"""Testes para models do app leads."""

from django.test import TestCase

from apps.accounts.models import Workspace
from apps.leads.models import Lead


class LeadModelTestCase(TestCase):
    """Testes para modelo Lead."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")

    def test_create_lead(self) -> None:
        """Testa criação de lead."""
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="John Doe",
            email="john@example.com",
            status="new",
        )
        self.assertEqual(lead.name, "John Doe")
        self.assertEqual(lead.email, "john@example.com")
        self.assertEqual(lead.status, "new")
        self.assertEqual(lead.workspace, self.workspace)

    def test_lead_str_representation(self) -> None:
        """Testa representação string do lead."""
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Jane Doe",
            email="jane@example.com",
        )
        self.assertIn("Jane Doe", str(lead))
        self.assertIn("jane@example.com", str(lead))

    def test_lead_default_status(self) -> None:
        """Testa que status padrão é 'new'."""
        lead = Lead.objects.create(
            workspace=self.workspace,
            name="Test Lead",
            email="test@example.com",
        )
        self.assertEqual(lead.status, "new")

    def test_lead_ordering(self) -> None:
        """Testa ordenação de leads (mais recentes primeiro)."""
        lead1 = Lead.objects.create(
            workspace=self.workspace,
            name="Lead 1",
            email="lead1@example.com",
        )
        lead2 = Lead.objects.create(
            workspace=self.workspace,
            name="Lead 2",
            email="lead2@example.com",
        )
        leads = list(Lead.objects.all())
        self.assertEqual(leads[0], lead2)  # Mais recente primeiro
        self.assertEqual(leads[1], lead1)

