"""ViewSets for leads app."""

from django.db import models
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import WorkspaceObjectPermission
from apps.core.viewsets import WorkspaceViewSet
from apps.leads.models import Lead
from apps.leads.serializers import LeadListSerializer, LeadSerializer


class LeadViewSet(WorkspaceViewSet):
    """ViewSet para modelo Lead com filtro automático por workspace."""

    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    # Inclui WorkspaceObjectPermission para validar ownership (previne IDOR)
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
    # Filtros e ordenação (similar ao Django Admin)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "email", "client_workspace", "phone"]
    ordering_fields = ["name", "email", "status", "created_at", "updated_at"]
    ordering = ["-created_at"]  # Ordenação padrão

    def get_serializer_class(self) -> type[LeadSerializer | LeadListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return LeadListSerializer
        return LeadSerializer

    def get_queryset(self) -> models.QuerySet[Lead]:
        """Retorna queryset filtrado por workspace e com filtros opcionais."""
        queryset = super().get_queryset()

        # Filtros opcionais adicionais (além dos filter_backends)
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        return queryset
