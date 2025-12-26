#!/usr/bin/env python3
"""Script para testar a API do GlitchTip e listar os últimos issues."""

import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Carregar .env da raiz do projeto
project_root = Path(__file__).resolve().parent.parent
env_file = project_root / ".env"
if env_file.exists():
    load_dotenv(env_file)
    print(f"✅ Carregado .env de: {env_file}")

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.conf import settings
from apps.core.services.glitchtip_client import get_glitchtip_errors, parse_dsn

def main():
    """Testa a busca de erros do GlitchTip."""
    print("=" * 60)
    print("Teste de API do GlitchTip/Sentry")
    print("=" * 60)
    print()

    # Verificar configuração
    print("📋 Verificando configuração...")
    print(f"  USE_SENTRY: {getattr(settings, 'USE_SENTRY', False)}")
    print(f"  SENTRY_DSN: {getattr(settings, 'SENTRY_DSN', '')[:50]}...")
    print(f"  SENTRY_API_TOKEN: {'✅ Configurado' if getattr(settings, 'SENTRY_API_TOKEN', '') else '❌ Não configurado'}")
    print()

    if not getattr(settings, 'USE_SENTRY', False):
        print("❌ USE_SENTRY não está habilitado!")
        return

    if not getattr(settings, 'SENTRY_DSN', ''):
        print("❌ SENTRY_DSN não está configurado!")
        return

    # Parse do DSN
    dsn_info = parse_dsn(getattr(settings, 'SENTRY_DSN', ''))
    print("🔍 Informações extraídas do DSN:")
    print(f"  URL Base: {dsn_info['base_url']}")
    print(f"  Project ID: {dsn_info['project_id']}")
    print(f"  Public Key: {dsn_info['public_key'][:20]}..." if dsn_info['public_key'] else "  Public Key: Não encontrado")
    print()

    # Buscar erros
    print("🔎 Buscando últimos erros do GlitchTip...")
    print()

    try:
        result = get_glitchtip_errors(limit=20, stats_period="24h")

        print("✅ Sucesso!")
        print()
        print("=" * 60)
        print(f"📊 Total de erros encontrados: {result['count']}")
        print("=" * 60)
        print()

        if result['count'] == 0:
            print("ℹ️  Nenhum erro encontrado no período de 24h.")
            return

        # Listar erros
        print("📋 Lista de erros:")
        print()

        for idx, issue in enumerate(result['results'], 1):
            print(f"{idx}. Issue ID: {issue.get('id', 'N/A')}")
            print(f"   Título: {issue.get('title', 'N/A')}")
            print(f"   Nível: {issue.get('level', 'N/A')}")
            print(f"   Status: {issue.get('status', 'N/A')}")
            print(f"   Contagem: {issue.get('count', 'N/A')}")
            print(f"   Última ocorrência: {issue.get('lastSeen', 'N/A')}")
            print(f"   Primeira ocorrência: {issue.get('firstSeen', 'N/A')}")

            # Tags
            tags = issue.get('tags', [])
            if tags:
                tag_str = ', '.join([f"{t.get('key', '')}={t.get('value', '')}" for t in tags[:5]])
                print(f"   Tags: {tag_str}")

            # Culprit (arquivo/linha que causou o erro)
            culprit = issue.get('culprit')
            if culprit:
                print(f"   Culprit: {culprit}")

            print()

        print("=" * 60)
        print("✅ Teste concluído com sucesso!")

    except ValueError as e:
        print(f"❌ Erro de configuração: {e}")
    except Exception as e:
        print(f"❌ Erro ao buscar erros: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

