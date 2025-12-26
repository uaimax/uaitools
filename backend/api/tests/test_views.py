"""Testes para views da API."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class HealthCheckTestCase(TestCase):
    """Testes para endpoint de health check."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()

    def test_health_check_returns_200(self) -> None:
        """Testa que health check retorna 200."""
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_health_check_returns_correct_data(self) -> None:
        """Testa que health check retorna dados corretos."""
        response = self.client.get("/api/health/")
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("version", data)
        self.assertIn("api_prefix", data)

    def test_health_check_no_auth_required(self) -> None:
        """Testa que health check não requer autenticação."""
        # Client sem autenticação
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class APIInfoTestCase(TestCase):
    """Testes para endpoint de info da API."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()

    def test_api_info_returns_200(self) -> None:
        """Testa que api info retorna 200."""
        response = self.client.get("/api/info/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_info_returns_correct_data(self) -> None:
        """Testa que api info retorna dados corretos."""
        from django.conf import settings
        response = self.client.get("/api/info/")
        data = response.json()
        api_title = getattr(settings, "API_TITLE", "API")
        self.assertEqual(data["name"], api_title)
        self.assertIn("version", data)
        self.assertIn("openapi_schema", data)
        self.assertIn("swagger_ui", data)
        self.assertIn("redoc", data)

    def test_api_info_no_auth_required(self) -> None:
        """Testa que api info não requer autenticação."""
        response = self.client.get("/api/info/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

