"""Comando para popular dados de exemplo no banco de dados.

Este comando cria tenants, usuários e leads de exemplo para desenvolvimento
e demonstração do sistema.

Uso:
    python manage.py seed
    python manage.py seed --clear  # Limpa dados existentes antes de criar
    python manage.py seed --tenants 3  # Cria 3 tenants
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import Workspace, Role
from apps.leads.models import Lead

User = get_user_model()


class Command(BaseCommand):
    """Comando para popular dados de exemplo."""

    help = "Popula o banco de dados com dados de exemplo (workspaces, users, leads)"

    def add_arguments(self, parser) -> None:
        """Adiciona argumentos ao comando."""
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Limpa dados existentes antes de criar novos",
        )
        parser.add_argument(
            "--workspaces",
            type=int,
            default=3,
            help="Número de workspaces a criar (padrão: 3)",
        )
        parser.add_argument(
            "--users-per-workspace",
            type=int,
            default=2,
            help="Número de usuários por workspace (padrão: 2)",
        )
        parser.add_argument(
            "--leads-per-workspace",
            type=int,
            default=5,
            help="Número de leads por workspace (padrão: 5)",
        )

    def handle(self, *args, **options) -> None:
        """Executa o comando de seed."""
        clear = options["clear"]
        num_workspaces = options.get("workspaces", options.get("tenants", 3))  # Compatibilidade
        users_per_workspace = options.get("users_per_workspace", options.get("users_per_tenant", 2))  # Compatibilidade
        leads_per_workspace = options.get("leads_per_workspace", options.get("leads_per_tenant", 5))  # Compatibilidade

        if clear:
            self.stdout.write(self.style.WARNING("Limpando dados existentes..."))
            Lead.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Role.objects.all().delete()
            Workspace.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Dados limpos com sucesso!"))

        with transaction.atomic():
            self._create_workspaces(num_workspaces, users_per_workspace, leads_per_workspace)

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Seed concluído com sucesso!\n"
                f"   - {num_workspaces} workspace(s) criado(s)\n"
                f"   - {num_workspaces * 3} role(s) criado(s) (Admin, Editor, Viewer por workspace)\n"
                f"   - {num_workspaces * users_per_workspace} usuário(s) criado(s)\n"
                f"   - {num_workspaces * leads_per_workspace} lead(s) criado(s)"
            )
        )

    def _create_workspaces(
        self, num_workspaces: int, users_per_workspace: int, leads_per_workspace: int
    ) -> None:
        """Cria workspaces com usuários e leads."""
        workspace_data = [
            {
                "name": "Acme Corporation",
                "slug": "acme",
            },
            {
                "name": "TechStart Solutions",
                "slug": "techstart",
            },
            {
                "name": "Global Services",
                "slug": "global",
            },
        ]

        for i in range(num_workspaces):
            workspace_info = workspace_data[i % len(workspace_data)]
            # Se pedir mais workspaces que temos dados, criar genéricos
            if i >= len(workspace_data):
                workspace_info = {
                    "name": f"Workspace {i+1}",
                    "slug": f"workspace-{i+1}",
                }

            workspace, created = Workspace.objects.get_or_create(
                slug=workspace_info["slug"],
                defaults={
                    "name": workspace_info["name"],
                    "is_active": True,
                },
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Workspace criado: {workspace.name} ({workspace.slug})")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"⚠️  Workspace já existe: {workspace.name} ({workspace.slug})")
                )

            # Criar roles padrão para o workspace
            self._create_default_roles_for_workspace(workspace)

            # Criar usuários para o workspace
            self._create_users_for_workspace(workspace, users_per_workspace)

            # Criar leads para o workspace
            self._create_leads_for_workspace(workspace, leads_per_workspace)

    def _create_default_roles_for_workspace(self, workspace: Workspace) -> None:
        """Cria roles padrão para um workspace."""
        default_roles = [
            {
                "name": "Admin",
                "description": "Administrador com todas as permissões",
                "permissions": ["*"],  # Todas as permissões
            },
            {
                "name": "Editor",
                "description": "Editor com permissões de criar e editar",
                "permissions": ["leads.view", "leads.create", "leads.update"],
            },
            {
                "name": "Viewer",
                "description": "Visualizador com permissões apenas de leitura",
                "permissions": ["leads.view"],
            },
        ]

        for role_info in default_roles:
            role, created = Role.objects.get_or_create(
                workspace=workspace,
                name=role_info["name"],
                defaults={
                    "description": role_info["description"],
                    "permissions": role_info["permissions"],
                },
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"   ✅ Role criado: {role.name} ({len(role.permissions)} permissões)")
                )
            else:
                # Atualizar permissões se role já existe
                role.permissions = role_info["permissions"]
                role.description = role_info["description"]
                role.save()
                self.stdout.write(
                    self.style.WARNING(f"   ⚠️  Role já existe: {role.name} (atualizado)")
                )

    def _create_users_for_workspace(self, workspace: Workspace, num_users: int) -> None:
        """Cria usuários para um workspace."""
        user_data = [
            {
                "email": f"admin@{workspace.slug}.com",
                "first_name": "Admin",
                "last_name": workspace.name.split()[0],
                "password": "admin123",
            },
            {
                "email": f"user@{workspace.slug}.com",
                "first_name": "Usuário",
                "last_name": workspace.name.split()[0],
                "password": "user123",
            },
        ]

        for i in range(num_users):
            user_info = user_data[i % len(user_data)]
            user, created = User.objects.get_or_create(
                email=user_info["email"],
                defaults={
                    "first_name": user_info["first_name"],
                    "last_name": user_info["last_name"],
                    "workspace": workspace,
                    "is_active": True,
                },
            )

            if created:
                user.set_password(user_info["password"])
                user.save()

                # Atribuir role padrão baseado no tipo de usuário
                if "admin" in user_info["email"]:
                    # Admin recebe role Admin
                    admin_role = Role.objects.filter(workspace=workspace, name="Admin").first()
                    if admin_role:
                        user.roles.add(admin_role)
                else:
                    # Outros usuários recebem role Viewer
                    viewer_role = Role.objects.filter(workspace=workspace, name="Viewer").first()
                    if viewer_role:
                        user.roles.add(viewer_role)

                self.stdout.write(
                    self.style.SUCCESS(
                        f"   ✅ Usuário criado: {user.email} (senha: {user_info['password']})"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"   ⚠️  Usuário já existe: {user.email}")
                )

    def _create_leads_for_workspace(self, workspace: Workspace, num_leads: int) -> None:
        """Cria leads para um workspace."""
        lead_data = [
            {
                "name": "João Silva",
                "email": "joao.silva@example.com",
                "phone": "+55 11 98765-4321",
                "client_workspace": "Workspace A",
                "status": "new",
                "source": "website",
            },
            {
                "name": "Maria Santos",
                "email": "maria.santos@example.com",
                "phone": "+55 11 98765-4322",
                "client_workspace": "Workspace B",
                "status": "contacted",
                "source": "referral",
            },
            {
                "name": "Pedro Oliveira",
                "email": "pedro.oliveira@example.com",
                "phone": "+55 11 98765-4323",
                "client_workspace": "Workspace C",
                "status": "qualified",
                "source": "social",
            },
            {
                "name": "Ana Costa",
                "email": "ana.costa@example.com",
                "phone": "+55 11 98765-4324",
                "client_workspace": "Workspace D",
                "status": "converted",
                "source": "website",
            },
            {
                "name": "Carlos Ferreira",
                "email": "carlos.ferreira@example.com",
                "phone": "+55 11 98765-4325",
                "client_workspace": "Workspace E",
                "status": "lost",
                "source": "email",
            },
        ]

        for i in range(num_leads):
            lead_info = lead_data[i % len(lead_data)]
            # Adicionar sufixo para evitar duplicatas
            unique_email = f"{i+1}-{lead_info['email']}"
            unique_name = f"{lead_info['name']} {i+1}"

            lead, created = Lead.objects.get_or_create(
                workspace=workspace,
                email=unique_email,
                defaults={
                    "name": unique_name,
                    "phone": lead_info["phone"],
                    "client_workspace": lead_info["client_workspace"],
                    "status": lead_info["status"],
                    "source": lead_info["source"],
                    "notes": f"Lead de exemplo criado via seed para {workspace.name}",
                },
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"   ✅ Lead criado: {lead.name} ({lead.status})")
                )

