"""Storage backend para Cloudflare R2 (S3-compatible)."""

import os
from django.core.files.storage import default_storage, Storage
from storages.backends.s3boto3 import S3Boto3Storage


class R2Storage(S3Boto3Storage):
    """Storage backend para Cloudflare R2 (compatível com S3)."""

    # R2 não usa regiões
    region_name = "auto"

    # Configurações de arquivo
    file_overwrite = False
    default_acl = "private"  # Arquivos privados por padrão

    def __init__(self, *args, **kwargs):
        # Configurações do R2 via variáveis de ambiente
        account_id = os.getenv("R2_ACCOUNT_ID", "")
        access_key = os.getenv("R2_ACCESS_KEY_ID", "")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "")
        bucket_name = os.getenv("R2_BUCKET", "")
        custom_domain = os.getenv("R2_CUSTOM_DOMAIN", "")

        # Se não estiver configurado, usar storage padrão (local)
        if not all([account_id, access_key, secret_key, bucket_name]):
            # Fallback para storage local - não inicializar S3
            # Usar lazy loading para evitar problemas de importação circular
            self._wrapped = None
            self._use_local = True
            # Inicializar como Storage básico para ter métodos mínimos
            Storage.__init__(self)
            return

        self._use_local = False

        # R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        # Configurar credenciais e bucket
        kwargs.update({
            "access_key": access_key,
            "secret_key": secret_key,
            "bucket_name": bucket_name,
            "endpoint_url": endpoint_url,
        })

        # Configurar domínio customizado se disponível
        if custom_domain:
            kwargs["custom_domain"] = custom_domain

        super().__init__(*args, **kwargs)

    def _get_local_storage(self):
        """Retorna storage local quando R2 não está configurado ou para fallback."""
        # Se já temos _wrapped (modo local), retornar
        if hasattr(self, '_wrapped') and self._wrapped is not None:
            return self._wrapped
        # Se não temos _wrapped, criar storage local dinamicamente
        if not hasattr(self, '_local_storage_fallback'):
            self._local_storage_fallback = default_storage
        return self._local_storage_fallback

    def _open(self, name, mode='rb'):
        """Abre arquivo usando storage apropriado.

        Se o arquivo não estiver no R2, tenta abrir do storage local (fallback).
        """
        if getattr(self, '_use_local', False):
            return self._get_local_storage()._open(name, mode)

        # Tentar abrir do R2 primeiro
        try:
            return super()._open(name, mode)
        except Exception:
            # Se falhar, tentar storage local (pode ter sido salvo como fallback)
            return self._get_local_storage()._open(name, mode)

    def _save(self, name, content):
        """Salva arquivo usando storage apropriado.

        Se R2 falhar (rate limit, erro de conexão, etc), faz fallback para storage local.
        """
        if getattr(self, '_use_local', False):
            return self._get_local_storage()._save(name, content)

        # Tentar salvar no R2 primeiro
        try:
            return super()._save(name, content)
        except Exception as e:
            # Se falhar (rate limit, erro de conexão, etc), fazer fallback para storage local
            import logging
            logger = logging.getLogger("apps")
            logger.warning(
                f"Erro ao salvar no R2 ({type(e).__name__}: {str(e)}), "
                f"fazendo fallback para storage local: {name}"
            )
            # Salvar localmente como fallback
            return self._get_local_storage()._save(name, content)

    def delete(self, name):
        """Deleta arquivo usando storage apropriado.

        Tenta deletar tanto do R2 quanto do storage local (fallback).
        """
        if getattr(self, '_use_local', False):
            return self._get_local_storage().delete(name)

        # Tentar deletar do R2
        try:
            super().delete(name)
        except Exception:
            pass  # Ignorar erro se não estiver no R2

        # Tentar deletar do storage local também (pode ter sido salvo como fallback)
        try:
            self._get_local_storage().delete(name)
        except Exception:
            pass  # Ignorar erro se não estiver no storage local

    def exists(self, name):
        """Verifica se arquivo existe usando storage apropriado.

        Verifica tanto no R2 quanto no storage local (fallback).
        """
        if getattr(self, '_use_local', False):
            return self._get_local_storage().exists(name)

        # Verificar no R2 primeiro
        try:
            if super().exists(name):
                return True
        except Exception:
            pass

        # Se não estiver no R2, verificar no storage local (fallback)
        return self._get_local_storage().exists(name)

    def url(self, name):
        """Retorna URL do arquivo usando storage apropriado.

        Se o arquivo estiver no storage local (fallback), retorna URL local.
        """
        if getattr(self, '_use_local', False):
            return self._get_local_storage().url(name)

        # Tentar obter URL do R2
        try:
            return super().url(name)
        except Exception:
            # Se falhar, tentar storage local (pode ter sido salvo como fallback)
            try:
                return self._get_local_storage().url(name)
            except Exception:
                # Se também falhar, retornar URL relativa padrão
                return f"/media/{name}"

    def size(self, name):
        """Retorna tamanho do arquivo usando storage apropriado."""
        if getattr(self, '_use_local', False):
            return self._get_local_storage().size(name)
        return super().size(name)


class SupBrainNoteAudioStorage(R2Storage):
    """Storage específico para áudios do SupBrainNote."""

    # Prefixo para organizar arquivos no bucket
    location = "supbrainnote/audios"

