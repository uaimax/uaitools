#!/usr/bin/env python3
"""Script para testar envio de email."""

import os
import sys
import django
from pathlib import Path

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

django.setup()

from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from apps.accounts.models import User
from apps.accounts.services import send_password_reset_email, generate_password_reset_token

def test_email_config():
    """Testa configuração de email."""
    print("=" * 60)
    print("Teste de Configuração de Email")
    print("=" * 60)

    print("\n📋 Configurações de Email:")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"   EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(não configurado)'}")
    print(f"   EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else '(não configurado)'}")
    print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"   DEFAULT_FROM_NAME: {getattr(settings, 'DEFAULT_FROM_NAME', 'N/A')}")

    # Verificar se está configurado
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("\n⚠️  EMAIL_HOST_USER ou EMAIL_HOST_PASSWORD não configurados!")
        print("   Configure no .env:")
        print("   EMAIL_HOST=smtp.example.com")
        print("   EMAIL_PORT=587")
        print("   EMAIL_USE_TLS=True")
        print("   EMAIL_HOST_USER=seu-usuario@example.com")
        print("   EMAIL_HOST_PASSWORD=sua-senha")
        return False

    return True

def test_simple_email():
    """Testa envio de email simples."""
    print("\n" + "=" * 60)
    print("Teste 1: Envio de Email Simples")
    print("=" * 60)

    try:
        send_mail(
            subject="Teste de Email - SaaS Bootstrap",
            message="Este é um email de teste.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["test@example.com"],  # Substitua por um email real para testar
            fail_silently=False,
        )
        print("✅ Email enviado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")
        print(f"   Tipo: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

def test_password_reset_email():
    """Testa envio de email de reset de senha."""
    print("\n" + "=" * 60)
    print("Teste 2: Email de Reset de Senha")
    print("=" * 60)

    # Buscar um usuário existente
    try:
        user = User.objects.filter(is_active=True).first()
        if not user:
            print("⚠️  Nenhum usuário ativo encontrado no banco.")
            print("   Crie um usuário primeiro ou use: python manage.py seed")
            return False

        print(f"📧 Enviando email para: {user.email}")

        # Gerar token
        token = generate_password_reset_token(user)
        print(f"   Token gerado: {token.token}")

        # Enviar email
        send_password_reset_email(user, token, request=None)
        print("✅ Email de reset de senha enviado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email de reset: {e}")
        print(f"   Tipo: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🔍 Verificando configuração...")
    if not test_email_config():
        sys.exit(1)

    print("\n📤 Testando envio de emails...")

    # Teste 1: Email simples
    # test_simple_email()  # Descomente e configure email real para testar

    # Teste 2: Email de reset
    if test_password_reset_email():
        print("\n✅ Todos os testes passaram!")
    else:
        print("\n❌ Alguns testes falharam.")
        sys.exit(1)


