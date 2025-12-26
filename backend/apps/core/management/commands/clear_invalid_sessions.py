"""Comando para limpar sessões com IDs antigos (inteiros) após migração para UUID."""

from django.contrib.auth import SESSION_KEY, get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session


class Command(BaseCommand):
    """Limpa todas as sessões que contêm IDs de usuário inválidos (inteiros antigos)."""

    help = "Limpa sessões com IDs antigos (inteiros) após migração para UUID"

    def handle(self, *args, **options):
        """Executa o comando."""
        User = get_user_model()
        deleted_count = 0

        self.stdout.write("Verificando sessões...")

        # Itera sobre todas as sessões
        for session in Session.objects.all():
            try:
                session_data = session.get_decoded()
                user_id = session_data.get(SESSION_KEY)

                if user_id is not None:
                    try:
                        # Tenta converter para UUID (se falhar, é ID antigo)
                        User._meta.pk.to_python(user_id)
                    except (ValidationError, ValueError, TypeError):
                        # ID inválido - deleta a sessão
                        session.delete()
                        deleted_count += 1
            except Exception:
                # Se houver erro ao decodificar, deleta a sessão
                session.delete()
                deleted_count += 1

        if deleted_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ {deleted_count} sessão(ões) inválida(s) removida(s)."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("✅ Nenhuma sessão inválida encontrada."))




