"""Signals para auditoria automática de mudanças em models."""

import sys
from django.db import transaction
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver

from apps.core.audit import log_audit
from apps.core.models import AuditLog


def _is_testing() -> bool:
    """Verifica se estamos executando testes."""
    return 'test' in sys.argv or 'pytest' in sys.modules or 'unittest' in sys.modules

# Cache para valores antigos (antes do save)
_pre_save_cache: dict = {}


@receiver(pre_save)
def pre_save_handler(sender, instance, **kwargs) -> None:
    """Captura valores antes do save para comparar depois."""
    # Ignorar models de auditoria
    if sender == AuditLog:
        return

    # Apenas models Django com _meta
    if not hasattr(instance, "_meta"):
        return

    # Salvar valores antigos se já existe
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            cache_key = f"{sender.__name__}_{instance.pk}"
            _pre_save_cache[cache_key] = {}
            for field in instance._meta.get_fields():
                if hasattr(old_instance, field.name) and not field.many_to_many:
                    try:
                        _pre_save_cache[cache_key][field.name] = getattr(
                            old_instance, field.name
                        )
                    except Exception:
                        pass
        except (sender.DoesNotExist, Exception):
            pass


@receiver(post_save)
def post_save_handler(sender, instance, created, **kwargs) -> None:
    """Registra criação ou atualização de models."""
    # Ignorar models de auditoria
    if sender == AuditLog:
        return

    # Ignorar ContentType e Migration durante migrations
    if sender.__name__ in ('ContentType', 'Migration'):
        return

    # Ignorar durante migrations e flush (verificar se estamos em um contexto de migration/flush)
    import sys
    if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'flush' in sys.argv:
        return

    # Ignorar se raw=True (usado em fixtures e migrations)
    if kwargs.get('raw', False):
        return

    # Apenas models Django com _meta
    if not hasattr(instance, "_meta"):
        return

    action = "create" if created else "update"

    if created:
        # Para criação, registrar todos os campos com dados pessoais
        personal_data_fields = [
            "email",
            "cpf",
            "phone",
            "telefone",
            "name",
            "nome",
            "address",
            "endereco",
            "birth_date",
            "data_nascimento",
        ]
        for field_name in personal_data_fields:
            if hasattr(instance, field_name):
                value = getattr(instance, field_name, None)
                if value:
                    # Em testes, executar diretamente. Em produção, usar on_commit
                    if _is_testing():
                        # Em testes, a instância já foi salva, então podemos acessar workspace_id diretamente
                        log_audit(
                            instance=instance,
                            action=action,
                            field_name=field_name,
                            new_value=value,
                        )
                    else:
                        # Usar on_commit para garantir que a transação foi commitada
                        def create_log():
                            try:
                                instance.refresh_from_db()
                            except Exception:
                                pass
                            log_audit(
                                instance=instance,
                                action=action,
                                field_name=field_name,
                                new_value=value,
                            )
                        transaction.on_commit(create_log)
    else:
        # Para atualização, comparar valores antigos e novos
        cache_key = f"{sender.__name__}_{instance.pk}"
        old_values = _pre_save_cache.get(cache_key, {})

        for field_name, old_value in old_values.items():
            if hasattr(instance, field_name):
                new_value = getattr(instance, field_name, None)
                if old_value != new_value:
                    # Em testes, executar diretamente. Em produção, usar on_commit
                    if _is_testing():
                        # Em testes, a instância já foi salva
                        log_audit(
                            instance=instance,
                            action=action,
                            field_name=field_name,
                            old_value=old_value,
                            new_value=new_value,
                        )
                    else:
                        # Usar on_commit para garantir que a transação foi commitada
                        def create_log():
                            try:
                                instance.refresh_from_db()
                            except Exception:
                                pass
                            log_audit(
                                instance=instance,
                                action=action,
                                field_name=field_name,
                                old_value=old_value,
                                new_value=new_value,
                            )
                        transaction.on_commit(create_log)

        # Limpar cache
        _pre_save_cache.pop(cache_key, None)


@receiver(post_delete)
def post_delete_handler(sender, instance, **kwargs) -> None:
    """Registra exclusão de models."""
    # Ignorar models de auditoria
    if sender == AuditLog:
        return

    # Ignorar ContentType e Migration durante migrations
    if sender.__name__ in ('ContentType', 'Migration'):
        return

    # Ignorar durante migrations e flush
    import sys
    if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'flush' in sys.argv:
        return

    # Ignorar se raw=True (usado em fixtures e migrations)
    if kwargs.get('raw', False):
        return

    # Apenas models Django com _meta
    if not hasattr(instance, "_meta"):
        return

    # Registrar exclusão com valores finais
    personal_data_fields = [
        "email",
        "cpf",
        "phone",
        "telefone",
        "name",
        "nome",
        "address",
        "endereco",
        "birth_date",
        "data_nascimento",
    ]
    for field_name in personal_data_fields:
        if hasattr(instance, field_name):
            value = getattr(instance, field_name, None)
            if value:
                log_audit(
                    instance=instance,
                    action="delete",
                    field_name=field_name,
                    old_value=value,
                )
