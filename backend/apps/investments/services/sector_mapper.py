"""Mapeamento de tickers para setores."""

from typing import List, Optional

from apps.investments.models import SectorMapping


class SectorMapper:
    """Mapeamento de tickers para setores."""

    def get_sector(self, ticker: str) -> Optional[str]:
        """Retorna setor de um ticker.

        Args:
            ticker: Código do ticker (ex: "TAEE11", "PETR4")

        Returns:
            Setor do ticker ou None se não encontrado
        """
        try:
            mapping = SectorMapping.objects.filter(
                ticker=ticker.upper(),
                is_active=True,
            ).first()
            if mapping:
                return mapping.sector
        except Exception:
            pass

        return None

    def get_subsector(self, ticker: str) -> Optional[str]:
        """Retorna subsetor de um ticker.

        Args:
            ticker: Código do ticker

        Returns:
            Subsetor do ticker ou None se não encontrado
        """
        try:
            mapping = SectorMapping.objects.filter(
                ticker=ticker.upper(),
                is_active=True,
            ).first()
            if mapping:
                return mapping.subsector
        except Exception:
            pass

        return None

    def get_all_tickers_by_sector(self, sector: str) -> List[str]:
        """Retorna todos os tickers de um setor.

        Args:
            sector: Nome do setor

        Returns:
            Lista de tickers do setor
        """
        try:
            mappings = SectorMapping.objects.filter(
                sector=sector,
                is_active=True,
            ).values_list("ticker", flat=True)
            return list(mappings)
        except Exception:
            return []

    def get_all_tickers_by_subsector(self, subsector: str) -> List[str]:
        """Retorna todos os tickers de um subsetor.

        Args:
            subsector: Nome do subsetor

        Returns:
            Lista de tickers do subsetor
        """
        try:
            mappings = SectorMapping.objects.filter(
                subsector=subsector,
                is_active=True,
            ).values_list("ticker", flat=True)
            return list(mappings)
        except Exception:
            return []

    def is_sector_allowed(
        self,
        sector: str,
        allowed_sectors: List[str],
    ) -> bool:
        """Verifica se setor é permitido.

        Args:
            sector: Setor a verificar
            allowed_sectors: Lista de setores permitidos

        Returns:
            True se setor é permitido, False caso contrário
        """
        if not allowed_sectors:
            return True  # Se não há restrição, todos são permitidos

        return sector.lower() in [s.lower() for s in allowed_sectors]

    def is_sector_excluded(
        self,
        sector: str,
        excluded_sectors: List[str],
    ) -> bool:
        """Verifica se setor está excluído.

        Args:
            sector: Setor a verificar
            excluded_sectors: Lista de setores excluídos

        Returns:
            True se setor está excluído, False caso contrário
        """
        if not excluded_sectors:
            return False  # Se não há exclusões, nenhum está excluído

        return sector.lower() in [s.lower() for s in excluded_sectors]

