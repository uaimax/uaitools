#!/usr/bin/env python
"""
Script para testar todos os endpoints usados pelo app mobile.
Testa autenticação, notas, caixinhas e health check.
"""

import json
import os
import sys
from pathlib import Path

import requests
from django.core.management import execute_from_command_line

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django

django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import Workspace
from apps.bau_mental.models import Box, Note

User = get_user_model()

# Configuração
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api/v1"

# Cores para output
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
BLUE = "\033[0;34m"
NC = "\033[0m"  # No Color


class EndpointTester:
    """Classe para testar endpoints da API."""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.session = requests.Session()
        self.access_token = None
        self.workspace_id = None
        self.workspace_uuid = None
        self.user_email = "test_mobile@example.com"
        self.user_password = "test123456"
        self.test_results = []

    def log(self, message: str, status: str = "INFO"):
        """Log com cores."""
        colors = {
            "SUCCESS": GREEN,
            "ERROR": RED,
            "WARNING": YELLOW,
            "INFO": BLUE,
        }
        color = colors.get(status, NC)
        print(f"{color}[{status}]{NC} {message}")

    def test_result(self, name: str, success: bool, details: str = ""):
        """Registra resultado do teste."""
        self.test_results.append(
            {
                "name": name,
                "success": success,
                "details": details,
            }
        )
        if success:
            self.log(f"✅ {name}", "SUCCESS")
        else:
            self.log(f"❌ {name}: {details}", "ERROR")

    def setup_test_data(self):
        """Cria dados de teste (usuário, workspace, etc)."""
        self.log("📦 Configurando dados de teste...", "INFO")

        # Criar ou obter usuário
        user, created = User.objects.get_or_create(
            email=self.user_email,
            defaults={
                "first_name": "Test",
                "last_name": "Mobile",
                "is_active": True,
            },
        )
        if created:
            user.set_password(self.user_password)
            user.save()
            self.log(f"   ✅ Usuário criado: {self.user_email}", "SUCCESS")
        else:
            self.log(f"   ✅ Usuário já existe: {self.user_email}", "SUCCESS")

        # Criar ou obter workspace
        workspace, created = Workspace.objects.get_or_create(
            name="Test Workspace Mobile",
            defaults={"is_active": True, "slug": f"test-workspace-{os.getpid()}"},
        )
        if created:
            self.log(f"   ✅ Workspace criado: {workspace.name}", "SUCCESS")
        else:
            self.log(f"   ✅ Workspace já existe: {workspace.name}", "SUCCESS")

        # Associar usuário ao workspace
        if user.workspace != workspace:
            user.workspace = workspace
            user.save()
            self.log(f"   ✅ Usuário associado ao workspace", "SUCCESS")

        self.workspace_uuid = str(workspace.id)
        self.workspace_id = self.workspace_uuid

    def check_backend_running(self):
        """Verifica se o backend está rodando."""
        try:
            response = self.session.get(f"{self.api_base}/health/", timeout=2)
            return response.status_code == 200
        except:
            return False

    def test_health_check(self):
        """Testa endpoint de health check."""
        self.log("\n🏥 Testando Health Check...", "INFO")

        if not self.check_backend_running():
            self.log(
                "   ⚠️  Backend não está rodando em http://localhost:8001",
                "WARNING",
            )
            self.log(
                "   💡 Inicie o backend com: cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8001",
                "WARNING",
            )
            self.test_result("Health Check", False, "Backend não está rodando")
            return False

        try:
            response = self.session.get(f"{self.api_base}/health/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.test_result("Health Check", True)
                    return True
                else:
                    self.test_result("Health Check", False, f"Status não é 'healthy': {data}")
                    return False
            else:
                self.test_result("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.test_result("Health Check", False, str(e))
            return False

    def test_register(self):
        """Testa registro de novo usuário."""
        self.log("\n📝 Testando Registro...", "INFO")
        try:
            # Usar email único para registro
            register_email = f"register_{os.getpid()}@example.com"
            data = {
                "email": register_email,
                "password": "test123456",
                "password_confirm": "test123456",
                "first_name": "Test",
                "last_name": "Register",
                "accepted_terms": True,
                "accepted_privacy": True,
            }
            response = self.session.post(
                f"{self.api_base}/auth/register/",
                json=data,
                timeout=10,
            )
            if response.status_code in [200, 201]:
                response_data = response.json()
                if "access" in response_data and "user" in response_data:
                    self.test_result("Registro", True)
                    return True
                else:
                    self.test_result("Registro", False, "Resposta não contém access/user")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Registro",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Registro", False, str(e))
            return False

    def test_login(self):
        """Testa login."""
        self.log("\n🔐 Testando Login...", "INFO")
        try:
            data = {"email": self.user_email, "password": self.user_password}
            response = self.session.post(
                f"{self.api_base}/auth/login/",
                json=data,
                timeout=10,
            )
            if response.status_code == 200:
                response_data = response.json()
                if "access" in response_data and "user" in response_data:
                    self.access_token = response_data["access"]
                    self.session.headers.update(
                        {"Authorization": f"Bearer {self.access_token}"}
                    )
                    # Obter workspace do usuário
                    user_workspaces = response_data.get("user", {}).get("workspaces", [])
                    if user_workspaces:
                        self.workspace_uuid = user_workspaces[0].get("id")
                        self.workspace_id = self.workspace_uuid
                    self.test_result("Login", True)
                    return True
                else:
                    self.test_result("Login", False, "Resposta não contém access/user")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Login",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Login", False, str(e))
            return False

    def test_profile(self):
        """Testa obtenção de perfil."""
        self.log("\n👤 Testando Perfil...", "INFO")
        if not self.access_token:
            self.test_result("Perfil", False, "Token não disponível (faça login primeiro)")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            response = self.session.get(
                f"{self.api_base}/auth/profile/",
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                if "email" in data:
                    self.test_result("Perfil", True)
                    return True
                else:
                    self.test_result("Perfil", False, "Resposta não contém email")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Perfil",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Perfil", False, str(e))
            return False

    def test_boxes_list(self):
        """Testa listagem de caixinhas."""
        self.log("\n📦 Testando Listagem de Caixinhas...", "INFO")
        if not self.access_token:
            self.test_result("Listar Caixinhas", False, "Token não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            response = self.session.get(
                f"{self.api_base}/bau-mental/boxes/",
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                boxes = data if isinstance(data, list) else data.get("results", [])
                self.test_result("Listar Caixinhas", True, f"{len(boxes)} caixinhas encontradas")
                return True
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Listar Caixinhas",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Listar Caixinhas", False, str(e))
            return False

    def test_box_create(self):
        """Testa criação de caixinha."""
        self.log("\n📦 Testando Criação de Caixinha...", "INFO")
        if not self.access_token:
            self.test_result("Criar Caixinha", False, "Token não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            data = {
                "name": f"Test Box {os.getpid()}",
                "description": "Caixinha de teste criada pelo script",
            }
            response = self.session.post(
                f"{self.api_base}/bau-mental/boxes/",
                json=data,
                headers=headers,
                timeout=10,
            )
            if response.status_code in [200, 201]:
                box_data = response.json()
                if "id" in box_data:
                    self.test_box_id = box_data["id"]
                    self.test_result("Criar Caixinha", True, f"ID: {self.test_box_id}")
                    return True
                else:
                    self.test_result("Criar Caixinha", False, "Resposta não contém id")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Criar Caixinha",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Criar Caixinha", False, str(e))
            return False

    def test_box_get(self):
        """Testa obtenção de caixinha."""
        self.log("\n📦 Testando Obter Caixinha...", "INFO")
        if not hasattr(self, "test_box_id") or not self.test_box_id:
            self.test_result("Obter Caixinha", False, "ID de caixinha não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            response = self.session.get(
                f"{self.api_base}/bau-mental/boxes/{self.test_box_id}/",
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.test_result("Obter Caixinha", True)
                    return True
                else:
                    self.test_result("Obter Caixinha", False, "Resposta não contém id")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Obter Caixinha",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Obter Caixinha", False, str(e))
            return False

    def test_box_update(self):
        """Testa atualização de caixinha."""
        self.log("\n📦 Testando Atualização de Caixinha...", "INFO")
        if not hasattr(self, "test_box_id") or not self.test_box_id:
            self.test_result("Atualizar Caixinha", False, "ID de caixinha não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            data = {"name": f"Test Box Updated {os.getpid()}"}
            response = self.session.patch(
                f"{self.api_base}/bau-mental/boxes/{self.test_box_id}/",
                json=data,
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                box_data = response.json()
                if "id" in box_data:
                    self.test_result("Atualizar Caixinha", True)
                    return True
                else:
                    self.test_result("Atualizar Caixinha", False, "Resposta não contém id")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Atualizar Caixinha",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Atualizar Caixinha", False, str(e))
            return False

    def test_notes_list(self):
        """Testa listagem de notas."""
        self.log("\n📝 Testando Listagem de Notas...", "INFO")
        if not self.access_token:
            self.test_result("Listar Notas", False, "Token não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            # Testar com diferentes filtros
            for filter_name, params in [
                ("sem filtros", {}),
                ("filtro inbox", {"inbox": "true"}),
                ("filtro status", {"status": "completed"}),
            ]:
                response = self.session.get(
                    f"{self.api_base}/bau-mental/notes/",
                    params=params,
                    headers=headers,
                    timeout=10,
                )
                if response.status_code == 200:
                    data = response.json()
                    notes = data if isinstance(data, list) else data.get("results", [])
                    self.log(
                        f"   ✅ {filter_name}: {len(notes)} notas encontradas",
                        "SUCCESS",
                    )
                else:
                    error_data = response.json() if response.content else {}
                    self.test_result(
                        f"Listar Notas ({filter_name})",
                        False,
                        f"Status {response.status_code}: {error_data}",
                    )
                    return False

            self.test_result("Listar Notas", True)
            return True
        except Exception as e:
            self.test_result("Listar Notas", False, str(e))
            return False

    def test_note_get(self):
        """Testa obtenção de nota."""
        self.log("\n📝 Testando Obter Nota...", "INFO")
        if not hasattr(self, "test_note_id") or not self.test_note_id:
            self.test_result("Obter Nota", False, "ID de nota não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            response = self.session.get(
                f"{self.api_base}/bau-mental/notes/{self.test_note_id}/",
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.test_result("Obter Nota", True)
                    return True
                else:
                    self.test_result("Obter Nota", False, "Resposta não contém id")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Obter Nota",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Obter Nota", False, str(e))
            return False

    def test_note_move(self):
        """Testa mover nota para caixinha."""
        self.log("\n📝 Testando Mover Nota...", "INFO")
        if not hasattr(self, "test_note_id") or not self.test_note_id:
            self.test_result("Mover Nota", False, "ID de nota não disponível")
            return False
        if not hasattr(self, "test_box_id") or not self.test_box_id:
            self.test_result("Mover Nota", False, "ID de caixinha não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            data = {"box_id": self.test_box_id}
            response = self.session.post(
                f"{self.api_base}/bau-mental/notes/{self.test_note_id}/move/",
                json=data,
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200:
                note_data = response.json()
                if "id" in note_data:
                    self.test_result("Mover Nota", True)
                    return True
                else:
                    self.test_result("Mover Nota", False, "Resposta não contém id")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Mover Nota",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Mover Nota", False, str(e))
            return False

    def test_box_delete(self):
        """Testa exclusão de caixinha."""
        self.log("\n📦 Testando Exclusão de Caixinha...", "INFO")
        if not hasattr(self, "test_box_id") or not self.test_box_id:
            self.test_result("Excluir Caixinha", False, "ID de caixinha não disponível")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "X-Workspace-ID": self.workspace_uuid or "",
            }
            response = self.session.delete(
                f"{self.api_base}/bau-mental/boxes/{self.test_box_id}/",
                headers=headers,
                timeout=10,
            )
            if response.status_code in [200, 204]:
                self.test_result("Excluir Caixinha", True)
                return True
            else:
                error_data = response.json() if response.content else {}
                self.test_result(
                    "Excluir Caixinha",
                    False,
                    f"Status {response.status_code}: {error_data}",
                )
                return False
        except Exception as e:
            self.test_result("Excluir Caixinha", False, str(e))
            return False

    def run_all_tests(self):
        """Executa todos os testes."""
        self.log("\n" + "=" * 60, "INFO")
        self.log("🧪 TESTE DE ENDPOINTS DO APP MOBILE", "INFO")
        self.log("=" * 60, "INFO")

        # Setup
        self.setup_test_data()

        # Health Check (não requer auth)
        self.test_health_check()

        # Autenticação
        self.test_register()
        if not self.test_login():
            self.log("\n❌ Login falhou. Abortando testes que requerem autenticação.", "ERROR")
            self.print_summary()
            return

        # Perfil
        self.test_profile()

        # Caixinhas
        self.test_boxes_list()
        self.test_box_create()
        self.test_box_get()
        self.test_box_update()

        # Notas
        self.test_notes_list()
        # Criar uma nota de teste para os outros testes
        self.create_test_note()
        if hasattr(self, "test_note_id"):
            self.test_note_get()
            self.test_note_move()

        # Limpeza
        self.test_box_delete()

        # Resumo
        self.print_summary()

    def create_test_note(self):
        """Cria uma nota de teste (sem upload de áudio)."""
        self.log("\n📝 Criando Nota de Teste...", "INFO")
        try:
            workspace = Workspace.objects.get(id=self.workspace_uuid)
            user = User.objects.get(email=self.user_email)
            note = Note.objects.create(
                workspace=workspace,
                transcript="Nota de teste criada pelo script de testes",
                processing_status="completed",
                source_type="memo",
            )
            self.test_note_id = str(note.id)
            self.log(f"   ✅ Nota criada: {self.test_note_id}", "SUCCESS")
        except Exception as e:
            self.log(f"   ❌ Erro ao criar nota: {e}", "ERROR")

    def print_summary(self):
        """Imprime resumo dos testes."""
        self.log("\n" + "=" * 60, "INFO")
        self.log("📊 RESUMO DOS TESTES", "INFO")
        self.log("=" * 60, "INFO")

        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["success"])
        failed = total - passed

        self.log(f"\nTotal de testes: {total}", "INFO")
        self.log(f"✅ Passou: {passed}", "SUCCESS")
        self.log(f"❌ Falhou: {failed}", "ERROR" if failed > 0 else "SUCCESS")

        if failed > 0:
            self.log("\n❌ Testes que falharam:", "ERROR")
            for result in self.test_results:
                if not result["success"]:
                    self.log(f"   - {result['name']}: {result['details']}", "ERROR")

        self.log("\n" + "=" * 60, "INFO")
        if failed == 0:
            self.log("🎉 TODOS OS TESTES PASSARAM!", "SUCCESS")
        else:
            self.log(f"⚠️  {failed} TESTE(S) FALHARAM", "WARNING")
        self.log("=" * 60, "INFO")


if __name__ == "__main__":
    tester = EndpointTester()
    tester.run_all_tests()

