"""Testes para filtros de logging de segurança."""

import logging
from unittest.mock import Mock

from django.test import TestCase

from apps.core.logging import SensitiveDataFilter, SENSITIVE_FIELDS


class SensitiveDataFilterTestCase(TestCase):
    """Testes para SensitiveDataFilter."""

    def test_redige_campos_sensíveis_em_request_data(self):
        """Testa que campos sensíveis são redigidos em request_data."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        # Simular request_data com campo sensível
        record.request_data = {
            "email": "user@example.com",
            "password": "secret123",
            "name": "John Doe",
        }

        result = filter_instance.filter(record)

        self.assertTrue(result)
        self.assertEqual(record.request_data["email"], "user@example.com")
        self.assertEqual(record.request_data["password"], "***REDACTED***")
        self.assertEqual(record.request_data["name"], "John Doe")

    def test_redige_multiplos_campos_sensíveis(self):
        """Testa que múltiplos campos sensíveis são redigidos."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        record.request_data = {
            "password": "secret123",
            "token": "abc123",
            "api_key": "key456",
            "email": "user@example.com",
        }

        filter_instance.filter(record)

        self.assertEqual(record.request_data["password"], "***REDACTED***")
        self.assertEqual(record.request_data["token"], "***REDACTED***")
        self.assertEqual(record.request_data["api_key"], "***REDACTED***")
        self.assertEqual(record.request_data["email"], "user@example.com")

    def test_redige_campos_sensíveis_em_message(self):
        """Testa que campos sensíveis são redigidos em message string."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        record.message = "Login attempt: password=secret123, email=user@example.com"

        filter_instance.filter(record)

        self.assertIn("password=***REDACTED***", record.message)
        self.assertIn("email=user@example.com", record.message)

    def test_redige_campos_sensíveis_em_args_dict(self):
        """Testa que campos sensíveis são redigidos em args (dict)."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        record.args = (
            {"email": "user@example.com", "password": "secret123"},
            "extra info",
        )

        filter_instance.filter(record)

        # Verificar que password foi redigido no dict
        self.assertEqual(record.args[0]["password"], "***REDACTED***")
        self.assertEqual(record.args[0]["email"], "user@example.com")
        self.assertEqual(record.args[1], "extra info")

    def test_não_afeta_campos_não_sensíveis(self):
        """Testa que campos não sensíveis não são alterados."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        record.request_data = {
            "email": "user@example.com",
            "name": "John Doe",
            "age": 30,
        }

        filter_instance.filter(record)

        self.assertEqual(record.request_data["email"], "user@example.com")
        self.assertEqual(record.request_data["name"], "John Doe")
        self.assertEqual(record.request_data["age"], 30)

    def test_retorna_true_sempre(self):
        """Testa que filter sempre retorna True (não bloqueia logs)."""
        filter_instance = SensitiveDataFilter()
        record = Mock(spec=logging.LogRecord)

        result = filter_instance.filter(record)

        self.assertTrue(result)


    def test_sensitive_fields_list(self):
        """Testa que lista de campos sensíveis está completa."""
        # Verificar que campos críticos estão na lista
        critical_fields = ["password", "token", "secret", "api_key"]
        for field in critical_fields:
            self.assertIn(
                field, SENSITIVE_FIELDS, f"Campo crítico '{field}' não está na lista"
            )

