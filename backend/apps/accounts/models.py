"""Models for accounts app - Workspace and User."""

import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import UUIDPrimaryKeyMixin, WorkspaceModel


class UserManager(BaseUserManager):
    """Manager customizado para User com email como USERNAME_FIELD."""

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        """Cria e salva um usuário com email e senha."""
        if not email:
            raise ValueError("O email é obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        """Cria e salva um superusuário com email e senha."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser deve ter is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser deve ter is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

    def _create_user(self, email: str, password: str | None = None, **extra_fields):
        """Método privado para criar usuário (compatibilidade com BaseUserManager)."""
        if not email:
            raise ValueError("O email é obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Workspace(UUIDPrimaryKeyMixin, models.Model):
    """Modelo de workspace para multi-tenancy."""

    # Campos básicos
    name = models.CharField(max_length=255, verbose_name=_("Nome"))
    slug = models.SlugField(unique=True, verbose_name=_("Slug"))
    is_active = models.BooleanField(default=True, verbose_name=_("Ativo"))

    # Dados da empresa
    legal_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Razão Social"),
        help_text=_("Nome completo/razão social da empresa"),
    )
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        blank=True,
        null=True,
        verbose_name=_("CNPJ"),
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Endereço Completo"),
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Cidade"),
    )
    state = models.CharField(
        max_length=2,
        blank=True,
        null=True,
        verbose_name=_("Estado (UF)"),
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Telefone"),
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name=_("E-mail de Contato"),
    )
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name=_("Site"),
    )

    # DPO (Encarregado de Proteção de Dados)
    dpo_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Nome do DPO"),
    )
    dpo_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name=_("E-mail do DPO"),
    )
    dpo_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Telefone do DPO"),
    )
    dpo_address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Endereço do DPO"),
    )

    # Horário de atendimento
    support_hours = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Horário de Atendimento"),
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Criado em"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Atualizado em"))

    class Meta:
        verbose_name = _("Workspace")
        verbose_name_plural = _("Workspaces")
        ordering = ["name"]

    def __str__(self) -> str:
        """Representação string do workspace."""
        return self.name


class Role(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Role com permissões string-based por workspace."""

    name = models.CharField(max_length=100, verbose_name=_("Nome"))
    description = models.TextField(blank=True, verbose_name=_("Descrição"))
    permissions = models.JSONField(
        default=list,
        verbose_name=_("Permissões"),
        help_text=_("Array de strings no formato 'module.action'"),
    )

    class Meta:
        verbose_name = _("Role")
        verbose_name_plural = _("Roles")
        unique_together = [["workspace", "name"]]
        ordering = ["name"]

    def __str__(self) -> str:
        """Representação string do role."""
        return f"{self.name} ({self.workspace.name})"


class User(UUIDPrimaryKeyMixin, AbstractUser):
    """User customizado com workspace_id e autenticação por email."""

    # Email é obrigatório e único
    email = models.EmailField(_("email address"), unique=True, blank=False, null=False)

    # Tornar username nullable e não único
    username = models.CharField(
        _("username"),
        max_length=150,
        blank=True,
        null=True,
        unique=False,
        help_text=_("Opcional. 150 caracteres ou menos. Letras, dígitos e @/./+/-/_ apenas."),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
        verbose_name=_("Workspace"),
    )
    roles = models.ManyToManyField(
        "Role",
        blank=True,
        related_name="users",
        verbose_name=_("Roles"),
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Criado em"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Atualizado em"))

    # Usar email como campo de autenticação
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]  # username removido dos required

    objects = UserManager()

    class Meta:
        verbose_name = _("Usuário")
        verbose_name_plural = _("Usuários")
        ordering = ["email"]

    def __str__(self) -> str:
        """Representação string do usuário."""
        return f"{self.email} ({self.workspace.name if self.workspace else 'Sem workspace'})"

    def get_permissions(self, workspace=None) -> list[str]:
        """Retorna array de permissões do usuário.

        Se workspace fornecido, retorna permissões apenas daquele workspace.
        Se não fornecido, retorna permissões do workspace do usuário.
        Superusers retornam ['*'] (todas as permissões).

        Args:
            workspace: Workspace opcional para filtrar permissões

        Returns:
            Lista de strings com permissões do usuário
        """
        if self.is_superuser:
            return ["*"]  # Wildcard para todas as permissões

        target_workspace = workspace or self.workspace
        if not target_workspace:
            return []

        # Buscar roles do usuário no workspace
        user_roles = self.roles.filter(workspace=target_workspace)

        # Coletar todas as permissões (remover duplicatas)
        all_permissions = set()
        for role in user_roles:
            all_permissions.update(role.permissions or [])

        return sorted(list(all_permissions))


class LegalDocument(models.Model):
    """Modelo para documentos legais editáveis globais do SaaS (Termos e Política de Privacidade).

    Todos os documentos legais são globais do sistema, não específicos por empresa.
    """

    DOCUMENT_TYPES = [
        ("terms", _("Termos e Condições")),
        ("privacy", _("Política de Privacidade")),
    ]

    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES,
        verbose_name=_("Tipo de Documento"),
    )
    content = models.TextField(
        verbose_name=_("Conteúdo"),
        help_text=_("Template com variáveis [VARIAVEL] ou {{variavel}} que serão substituídas por valores do SaaS."),
    )
    version = models.IntegerField(
        default=1,
        verbose_name=_("Versão"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Ativo"),
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Última Atualização"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Criado em"),
    )

    class Meta:
        verbose_name = _("Documento Legal")
        verbose_name_plural = _("Documentos Legais")
        unique_together = [["document_type", "version"]]
        ordering = ["-version", "-created_at"]
        indexes = [
            models.Index(fields=["document_type", "is_active"]),
        ]

    def __str__(self) -> str:
        """Representação string do documento."""
        return f"{self.get_document_type_display()} (v{self.version})"


class LegalDocumentAcceptance(models.Model):
    """Rastreamento de aceitação de documentos legais por usuários.

    Armazena qual versão de cada documento legal foi aceita por cada usuário,
    incluindo data/hora, IP e User-Agent para compliance LGPD/GDPR.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="legal_acceptances",
        verbose_name=_("Usuário"),
    )
    document = models.ForeignKey(
        LegalDocument,
        on_delete=models.CASCADE,
        related_name="acceptances",
        verbose_name=_("Documento"),
    )
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="legal_acceptances",
        verbose_name=_("Workspace"),
        null=True,
        blank=True,
        help_text=_("Workspace do usuário (pode ser None se usuário não tiver workspace ou documento for global)."),
    )
    accepted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Aceito em"),
        db_index=True,
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("Endereço IP"),
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        verbose_name=_("User Agent"),
        max_length=500,
    )

    class Meta:
        verbose_name = _("Aceitação de Documento Legal")
        verbose_name_plural = _("Aceitações de Documentos Legais")
        ordering = ["-accepted_at"]
        indexes = [
            models.Index(fields=["user", "accepted_at"]),
            models.Index(fields=["workspace", "accepted_at"]),
            models.Index(fields=["document", "accepted_at"]),
        ]
        # Um usuário pode aceitar múltiplas versões do mesmo documento
        # (quando há atualizações), mas não pode aceitar a mesma versão duas vezes
        unique_together = [["user", "document"]]

    def __str__(self) -> str:
        """Representação string da aceitação."""
        return f"{self.user.email} aceitou {self.document.get_document_type_display()} v{self.document.version} em {self.accepted_at.strftime('%d/%m/%Y %H:%M')}"


class PasswordResetToken(UUIDPrimaryKeyMixin, models.Model):
    """Token para reset de senha com expiração e uso único.

    Nota: Não herda de WorkspaceModel porque reset de senha é uma operação global,
    não específica de workspace. Alguns usuários podem não ter workspace.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name=_("Usuário"),
    )
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        null=True,
        blank=True,
        verbose_name=_("Workspace"),
        help_text=_("Workspace do usuário (opcional, pode ser None)"),
    )
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        verbose_name=_("Token"),
        help_text=_("Token único para reset de senha"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Criado em"),
        db_index=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Atualizado em"),
    )
    expires_at = models.DateTimeField(
        verbose_name=_("Expira em"),
        db_index=True,
    )
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Usado em"),
        help_text=_("Data/hora em que o token foi usado para resetar a senha"),
    )

    class Meta:
        verbose_name = _("Token de Reset de Senha")
        verbose_name_plural = _("Tokens de Reset de Senha")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token", "used_at"]),
            models.Index(fields=["user", "used_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self) -> str:
        """Representação string do token."""
        status = "usado" if self.used_at else ("expirado" if self.is_expired() else "válido")
        return f"Token para {self.user.email} ({status})"

    def is_valid(self) -> bool:
        """Verifica se o token é válido (não usado e não expirado)."""
        if self.used_at is not None:
            return False
        return not self.is_expired()

    def is_expired(self) -> bool:
        """Verifica se o token expirou."""
        return timezone.now() > self.expires_at

    def mark_as_used(self) -> None:
        """Marca o token como usado."""
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    def save(self, *args, **kwargs) -> None:
        """Sobrescreve save para definir expires_at automaticamente se não fornecido."""
        if not self.expires_at:
            expiration_hours = getattr(
                settings,
                "PASSWORD_RESET_TOKEN_EXPIRATION_HOURS",
                24,
            )
            self.expires_at = timezone.now() + timedelta(hours=expiration_hours)
        super().save(*args, **kwargs)

