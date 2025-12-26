#!/usr/bin/env python3
"""Script para testar conexão com GlitchTip/Sentry."""

import os
import sys
from pathlib import Path

# Adicionar o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

def test_glitchtip_connection():
    """Testa conexão com GlitchTip/Sentry."""
    print("=" * 60)
    print("Teste de Conexão com GlitchTip/Sentry")
    print("=" * 60)

    # Verificar variáveis de ambiente
    use_sentry = os.environ.get("USE_SENTRY", "false").lower() == "true"
    sentry_dsn = os.environ.get("SENTRY_DSN", "")

    print(f"\n📋 Configuração:")
    print(f"   USE_SENTRY: {use_sentry}")
    print(f"   SENTRY_DSN: {sentry_dsn[:50]}..." if sentry_dsn else "   SENTRY_DSN: (não configurado)")

    if not use_sentry:
        print("\n⚠️  USE_SENTRY não está configurado como 'true'")
        print("   Configure no .env: USE_SENTRY=true")
        return False

    if not sentry_dsn:
        print("\n⚠️  SENTRY_DSN não está configurado")
        print("   Configure no .env: SENTRY_DSN=https://xxx@seu-glitchtip.com/1")
        return False

    # Verificar se sentry-sdk está instalado
    try:
        import sentry_sdk
        print("\n✅ sentry-sdk está instalado")
    except ImportError:
        print("\n❌ sentry-sdk não está instalado")
        print("   Instale com: pip install sentry-sdk[django]")
        return False

    # Testar inicialização
    print("\n🔄 Testando inicialização do Sentry SDK...")
    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=0.0,  # Desabilitar traces para teste
            environment="test",
        )
        print("✅ SDK inicializado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao inicializar SDK: {e}")
        return False

    # Testar envio de mensagem
    print("\n📤 Testando envio de mensagem de teste...")
    try:
        sentry_sdk.capture_message("Teste de conexão com GlitchTip", level="info")
        print("✅ Mensagem enviada com sucesso!")
        print("   Verifique no dashboard do GlitchTip se a mensagem apareceu")
    except Exception as e:
        print(f"❌ Erro ao enviar mensagem: {e}")
        return False

    # Testar envio de exceção
    print("\n📤 Testando envio de exceção de teste...")
    try:
        try:
            raise ValueError("Exceção de teste para GlitchTip")
        except Exception as e:
            sentry_sdk.capture_exception(e)
        print("✅ Exceção enviada com sucesso!")
        print("   Verifique no dashboard do GlitchTip se a exceção apareceu")
    except Exception as e:
        print(f"❌ Erro ao enviar exceção: {e}")
        return False

    # Flush para garantir que a mensagem foi enviada
    print("\n🔄 Aguardando envio das mensagens...")
    sentry_sdk.flush(timeout=5)
    print("✅ Flush concluído")

    print("\n" + "=" * 60)
    print("✅ Teste concluído com sucesso!")
    print("=" * 60)
    print("\n📊 Próximos passos:")
    print("   1. Acesse o dashboard do GlitchTip")
    print("   2. Verifique se as mensagens de teste apareceram")
    print("   3. Se apareceram, a conexão está funcionando! 🎉")
    print("\n")

    return True

if __name__ == "__main__":
    success = test_glitchtip_connection()
    sys.exit(0 if success else 1)



