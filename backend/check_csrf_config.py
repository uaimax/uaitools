#!/usr/bin/env python
"""Script para verificar configuração de CSRF.

Uso:
    python check_csrf_config.py
"""

import os
import sys
import django
from pathlib import Path

# Adiciona o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings

print("=" * 60)
print("🔍 Diagnóstico de Configuração CSRF")
print("=" * 60)

print("\n📋 Variáveis de Ambiente:")
print(f"  CSRF_TRUSTED_ORIGINS (env): '{os.environ.get('CSRF_TRUSTED_ORIGINS', 'NÃO CONFIGURADO')}'")
print(f"  ALLOWED_HOSTS (env): '{os.environ.get('ALLOWED_HOSTS', 'NÃO CONFIGURADO')}'")
print(f"  DEBUG (env): '{os.environ.get('DEBUG', 'NÃO CONFIGURADO')}'")

print("\n⚙️ Configuração Django:")
print(f"  CSRF_TRUSTED_ORIGINS: {settings.CSRF_TRUSTED_ORIGINS}")
print(f"  ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"  DEBUG: {settings.DEBUG}")

print("\n🔒 Configurações de Segurança:")
print(f"  CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE}")
print(f"  SESSION_COOKIE_SECURE: {settings.SESSION_COOKIE_SECURE}")
print(f"  SECURE_SSL_REDIRECT: {getattr(settings, 'SECURE_SSL_REDIRECT', 'N/A')}")

print("\n🌐 Admin URL:")
print(f"  ADMIN_URL_PREFIX: {getattr(settings, 'ADMIN_URL_PREFIX', 'manage')}")
print(f"  Admin URL: /{getattr(settings, 'ADMIN_URL_PREFIX', 'manage')}/")

print("\n✅ Verificações:")
issues = []

if not settings.CSRF_TRUSTED_ORIGINS:
    issues.append("❌ CSRF_TRUSTED_ORIGINS está vazio!")
else:
    print(f"  ✅ CSRF_TRUSTED_ORIGINS configurado: {len(settings.CSRF_TRUSTED_ORIGINS)} origem(ns)")

if not settings.ALLOWED_HOSTS:
    issues.append("❌ ALLOWED_HOSTS está vazio!")
else:
    print(f"  ✅ ALLOWED_HOSTS configurado: {len(settings.ALLOWED_HOSTS)} host(s)")

# Verificar se a origem esperada está na lista
expected_origin = "https://ut-be.app.webmaxdigital.com"
if expected_origin in settings.CSRF_TRUSTED_ORIGINS:
    print(f"  ✅ Origem esperada '{expected_origin}' está em CSRF_TRUSTED_ORIGINS")
else:
    issues.append(f"❌ Origem esperada '{expected_origin}' NÃO está em CSRF_TRUSTED_ORIGINS")
    print(f"  ❌ Origem esperada '{expected_origin}' NÃO está em CSRF_TRUSTED_ORIGINS")
    print(f"     Origens configuradas: {settings.CSRF_TRUSTED_ORIGINS}")

if issues:
    print("\n⚠️ Problemas Encontrados:")
    for issue in issues:
        print(f"  {issue}")
    print("\n💡 Solução:")
    print("  1. Verifique se CSRF_TRUSTED_ORIGINS está configurado no CapRover")
    print("  2. Formato correto: CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com")
    print("  3. Sem espaços extras, sem barra no final")
    print("  4. Faça redeploy após configurar")
else:
    print("\n✅ Configuração parece correta!")

print("\n" + "=" * 60)

