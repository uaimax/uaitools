"""Comando para popular dados iniciais do módulo investments."""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Workspace
from apps.investments.models import SectorMapping, StrategyTemplate


class Command(BaseCommand):
    """Comando para popular dados iniciais."""

    help = "Popula templates de estratégias e mapeamento de setores"

    def add_arguments(self, parser):
        """Adiciona argumentos ao comando."""
        parser.add_argument(
            "--workspace-id",
            type=int,
            help="ID do workspace (opcional, cria para todos se não especificado)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Limpa dados existentes antes de popular",
        )

    def handle(self, *args, **options):
        """Executa o comando."""
        workspace_id = options.get("workspace_id")
        clear = options.get("clear", False)

        if workspace_id:
            workspaces = Workspace.objects.filter(id=workspace_id)
        else:
            workspaces = Workspace.objects.all()

        if not workspaces.exists():
            self.stdout.write(self.style.WARNING("Nenhum workspace encontrado."))
            return

        # Popular templates de estratégias
        self._seed_strategy_templates(workspaces, clear)

        # Popular mapeamento de setores
        self._seed_sector_mapping(workspaces, clear)

        self.stdout.write(self.style.SUCCESS("Dados iniciais populados com sucesso!"))

    def _seed_strategy_templates(self, workspaces, clear: bool):
        """Popula templates de estratégias."""
        if clear:
            StrategyTemplate.objects.all().delete()
            self.stdout.write("Templates antigos removidos.")

        templates_data = [
            {
                "name": "Dividendos Defensivos",
                "slug": "dividendos-defensivos",
                "description": "Foco em dividendos consistentes de setores defensivos e perenes, com DY entre 6-8% e fundamentos sólidos.",
                "category": "dividendos",
                "base_criteria": {
                    "dividend_yield_min": 0.06,
                    "dividend_yield_max": 0.10,
                    "pe_ratio_max": 15.0,
                    "price_to_book_max": 2.0,
                    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],
                    "excluded_sectors": ["mineração", "armas", "defesa"],
                    "min_diversification": 0.70,
                    "max_concentration_per_asset": 0.15,
                    "max_concentration_per_sector": 0.35,
                    "min_dividend_history_months": 12,
                },
                "adaptation_logic": "Ajustar DY mínimo baseado em média de mercado atual. Se Selic < 10%, reduzir DY mínimo em 1pp. Se volatilidade alta, aumentar filtros de qualidade. Priorizar ativos com histórico consistente de dividendos.",
                "priority": 5,
            },
            {
                "name": "Value Investing",
                "slug": "value-investing",
                "description": "Foco em empresas subvalorizadas com fundamentos sólidos, P/L e P/VP baixos.",
                "category": "value",
                "base_criteria": {
                    "pe_ratio_max": 12.0,
                    "price_to_book_max": 1.5,
                    "dividend_yield_min": 0.04,
                    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo"],
                    "excluded_sectors": ["mineração", "armas", "defesa"],
                    "min_diversification": 0.75,
                    "max_concentration_per_asset": 0.12,
                },
                "adaptation_logic": "Ajustar P/L máximo baseado em média do mercado. Em mercados caros, ser mais seletivo. Priorizar empresas com baixo P/VP e DY positivo.",
                "priority": 4,
            },
            {
                "name": "Crescimento Balanceado",
                "slug": "crescimento-balanceado",
                "description": "Mix de dividendos e crescimento, balanceando renda passiva com valorização.",
                "category": "hibrida",
                "base_criteria": {
                    "dividend_yield_min": 0.05,
                    "pe_ratio_max": 18.0,
                    "price_to_book_max": 2.5,
                    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],
                    "excluded_sectors": ["mineração", "armas", "defesa"],
                    "min_diversification": 0.70,
                    "max_concentration_per_asset": 0.15,
                },
                "adaptation_logic": "Balancear entre dividendos e crescimento baseado em ciclo de mercado. Em mercados de alta, focar mais em crescimento. Em mercados de baixa, focar mais em dividendos.",
                "priority": 3,
            },
            {
                "name": "Renda Passiva",
                "slug": "renda-passiva",
                "description": "Foco total em dividendos mensais consistentes para gerar renda passiva.",
                "category": "dividendos",
                "base_criteria": {
                    "dividend_yield_min": 0.07,
                    "pe_ratio_max": 12.0,
                    "allowed_sectors": ["financeiro", "energia", "utilities"],
                    "excluded_sectors": ["mineração", "armas", "defesa"],
                    "min_diversification": 0.65,
                    "max_concentration_per_asset": 0.20,
                    "min_dividend_history_months": 24,
                    "min_regularity_score": 0.8,
                },
                "adaptation_logic": "Priorizar ativos com histórico longo e consistente de dividendos. Ajustar DY mínimo baseado em Selic. Em juros baixos, aceitar DY menor.",
                "priority": 4,
            },
            {
                "name": "Conservador",
                "slug": "conservador",
                "description": "Máxima segurança, baixa volatilidade, foco em preservação de capital.",
                "category": "dividendos",
                "base_criteria": {
                    "dividend_yield_min": 0.05,
                    "pe_ratio_max": 10.0,
                    "price_to_book_max": 1.2,
                    "allowed_sectors": ["utilities", "energia"],
                    "excluded_sectors": ["mineração", "armas", "defesa", "financeiro"],
                    "min_diversification": 0.80,
                    "max_concentration_per_asset": 0.10,
                    "max_concentration_per_sector": 0.25,
                    "min_dividend_history_months": 36,
                },
                "adaptation_logic": "Máxima segurança. Priorizar apenas setores mais defensivos (utilities, energia regulada). Aceitar DY menor em troca de segurança.",
                "priority": 2,
            },
        ]

        for workspace in workspaces:
            for template_data in templates_data:
                template, created = StrategyTemplate.objects.get_or_create(
                    workspace=workspace,
                    slug=template_data["slug"],
                    defaults={
                        "name": template_data["name"],
                        "description": template_data["description"],
                        "category": template_data["category"],
                        "base_criteria": template_data["base_criteria"],
                        "adaptation_logic": template_data["adaptation_logic"],
                        "priority": template_data["priority"],
                        "is_active": True,
                        "is_system_template": True,
                        "created_by_ai": True,
                        "validation_status": "pending",
                    },
                )
                if created:
                    self.stdout.write(f"Template '{template.name}' criado para workspace {workspace.name}")
                else:
                    self.stdout.write(f"Template '{template.name}' já existe para workspace {workspace.name}")

    def _seed_sector_mapping(self, workspaces, clear: bool):
        """Popula mapeamento de setores com principais tickers da B3."""
        if clear:
            SectorMapping.objects.all().delete()
            self.stdout.write("Mapeamentos antigos removidos.")

        # Principais tickers da B3 mapeados por setor
        # Lista inicial com ~100 tickers principais
        sector_mappings = [
            # Financeiro - Bancos
            ("ITUB4", "financeiro", "bancos", "Itaú Unibanco"),
            ("BBDC4", "financeiro", "bancos", "Banco Bradesco"),
            ("BBAS3", "financeiro", "bancos", "Banco do Brasil"),
            ("SANB11", "financeiro", "bancos", "Banco Santander"),
            ("BPAC11", "financeiro", "bancos", "BTG Pactual"),
            # Financeiro - Seguros
            ("SULA11", "financeiro", "seguros", "SulAmérica"),
            ("IRBR3", "financeiro", "seguros", "IRB Brasil"),
            # Energia - Elétricas
            ("TAEE11", "energia", "elétricas", "Taesa"),
            ("ELET3", "energia", "elétricas", "Centrais Elétricas"),
            ("ELET6", "energia", "elétricas", "Centrais Elétricas"),
            ("CMIG4", "energia", "elétricas", "Cemig"),
            ("CPLE6", "energia", "elétricas", "Copel"),
            ("EGIE3", "energia", "elétricas", "Engie Brasil"),
            # Energia - Petróleo
            ("PETR4", "energia", "petróleo", "Petrobras"),
            ("PETR3", "energia", "petróleo", "Petrobras"),
            ("PRIO3", "energia", "petróleo", "PetroRio"),
            # Utilities
            ("SAPR11", "utilities", "saneamento", "Sanepar"),
            ("SBSP3", "utilities", "saneamento", "Sabesp"),
            ("CSAN3", "utilities", "saneamento", "Cosan"),
            # Consumo - Varejo
            ("MGLU3", "consumo", "varejo", "Magazine Luiza"),
            ("VVAR3", "consumo", "varejo", "Via Varejo"),
            ("LAME4", "consumo", "varejo", "Lojas Americanas"),
            # Consumo - Alimentos
            ("ABEV3", "consumo", "alimentos", "Ambev"),
            ("MRFG3", "consumo", "alimentos", "Marfrig"),
            ("JBSS3", "consumo", "alimentos", "JBS"),
            # Telecomunicações
            ("VIVT3", "telecomunicações", "telecom", "Telefônica Brasil"),
            ("TIMS3", "telecomunicações", "telecom", "TIM"),
            ("OIBR3", "telecomunicações", "telecom", "Oi"),
            # Mineração
            ("VALE3", "mineração", "mineração", "Vale"),
            ("CSNA3", "mineração", "mineração", "CSN"),
            # Outros setores importantes
            ("WEGE3", "industrial", "equipamentos", "WEG"),
            ("RENT3", "serviços", "locação", "Localiza"),
            ("RAIL3", "serviços", "logística", "Rumo"),
        ]

        for workspace in workspaces:
            for ticker, sector, subsector, company_name in sector_mappings:
                mapping, created = SectorMapping.objects.get_or_create(
                    workspace=workspace,
                    ticker=ticker,
                    defaults={
                        "sector": sector,
                        "subsector": subsector,
                        "company_name": company_name,
                        "is_active": True,
                    },
                )
                if created:
                    self.stdout.write(f"Mapeamento {ticker} → {sector} criado para workspace {workspace.name}")

        self.stdout.write(f"Total de {len(sector_mappings)} mapeamentos processados por workspace.")

