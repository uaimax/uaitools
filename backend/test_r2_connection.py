#!/usr/bin/env python
"""Script para testar conexão com Cloudflare R2.

Uso:
    python test_r2_connection.py
"""

import os
import sys
from pathlib import Path

# Adiciona o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Carrega variáveis de ambiente do .env
# Procura .env no diretório backend e na raiz do projeto
from dotenv import load_dotenv

# Tenta carregar .env do backend primeiro, depois da raiz
env_loaded = load_dotenv(BASE_DIR / ".env") or load_dotenv(BASE_DIR.parent / ".env")
if not env_loaded:
    print("⚠️  Arquivo .env não encontrado. Verificando variáveis de ambiente do sistema...")

# Verifica se boto3 está instalado
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("❌ boto3 não está instalado. Instale com: pip install boto3")
    sys.exit(1)


def check_env_vars() -> dict[str, str | None]:
    """Verifica se todas as variáveis de ambiente necessárias estão configuradas."""
    required_vars = [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
    ]
    optional_vars = ["R2_CUSTOM_DOMAIN"]

    env_vars = {}
    missing = []

    for var in required_vars:
        value = os.environ.get(var)
        env_vars[var] = value
        if not value:
            missing.append(var)

    for var in optional_vars:
        env_vars[var] = os.environ.get(var)

    return env_vars, missing


def create_r2_client(account_id: str, access_key_id: str, secret_access_key: str):
    """Cria cliente S3 compatível com R2."""
    # R2 usa endpoint customizado
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",  # R2 não usa regiões tradicionais
    )


def test_connection(client, bucket_name: str) -> bool:
    """Testa se consegue listar objetos no bucket."""
    try:
        response = client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
        print(f"✅ Conexão com bucket '{bucket_name}' estabelecida com sucesso!")
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "NoSuchBucket":
            print(f"❌ Bucket '{bucket_name}' não encontrado!")
        elif error_code == "AccessDenied":
            print(f"❌ Acesso negado ao bucket '{bucket_name}'. Verifique as credenciais!")
        else:
            print(f"❌ Erro ao conectar: {error_code} - {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False


def test_upload_download_delete(client, bucket_name: str) -> bool:
    """Testa upload, download e delete de um arquivo de teste."""
    test_key = "test/r2_connection_test.txt"
    test_content = b"Teste de conexao R2 - " + str(os.urandom(8)).encode()

    try:
        # Upload
        print(f"\n📤 Testando upload de '{test_key}'...")
        client.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)
        print("✅ Upload realizado com sucesso!")

        # Download
        print(f"\n📥 Testando download de '{test_key}'...")
        response = client.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = response["Body"].read()
        if downloaded_content == test_content:
            print("✅ Download realizado com sucesso! Conteúdo verificado.")
        else:
            print("⚠️  Download realizado, mas conteúdo não confere!")
            return False

        # Delete
        print(f"\n🗑️  Testando delete de '{test_key}'...")
        client.delete_object(Bucket=bucket_name, Key=test_key)
        print("✅ Delete realizado com sucesso!")

        return True

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        print(f"❌ Erro na operação: {error_code} - {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False


def test_custom_domain(custom_domain: str | None) -> None:
    """Verifica se o domínio customizado está configurado."""
    if custom_domain:
        print(f"\n🌐 Domínio customizado configurado: {custom_domain}")
        print("   (Nota: Teste manual de acesso via domínio customizado não é realizado aqui)")
    else:
        print("\nℹ️  Domínio customizado não configurado (opcional)")


def main():
    """Função principal."""
    print("=" * 60)
    print("🧪 Teste de Conexão com Cloudflare R2")
    print("=" * 60)

    # 1. Verificar variáveis de ambiente
    print("\n📋 Verificando variáveis de ambiente...")
    env_vars, missing = check_env_vars()

    if missing:
        print(f"\n❌ Variáveis de ambiente faltando: {', '.join(missing)}")
        print("\nConfigure as seguintes variáveis no arquivo .env:")
        for var in missing:
            print(f"  {var}=...")
        sys.exit(1)

    print("✅ Todas as variáveis de ambiente necessárias estão configuradas!")
    for var, value in env_vars.items():
        if value:
            # Mascarar valores sensíveis
            if "SECRET" in var or "KEY" in var:
                masked = value[:4] + "*" * (len(value) - 8) + value[-4:] if len(value) > 8 else "***"
                print(f"   {var}: {masked}")
            else:
                print(f"   {var}: {value}")

    # 2. Criar cliente R2
    print("\n🔌 Criando cliente R2...")
    try:
        client = create_r2_client(
            account_id=env_vars["R2_ACCOUNT_ID"],
            access_key_id=env_vars["R2_ACCESS_KEY_ID"],
            secret_access_key=env_vars["R2_SECRET_ACCESS_KEY"],
        )
        print("✅ Cliente R2 criado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar cliente: {e}")
        sys.exit(1)

    # 3. Testar conexão
    bucket_name = env_vars["R2_BUCKET"]
    if not test_connection(client, bucket_name):
        sys.exit(1)

    # 4. Testar operações (upload, download, delete)
    print("\n" + "=" * 60)
    print("🧪 Testando operações básicas...")
    print("=" * 60)

    if not test_upload_download_delete(client, bucket_name):
        sys.exit(1)

    # 5. Verificar domínio customizado
    test_custom_domain(env_vars.get("R2_CUSTOM_DOMAIN"))

    # Sucesso!
    print("\n" + "=" * 60)
    print("✅ Todos os testes passaram! R2 está configurado corretamente.")
    print("=" * 60)


if __name__ == "__main__":
    main()

