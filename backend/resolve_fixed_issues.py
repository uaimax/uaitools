#!/usr/bin/env python
"""Script para marcar issues do GlitchTip que já foram corrigidos no código.

Este script marca issues específicos que foram identificados e corrigidos.
"""

import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.core.services.glitchtip_client import resolve_glitchtip_issue

# Lista de issues que foram corrigidos no código
RESOLVED_ISSUES = [
    # Issues relacionados a modelos antigos removidos
    "4567995",  # ImportError: DividendHistory (admin.py) - CORRIGIDO: modelo removido, admin.py atualizado
    "4567972",  # ImportError: DividendHistory (admin.py) - CORRIGIDO: modelo removido, admin.py atualizado
    "4571218",  # ImportError: Asset - CORRIGIDO: models.py restaurado
    "4568210",  # IntegrityError: slug UNIQUE - CORRIGIDO: unique_together adicionado
    "4568209",  # ImportError: Workspace from apps.core.models - CORRIGIDO: import corrigido
    "4568193",  # KeyError: dividendhistory - CORRIGIDO: modelo removido nas migrations
    "4568169",  # FieldDoesNotExist: PortfolioSnapshot - CORRIGIDO: modelo removido
    "4568168",  # NameError: StrategyTemplate - CORRIGIDO: import adicionado
    "4568062",  # ModuleNotFoundError: investment_advisor - CORRIGIDO: serviço removido, __init__.py atualizado
    "4568060",  # NameError: MarketPriceHistory - CORRIGIDO: modelo removido
    "4568059",  # NameError: Recommendation - CORRIGIDO: modelo removido
    "4568058",  # NameError: Strategy - CORRIGIDO: modelo removido
    "4568047",  # ImportError: MarketPriceHistory (serializers.py) - CORRIGIDO: modelo removido
    "4568045",  # ImportError: MarketPriceHistory (viewsets.py) - CORRIGIDO: modelo removido
]


def main():
    """Marca issues resolvidos como resolvidos no GlitchTip."""
    print("🔧 Marcando issues corrigidos como resolvidos no GlitchTip...")
    print(f"Total de issues a marcar: {len(RESOLVED_ISSUES)}\n")

    resolved_count = 0
    failed_count = 0
    failed_issues = []

    for issue_id in RESOLVED_ISSUES:
        try:
            result = resolve_glitchtip_issue(issue_id)
            resolved_count += 1
            status = result.get("status", "unknown")
            print(f"✅ {issue_id} - Status: {status}")
        except ValueError as e:
            # Erro de configuração (DSN, token, etc.)
            print(f"⚠️  {issue_id} - Erro de configuração: {str(e)}")
            print("   Configure USE_SENTRY=true, SENTRY_DSN e SENTRY_API_TOKEN no .env")
            failed_count += 1
            failed_issues.append(issue_id)
        except Exception as e:
            failed_count += 1
            failed_issues.append(issue_id)
            print(f"❌ {issue_id} - Erro: {str(e)}")

    print(f"\n📊 Resumo:")
    print(f"   ✅ {resolved_count} issues marcados como resolvidos")
    if failed_count > 0:
        print(f"   ❌ {failed_count} issues falharam")
        print(f"   Issues que falharam: {', '.join(failed_issues)}")
        print("\n💡 Dica: Verifique se USE_SENTRY, SENTRY_DSN e SENTRY_API_TOKEN estão configurados no .env")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


