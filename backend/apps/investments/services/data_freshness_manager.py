"""Gerenciador de atualização de dados."""

from typing import Optional
from datetime import datetime, timedelta

from django.utils import timezone

from apps.investments.models import DataFreshness


class DataFreshnessManager:
    """Gerenciador de atualização de dados."""

    def __init__(self) -> None:
        """Inicializa o gerenciador."""
        pass

    def get_freshness(
        self,
        workspace,
        data_type: str,
        ticker: Optional[str] = None,
    ) -> Optional[DataFreshness]:
        """Obtém controle de atualização.

        Args:
            workspace: Workspace
            data_type: Tipo de dado ('quote', 'fundamental', etc)
            ticker: Ticker (opcional)

        Returns:
            DataFreshness ou None
        """
        try:
            return DataFreshness.objects.get(
                workspace=workspace,
                data_type=data_type,
                ticker=ticker,
            )
        except DataFreshness.DoesNotExist:
            return None

    def is_fresh(
        self,
        workspace,
        data_type: str,
        ticker: Optional[str] = None,
        max_age_minutes: int = 5,
    ) -> bool:
        """Verifica se dados estão atualizados.

        Args:
            workspace: Workspace
            data_type: Tipo de dado
            ticker: Ticker (opcional)
            max_age_minutes: Idade máxima em minutos

        Returns:
            True se está atualizado, False caso contrário
        """
        freshness = self.get_freshness(workspace, data_type, ticker)
        if not freshness:
            return False

        if not freshness.is_fresh:
            return False

        # Verificar se está dentro da janela de atualização
        age = timezone.now() - freshness.last_updated
        return age.total_seconds() / 60 <= max_age_minutes

    def mark_updated(
        self,
        workspace,
        data_type: str,
        ticker: Optional[str] = None,
        update_frequency_minutes: int = 5,
    ) -> DataFreshness:
        """Marca dados como atualizados.

        Args:
            workspace: Workspace
            data_type: Tipo de dado
            ticker: Ticker (opcional)
            update_frequency_minutes: Frequência de atualização

        Returns:
            DataFreshness criado ou atualizado
        """
        now = timezone.now()
        next_update = now + timedelta(minutes=update_frequency_minutes)

        freshness, created = DataFreshness.objects.get_or_create(
            workspace=workspace,
            data_type=data_type,
            ticker=ticker,
            defaults={
                "last_updated": now,
                "next_update_due": next_update,
                "is_fresh": True,
                "freshness_score": 1.0,
                "update_frequency_minutes": update_frequency_minutes,
            },
        )

        if not created:
            freshness.last_updated = now
            freshness.next_update_due = next_update
            freshness.is_fresh = True
            freshness.freshness_score = 1.0
            freshness.update_frequency_minutes = update_frequency_minutes
            freshness.save()

        return freshness

    def mark_stale(
        self,
        workspace,
        data_type: str,
        ticker: Optional[str] = None,
    ) -> None:
        """Marca dados como desatualizados.

        Args:
            workspace: Workspace
            data_type: Tipo de dado
            ticker: Ticker (opcional)
        """
        freshness = self.get_freshness(workspace, data_type, ticker)
        if freshness:
            freshness.is_fresh = False
            freshness.freshness_score = 0.0
            freshness.save()

    def get_stale_data(
        self,
        workspace,
    ) -> list[DataFreshness]:
        """Obtém lista de dados desatualizados.

        Args:
            workspace: Workspace

        Returns:
            Lista de DataFreshness desatualizados
        """
        now = timezone.now()
        return DataFreshness.objects.filter(
            workspace=workspace,
            is_fresh=False,
        ).filter(
            next_update_due__lte=now,
        )

