#!/usr/bin/env python
"""Script de diagnóstico CSRF para produção.

Uso:
    python diagnose_csrf.py
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

print("=" * 70)
print("🔍 DIAGNÓSTICO CSRF - PRODUÇÃO")
print("=" * 70)

print("\n📋 Variáveis de Ambiente:")
csrf_env = os.environ.get("CSRF_TRUSTED_ORIGINS", "NÃO CONFIGURADO")
allowed_hosts_env = os.environ.get("ALLOWED_HOSTS", "NÃO CONFIGURADO")
print(f"  CSRF_TRUSTED_ORIGINS (env): '{csrf_env}'")
print(f"  ALLOWED_HOSTS (env): '{allowed_hosts_env}'")
print(f"  ENVIRONMENT (env): '{os.environ.get('ENVIRONMENT', 'NÃO CONFIGURADO')}'")
print(f"  DEBUG (env): '{os.environ.get('DEBUG', 'NÃO CONFIGURADO')}'")

print("\n⚙️ Configuração Django:")
print(f"  CSRF_TRUSTED_ORIGINS: {settings.CSRF_TRUSTED_ORIGINS}")
print(f"  ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"  DEBUG: {settings.DEBUG}")

print("\n🔒 Configurações CSRF:")
print(f"  CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE}")
print(f"  CSRF_COOKIE_SAMESITE: {getattr(settings, 'CSRF_COOKIE_SAMESITE', 'N/A')}")
print(f"  CSRF_USE_SESSIONS: {getattr(settings, 'CSRF_USE_SESSIONS', 'N/A')}")

print("\n🌐 Verificação de Origem:")
expected_origin = "https://ut-be.app.webmaxdigital.com"
print(f"  Origem esperada: {expected_origin}")
print(f"  Está em CSRF_TRUSTED_ORIGINS? {expected_origin in settings.CSRF_TRUSTED_ORIGINS}")

# Verificar variações
print("\n🔍 Variações da origem:")
variations = [
    expected_origin,
    expected_origin + "/",
    expected_origin.lower(),
    expected_origin.upper(),
]
for var in variations:
    in_list = var in settings.CSRF_TRUSTED_ORIGINS
    print(f"  '{var}': {'✅' if in_list else '❌'}")

print("\n📊 Lista completa de CSRF_TRUSTED_ORIGINS:")
if settings.CSRF_TRUSTED_ORIGINS:
    for i, origin in enumerate(settings.CSRF_TRUSTED_ORIGINS, 1):
        print(f"  {i}. '{origin}' (len={len(origin)}, repr={repr(origin)})")
else:
    print("  ⚠️  Lista vazia!")

print("\n✅ Verificações:")
issues = []

if not settings.CSRF_TRUSTED_ORIGINS:
    issues.append("❌ CSRF_TRUSTED_ORIGINS está vazio!")
else:
    print(f"  ✅ CSRF_TRUSTED_ORIGINS configurado: {len(settings.CSRF_TRUSTED_ORIGINS)} origem(ns)")

if expected_origin not in settings.CSRF_TRUSTED_ORIGINS:
    issues.append(f"❌ Origem esperada '{expected_origin}' NÃO está em CSRF_TRUSTED_ORIGINS!")
    print(f"  ⚠️  Origem esperada não encontrada na lista")
    print(f"  💡 Verifique se há espaços extras ou diferenças de case")
else:
    print(f"  ✅ Origem esperada encontrada na lista")

if not settings.ALLOWED_HOSTS:
    issues.append("❌ ALLOWED_HOSTS está vazio!")
elif "*" in settings.ALLOWED_HOSTS:
    print(f"  ⚠️  ALLOWED_HOSTS contém wildcard '*' (menos seguro)")
else:
    print(f"  ✅ ALLOWED_HOSTS configurado: {len(settings.ALLOWED_HOSTS)} host(s)")

if issues:
    print("\n❌ PROBLEMAS ENCONTRADOS:")
    for issue in issues:
        print(f"  {issue}")
    print("\n💡 SOLUÇÕES:")
    print("  1. Verifique se CSRF_TRUSTED_ORIGINS está configurado corretamente no CapRover")
    print("  2. Formato correto: CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com")
    print("  3. Sem espaços extras, sem trailing slash")
    print("  4. Faça redeploy após alterar variáveis de ambiente")
    sys.exit(1)
else:
    print("\n✅ Tudo configurado corretamente!")
    sys.exit(0)

