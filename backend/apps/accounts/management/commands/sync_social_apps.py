"""Management command para sincronizar SocialApps a partir de variáveis de ambiente."""

from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    """Sincroniza SocialApps a partir de variáveis de ambiente."""

    help = "Cria ou atualiza SocialApps baseado em variáveis de ambiente configuradas"

    PROVIDERS = {
        "google": {
            "name": "Google",
            "client_id_env": "GOOGLE_CLIENT_ID",
            "secret_env": "GOOGLE_CLIENT_SECRET",
        },
        "github": {
            "name": "GitHub",
            "client_id_env": "GITHUB_CLIENT_ID",
            "secret_env": "GITHUB_CLIENT_SECRET",
        },
        "microsoft": {
            "name": "Microsoft",
            "client_id_env": "MICROSOFT_CLIENT_ID",
            "secret_env": "MICROSOFT_CLIENT_SECRET",
        },
        "instagram": {
            "name": "Instagram",
            "client_id_env": "INSTAGRAM_CLIENT_ID",
            "secret_env": "INSTAGRAM_CLIENT_SECRET",
        },
        "linkedin_oauth2": {
            "name": "LinkedIn",
            "client_id_env": "LINKEDIN_CLIENT_ID",
            "secret_env": "LINKEDIN_CLIENT_SECRET",
        },
    }

    def handle(self, *args, **options):
        """Executa o comando."""
        import os

        site = Site.objects.get_current()
        created_count = 0
        updated_count = 0

        for provider_id, provider_config in self.PROVIDERS.items():
            client_id = os.environ.get(provider_config["client_id_env"], "").strip()
            secret = os.environ.get(provider_config["secret_env"], "").strip()

            if not client_id or not secret:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠️  {provider_config['name']}: Variáveis de ambiente não configuradas, pulando..."
                    )
                )
                continue

            # Criar ou atualizar SocialApp
            app, created = SocialApp.objects.get_or_create(
                provider=provider_id,
                defaults={
                    "name": provider_config["name"],
                    "client_id": client_id,
                    "secret": secret,
                },
            )

            if created:
                app.sites.add(site)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ {provider_config['name']}: SocialApp criado com sucesso"
                    )
                )
            else:
                # Atualizar se as credenciais mudaram
                updated = False
                if app.client_id != client_id:
                    app.client_id = client_id
                    updated = True
                if app.secret != secret:
                    app.secret = secret
                    updated = True
                if site not in app.sites.all():
                    app.sites.add(site)
                    updated = True
                if not app.active:
                    app.active = True
                    updated = True

                if updated:
                    app.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"🔄 {provider_config['name']}: SocialApp atualizado"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ {provider_config['name']}: SocialApp já está configurado"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Sincronização concluída: {created_count} criados, {updated_count} atualizados"
            )
        )




