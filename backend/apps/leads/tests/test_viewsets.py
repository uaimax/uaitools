"""Testes para ViewSets do app leads."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Workspace, User
from apps.leads.models import Lead


class LeadViewSetTestCase(TestCase):
    """Testes para LeadViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace1 = Workspace.objects.create(name="Workspace 1", slug="workspace-1")
        self.workspace2 = Workspace.objects.create(name="Workspace 2", slug="workspace-2")
        self.user1 = User.objects.create_user(
            email="user1@test.com", password="pass123", workspace=self.workspace1
        )
        self.user2 = User.objects.create_user(
            email="user2@test.com", password="pass123", workspace=self.workspace2
        )

    def test_list_leads_requires_authentication(self) -> None:
        """Testa que listar leads requer autenticação."""
        response = self.client.get("/api/leads/")
        # DRF retorna 403 Forbidden quando não autenticado (não 401)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_list_leads_filtered_by_workspace(self) -> None:
        """Testa que leads são filtrados por workspace."""
        # Criar leads para cada workspace
        lead1 = Lead.objects.create(
            workspace=self.workspace1, name="Lead 1", email="lead1@test.com"
        )
        lead2 = Lead.objects.create(
            workspace=self.workspace2, name="Lead 2", email="lead2@test.com"
        )

        # Autenticar como user1 (workspace1)
        self.client.force_authenticate(user=self.user1)
        # Simular workspace no request (middleware faria isso)
        response = self.client.get(
            "/api/leads/", HTTP_X_WORKSPACE_ID=self.workspace1.slug
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # DRF pode retornar lista ou dict com results (depende da paginação)
        if isinstance(data, list):
            lead_ids = [lead["id"] for lead in data]
        else:
            lead_ids = [lead["id"] for lead in data.get("results", [])]
        # Verificar que apenas lead1 está na lista
        self.assertIn(lead1.id, lead_ids)
        self.assertNotIn(lead2.id, lead_ids)

    def test_create_lead(self) -> None:
        """Testa criação de lead via API."""
        self.client.force_authenticate(user=self.user1)
        data = {
            "name": "New Lead",
            "email": "newlead@test.com",
            "status": "new",
        }
        response = self.client.post(
            "/api/leads/", data, HTTP_X_WORKSPACE_ID=self.workspace1.slug
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["name"], "New Lead")

    def test_filter_by_status(self) -> None:
        """Testa filtro por status."""
        Lead.objects.create(
            workspace=self.workspace1, name="New Lead", email="new@test.com", status="new"
        )
        Lead.objects.create(
            workspace=self.workspace1,
            name="Contacted Lead",
            email="contacted@test.com",
            status="contacted",
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            "/api/leads/?status=new", HTTP_X_WORKSPACE_ID=self.workspace1.slug
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # DRF pode retornar lista ou dict com results
        if isinstance(data, list):
            results = data
        else:
            results = data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "new")

    def test_search_leads(self) -> None:
        """Testa busca de leads."""
        Lead.objects.create(
            workspace=self.workspace1, name="John Doe", email="john@test.com"
        )
        Lead.objects.create(
            workspace=self.workspace1, name="Jane Smith", email="jane@test.com"
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            "/api/leads/?search=John", HTTP_X_WORKSPACE_ID=self.workspace1.slug
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # DRF pode retornar lista ou dict com results
        if isinstance(data, list):
            results = data
        else:
            results = data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertIn("John", results[0]["name"])

