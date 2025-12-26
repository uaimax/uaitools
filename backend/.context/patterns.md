# Padrões Identificados

Este arquivo documenta **padrões que funcionam bem** e devem ser seguidos.

---

## Padrão: Estrutura de Apps Modulares

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [architecture, django, structure]
**Severidade**: high

### Descrição
Cada funcionalidade deve ser um app Django separado em `backend/apps/`.

### Estrutura Padrão
```
backend/apps/
├── core/              # App base (TenantModel, middleware)
├── accounts/          # User + Tenant
├── leads/            # Exemplo de módulo
└── [novo-modulo]/    # Novos módulos seguem este padrão
    ├── models.py
    ├── views.py
    ├── serializers.py
    ├── urls.py
    ├── admin.py
    └── tests/
```

### Quando Usar
- Sempre que criar nova funcionalidade
- Quando funcionalidade tem models próprios
- Quando precisa de isolamento lógico

### Referências
- `backend/apps/`
- `docs/ARCHITECTURE.md`

---

## Padrão: Testes Junto ao App

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [testing, structure]
**Severidade**: high

### Descrição
Testes devem estar na pasta `tests/` dentro de cada app, não em pasta separada.

### Estrutura
```
backend/apps/leads/
├── models.py
├── views.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

### Quando Usar
- Sempre
- Facilita encontrar testes relacionados
- Mantém coesão do módulo

### Referências
- `backend/apps/leads/tests/`
- `.cursorrules`

---

## Padrão: Docstrings em Funções Públicas

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [documentation, code-quality]
**Severidade**: medium

### Descrição
Todas as funções e classes públicas devem ter docstrings descritivas.

### Formato
```python
def processar_lead(lead_id: int, tenant_id: int) -> dict[str, Any]:
    """
    Processa um lead específico e retorna resultado.

    Args:
        lead_id: ID do lead a processar
        tenant_id: ID do tenant (para validação)

    Returns:
        Dict com resultado do processamento

    Raises:
        Lead.DoesNotExist: Se lead não encontrado
    """
    # ...
```

### Quando Usar
- Funções públicas (não privadas com `_`)
- Classes públicas
- Métodos importantes

### Referências
- `.cursorrules`
- `AGENTS.md`

---

## Padrão: Nomenclatura de Testes

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [testing, naming]
**Severidade**: medium

### Descrição
Testes devem seguir padrão: `test_<funcionalidade>_<cenario>`.

### Exemplos
```python
def test_create_lead_success():
    """Testa criação bem-sucedida de lead."""
    # ...

def test_create_lead_invalid_email():
    """Testa criação com email inválido."""
    # ...

def test_list_leads_filtered_by_tenant():
    """Testa listagem filtrada por tenant."""
    # ...
```

### Quando Usar
- Todos os testes
- Facilita identificação de testes
- Melhora relatórios de cobertura

### Referências
- `backend/apps/leads/tests/`
- `AGENTS.md` (@007qa)

---

