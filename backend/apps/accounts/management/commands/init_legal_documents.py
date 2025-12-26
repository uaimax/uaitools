"""Comando para inicializar documentos legais globais do SaaS.

Este comando cria Termos e Condições e Política de Privacidade globais
do sistema se ainda não existirem.

Uso:
    python manage.py init_legal_documents
"""

import os
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings

from apps.accounts.models import LegalDocument


class Command(BaseCommand):
    """Comando para inicializar documentos legais globais do SaaS."""

    help = "Cria documentos legais globais (Termos e Política) se ainda não existirem"

    def handle(self, *args, **options) -> None:
        """Executa o comando."""
        # Carregar templates
        terms_template = self._load_template("TERMOS_E_CONDICOES.md")
        privacy_template = self._load_template("POLITICA_DE_PRIVACIDADE.md")

        if not terms_template or not privacy_template:
            self.stdout.write(
                self.style.ERROR(
                    "❌ Erro ao carregar templates. Verifique se os arquivos existem em docs/templates/"
                )
            )
            return

        created_count = 0
        skipped_count = 0

        self.stdout.write(
            self.style.SUCCESS("📄 Criando documentos legais globais do sistema...")
        )

        # Verificar e criar Termos e Condições globais
        terms_created = self._create_document_if_not_exists("terms", terms_template)
        if terms_created:
            created_count += 1
        else:
            skipped_count += 1

        # Verificar e criar Política de Privacidade global
        privacy_created = self._create_document_if_not_exists("privacy", privacy_template)
        if privacy_created:
            created_count += 1
        else:
            skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Documentos legais inicializados:\n"
                f"   📄 {created_count} documento(s) criado(s)\n"
                f"   ⏭️  {skipped_count} documento(s) já existente(s)"
            )
        )

    def _load_template(self, filename: str) -> str | None:
        """Carrega template de arquivo markdown."""
        # Tentar encontrar o arquivo em docs/templates/
        base_dir = Path(settings.BASE_DIR).parent
        template_path = base_dir / "docs" / "templates" / filename

        if not template_path.exists():
            # Tentar caminho alternativo (se BASE_DIR já aponta para backend/)
            template_path = Path(settings.BASE_DIR) / ".." / ".." / "docs" / "templates" / filename
            template_path = template_path.resolve()

        if not template_path.exists():
            self.stdout.write(
                self.style.WARNING(f"⚠️  Template não encontrado: {template_path}")
            )
            return None

        try:
            with open(template_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Erro ao ler template {filename}: {e}")
            )
            return None

    def _create_document_if_not_exists(
        self, document_type: str, content: str
    ) -> bool:
        """Cria documento legal global se não existir um ativo.

        Args:
            document_type: Tipo de documento ('terms' ou 'privacy')
            content: Conteúdo do template
        """
        # Verificar se já existe um documento ativo deste tipo
        existing = LegalDocument.objects.filter(
            document_type=document_type, is_active=True
        ).first()

        if existing:
            self.stdout.write(
                self.style.WARNING(
                    f"   ⏭️  {existing.get_document_type_display()} já existe (v{existing.version})"
                )
            )
            return False

        # Criar novo documento global
        document = LegalDocument.objects.create(
            document_type=document_type,
            content=content,
            version=1,
            is_active=True,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"   ✅ {document.get_document_type_display()} criado (v{document.version})"
            )
        )
        return True

