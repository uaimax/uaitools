"""Management command para testar envio de email."""

import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import send_mail
from apps.accounts.models import User
from apps.accounts.services import send_password_reset_email, generate_password_reset_token

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Testa envio de email."""

    help = "Testa envio de email de reset de senha"

    def add_arguments(self, parser):
        """Adiciona argumentos ao comando."""
        parser.add_argument(
            "--email",
            type=str,
            help="Email do usuário para testar (opcional)",
        )

    def handle(self, *args, **options):
        """Executa o teste."""
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("Teste de Envio de Email"))
        self.stdout.write("=" * 60)

        # Verificar configuração
        self.stdout.write("\n📋 Configurações de Email:")
        self.stdout.write(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
        self.stdout.write(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"   EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(não configurado)'}")
        self.stdout.write(
            f"   EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else '(não configurado)'}"
        )
        self.stdout.write(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"   DEFAULT_FROM_NAME: {getattr(settings, 'DEFAULT_FROM_NAME', 'N/A')}")

        # Verificar se está configurado
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  EMAIL_HOST_USER ou EMAIL_HOST_PASSWORD não configurados!"
                )
            )
            self.stdout.write("   Configure no .env:")
            self.stdout.write("   EMAIL_HOST=smtp.example.com")
            self.stdout.write("   EMAIL_PORT=587")
            self.stdout.write("   EMAIL_USE_TLS=True")
            self.stdout.write("   EMAIL_HOST_USER=seu-usuario@example.com")
            self.stdout.write("   EMAIL_HOST_PASSWORD=sua-senha")
            return

        # Buscar usuário
        email = options.get("email")
        if email:
            try:
                user = User.objects.get(email=email, is_active=True)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"\n❌ Usuário com email {email} não encontrado ou inativo.")
                )
                return
        else:
            user = User.objects.filter(is_active=True).first()
            if not user:
                self.stdout.write(
                    self.style.WARNING("\n⚠️  Nenhum usuário ativo encontrado no banco.")
                )
                self.stdout.write("   Crie um usuário primeiro ou use: python manage.py seed")
                return

        self.stdout.write(f"\n📧 Testando envio para: {user.email}")

        # Teste 1: Email simples
        self.stdout.write("\n" + "-" * 60)
        self.stdout.write("Teste 1: Email Simples")
        self.stdout.write("-" * 60)
        try:
            send_mail(
                subject="Teste de Email - SaaS Bootstrap",
                message="Este é um email de teste do sistema.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS("✅ Email simples enviado com sucesso!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Erro ao enviar email simples: {e}"))
            self.stdout.write(f"   Tipo: {type(e).__name__}")
            import traceback

            self.stdout.write(traceback.format_exc())
            return

        # Teste 2: Email de reset de senha
        self.stdout.write("\n" + "-" * 60)
        self.stdout.write("Teste 2: Email de Reset de Senha")
        self.stdout.write("-" * 60)
        try:
            # Gerar token
            token = generate_password_reset_token(user)
            self.stdout.write(f"   Token gerado: {token.token}")

            # Enviar email
            send_password_reset_email(user, token, request=None)
            self.stdout.write(
                self.style.SUCCESS("✅ Email de reset de senha enviado com sucesso!")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Erro ao enviar email de reset: {e}")
            )
            self.stdout.write(f"   Tipo: {type(e).__name__}")
            import traceback

            self.stdout.write(traceback.format_exc())
            return

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ Todos os testes passaram!"))
        self.stdout.write("=" * 60)
        self.stdout.write(
            f"\n💡 Verifique a caixa de entrada (e spam) do email: {user.email}"
        )


