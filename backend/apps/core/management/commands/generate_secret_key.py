"""Comando para gerar secret keys seguras.

Este comando gera uma secret key criptograficamente segura usando o utilitário
do Django. Útil para gerar SECRET_KEY, JWT secrets, ou outras chaves necessárias.

Uso:
    python manage.py generate_secret_key
    python manage.py generate_secret_key --copy  # Copia para clipboard (se disponível)
    python manage.py generate_secret_key --format env  # Formato para .env
"""

from django.core.management.base import BaseCommand
from django.core.management.utils import get_random_secret_key


class Command(BaseCommand):
    """Comando para gerar secret keys seguras."""

    help = "Gera uma secret key criptograficamente segura"

    def add_arguments(self, parser) -> None:
        """Adiciona argumentos ao comando."""
        parser.add_argument(
            "--format",
            type=str,
            choices=["raw", "env", "json"],
            default="raw",
            help="Formato de saída: raw (apenas a chave), env (SECRET_KEY=...), json",
        )
        parser.add_argument(
            "--copy",
            action="store_true",
            help="Tenta copiar para clipboard (requer pyperclip instalado)",
        )

    def handle(self, *args, **options) -> None:
        """Executa o comando de geração de secret key."""
        secret_key = get_random_secret_key()

        # Formata a saída
        format_type = options["format"]
        if format_type == "env":
            # Usa aspas simples para evitar problemas com caracteres especiais
            # Aspas simples são mais seguras para .env pois não interpretam variáveis
            output = f"SECRET_KEY='{secret_key}'"
        elif format_type == "json":
            output = f'{{"SECRET_KEY": "{secret_key}"}}'
        else:
            output = secret_key

        # Exibe a chave
        self.stdout.write(self.style.SUCCESS(output))

        # Tenta copiar para clipboard se solicitado
        if options["copy"]:
            try:
                import pyperclip

                pyperclip.copy(secret_key)
                self.stdout.write(
                    self.style.SUCCESS("✅ Secret key copiada para clipboard!")
                )
            except ImportError:
                self.stdout.write(
                    self.style.WARNING(
                        "⚠️  pyperclip não instalado. Instale com: pip install pyperclip"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Erro ao copiar: {e}")
                )

        # Dica de uso
        if format_type == "env":
            self.stdout.write(
                self.style.WARNING(
                    "\n💡 Dica: A chave já está formatada com aspas simples para o .env"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "\n💡 Dica: Use esta chave no arquivo .env como SECRET_KEY='<chave>' (com aspas simples)"
                )
            )

