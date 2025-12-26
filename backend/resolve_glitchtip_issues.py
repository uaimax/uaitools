#!/usr/bin/env python
"""Script para marcar issues do GlitchTip como resolvidos.

Uso:
    python resolve_glitchtip_issues.py
    python resolve_glitchtip_issues.py --issue-id 4556399
    python resolve_glitchtip_issues.py --all
"""

import os
import sys
import django
import argparse

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.core.services.glitchtip_client import (
    get_glitchtip_errors,
    resolve_glitchtip_issue,
)


def main():
    """Função principal."""
    parser = argparse.ArgumentParser(description="Marcar issues do GlitchTip como resolvidos")
    parser.add_argument(
        "--issue-id",
        type=str,
        help="ID do issue específico para marcar como resolvido",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Marcar todos os issues não resolvidos como resolvidos",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Apenas mostrar o que seria feito, sem executar",
    )

    args = parser.parse_args()

    if not args.issue_id and not args.all:
        parser.print_help()
        sys.exit(1)

    try:
        if args.issue_id:
            # Marcar issue específico
            if args.dry_run:
                print(f"[DRY RUN] Marcaria issue {args.issue_id} como resolvido")
            else:
                result = resolve_glitchtip_issue(args.issue_id)
                print(f"✅ Issue {args.issue_id} marcado como resolvido")
                print(f"   Status: {result.get('status', 'unknown')}")

        elif args.all:
            # Buscar todos os issues não resolvidos
            print("Buscando issues não resolvidos...")
            result = get_glitchtip_errors(limit=100, query="is:unresolved")
            issues = result.get("results", [])

            if not issues:
                print("✅ Nenhum issue não resolvido encontrado")
                return

            print(f"Encontrados {len(issues)} issues não resolvidos")

            if args.dry_run:
                print("\n[DRY RUN] Os seguintes issues seriam marcados como resolvidos:")
                for issue in issues:
                    issue_id = issue.get("id")
                    title = issue.get("title", "Sem título")
                    count = issue.get("count", 0)
                    print(f"  - {issue_id}: {title} ({count} ocorrências)")
            else:
                # Marcar todos como resolvidos
                resolved_count = 0
                failed_count = 0

                for issue in issues:
                    issue_id = issue.get("id")
                    title = issue.get("title", "Sem título")

                    try:
                        resolve_glitchtip_issue(str(issue_id))
                        resolved_count += 1
                        print(f"✅ {issue_id}: {title}")
                    except Exception as e:
                        failed_count += 1
                        print(f"❌ {issue_id}: {title} - Erro: {str(e)}")

                print(f"\n✅ {resolved_count} issues marcados como resolvidos")
                if failed_count > 0:
                    print(f"❌ {failed_count} issues falharam")

    except ValueError as e:
        print(f"❌ Erro: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

