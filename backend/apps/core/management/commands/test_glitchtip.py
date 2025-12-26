"""Management command para testar conexão com GlitchTip/Sentry."""

from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    """Testa conexão com GlitchTip/Sentry."""

    help = "Testa conexão com GlitchTip/Sentry enviando mensagens de teste"

    def handle(self, *args, **options):
        """Executa o teste."""
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("Teste de Conexão com GlitchTip/Sentry"))
        self.stdout.write("=" * 60)

        # Verificar configuração
        use_sentry = getattr(settings, "USE_SENTRY", False)
        sentry_dsn = getattr(settings, "SENTRY_DSN", "")

        self.stdout.write(f"\n📋 Configuração:")
        self.stdout.write(f"   USE_SENTRY: {use_sentry}")
        if sentry_dsn:
            masked_dsn = sentry_dsn[:30] + "..." + sentry_dsn[-10:] if len(sentry_dsn) > 40 else sentry_dsn
            self.stdout.write(f"   SENTRY_DSN: {masked_dsn}")
        else:
            self.stdout.write(self.style.WARNING("   SENTRY_DSN: (não configurado)"))

        if not use_sentry:
            self.stdout.write(self.style.WARNING("\n⚠️  USE_SENTRY não está configurado como 'true'"))
            self.stdout.write("   Configure no .env: USE_SENTRY=true")
            return

        if not sentry_dsn:
            self.stdout.write(self.style.WARNING("\n⚠️  SENTRY_DSN não está configurado"))
            self.stdout.write("   Configure no .env: SENTRY_DSN=https://xxx@seu-glitchtip.com/1")
            return

        # Verificar se sentry-sdk está instalado
        try:
            import sentry_sdk
            self.stdout.write(self.style.SUCCESS("\n✅ sentry-sdk está instalado"))
        except ImportError:
            self.stdout.write(self.style.ERROR("\n❌ sentry-sdk não está instalado"))
            self.stdout.write("   Instale com: pip install sentry-sdk[django]")
            self.stdout.write("   Ou descomente em requirements.txt e rode: pip install -r requirements.txt")
            return

        # Verificar se já foi inicializado (pelo settings)
        try:
            import sentry_sdk
            # Testar envio de mensagem
            self.stdout.write("\n📤 Testando envio de mensagem de teste...")
            sentry_sdk.capture_message("Teste de conexão com GlitchTip - Mensagem", level="info")
            self.stdout.write(self.style.SUCCESS("✅ Mensagem enviada com sucesso!"))

            # Testar envio de exceção
            self.stdout.write("\n📤 Testando envio de exceção de teste...")
            try:
                raise ValueError("Exceção de teste para GlitchTip - Management Command")
            except Exception as e:
                sentry_sdk.capture_exception(e)
            self.stdout.write(self.style.SUCCESS("✅ Exceção enviada com sucesso!"))

            # Flush para garantir envio
            self.stdout.write("\n🔄 Aguardando envio das mensagens...")
            sentry_sdk.flush(timeout=5)
            self.stdout.write(self.style.SUCCESS("✅ Flush concluído"))

            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("✅ Teste concluído com sucesso!"))
            self.stdout.write("=" * 60)
            self.stdout.write("\n📊 Próximos passos:")
            self.stdout.write("   1. Acesse o dashboard do GlitchTip")
            self.stdout.write("   2. Verifique se as mensagens de teste apareceram")
            self.stdout.write("   3. Se apareceram, a conexão está funcionando! 🎉")
            self.stdout.write("\n")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Erro durante o teste: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())



