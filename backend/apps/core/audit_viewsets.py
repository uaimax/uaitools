"""ViewSets para audit logs."""

from django.db import models
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.models import AuditLog
from apps.core.audit_serializers import AuditLogListSerializer, AuditLogSerializer
from apps.core.permissions import WorkspaceObjectPermission
from apps.core.viewsets import WorkspaceViewSet


class AuditLogViewSet(WorkspaceViewSet, ReadOnlyModelViewSet):
    """ViewSet para consultar logs de auditoria LGPD.

    Apenas leitura - logs não podem ser criados, alterados ou deletados via API.
    """

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    # Inclui WorkspaceObjectPermission para validar ownership (previne IDOR)
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "model_name",
        "field_name",
        "user__username",
        "user__email",
        "data_subject",
        "object_id",
    ]
    ordering_fields = ["created_at", "action", "model_name"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[AuditLogSerializer | AuditLogListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return AuditLogListSerializer
        return AuditLogSerializer

    def get_queryset(self) -> models.QuerySet[AuditLog]:
        """Retorna queryset filtrado por workspace e com filtros opcionais."""
        queryset = super().get_queryset()

        # Filtros opcionais
        action = self.request.query_params.get("action")
        if action:
            queryset = queryset.filter(action=action)

        is_personal = self.request.query_params.get("is_personal_data")
        if is_personal is not None:
            queryset = queryset.filter(is_personal_data=is_personal.lower() == "true")

        model_name = self.request.query_params.get("model_name")
        if model_name:
            queryset = queryset.filter(model_name__icontains=model_name)

        data_subject = self.request.query_params.get("data_subject")
        if data_subject:
            queryset = queryset.filter(data_subject__icontains=data_subject)

        return queryset

