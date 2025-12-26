# Contratos de Funcionalidades Críticas

> **Versão**: 1.0.0
> **Última atualização**: 2024-12
> **Propósito**: Definir contratos arquiteturais para funcionalidades críticas que serão implementadas nos produtos derivados

---

## O Que São Estes Contratos

Estes documentos definem **contratos arquiteturais** para funcionalidades que são críticas para os casos de uso do bootstrap, mas que **não serão implementadas no bootstrap em si** (seguindo YAGNI).

**Filosofia:**
- ✅ **DEFINIR** contratos agora (evita refatorações caras depois)
- ⏸️ **IMPLEMENTAR** depois (quando realmente necessário)

---

## Por Que Contratos São Importantes

Funcionalidades críticas que não são definidas antes de "congelar" o bootstrap podem causar:

1. **Refatorações caras** - Mudanças estruturais em models, middleware, permissões
2. **Inconsistências** - Cada produto derivado implementa de forma diferente
3. **Débito técnico** - Soluções temporárias que viram permanentes

**Exemplo:** Se não definirmos como módulos são ativados, cada produto pode criar sua própria solução, tornando impossível sincronizar melhorias do template.

---

## Contratos Disponíveis

### 1. Sistema de Módulos Ativáveis

**Arquivo:** [`MODULE_ACTIVATION.md`](MODULE_ACTIVATION.md)

**Quando usar:**
- SaaS modular com módulos opcionais por workspace
- Planos diferentes (básico vs premium) com módulos específicos
- Módulos com IA que precisam ser ativados por cliente

**O que define:**
- Model `WorkspaceModule` para controle de ativação
- Helpers para verificar módulos ativos
- Integração com RBAC existente

---

### 2. Formulários Dinâmicos

**Arquivo:** [`DYNAMIC_FORMS.md`](DYNAMIC_FORMS.md)

**Quando usar:**
- Formulários criados pelo usuário em runtime
- Formulários públicos para captura de leads
- Campos customizados por cliente

**O que define:**
- Models `DynamicForm` e `DynamicFormSubmission`
- Estrutura JSON para definição de campos
- Endpoints e validação dinâmica

---

## Como Usar Estes Contratos

### Para Implementar em Produto Derivado

1. **Leia o contrato completo** do arquivo correspondente
2. **Siga a estrutura definida** (models, helpers, convenções)
3. **Mantenha compatibilidade** com o bootstrap (herde de `WorkspaceModel`, use `WorkspaceViewSet`)
4. **Documente extensões** se precisar customizar além do contrato

### Exemplo de Uso

```python
# 1. Ler MODULE_ACTIVATION.md
# 2. Criar model conforme contrato
from apps.core.models import WorkspaceModel

class WorkspaceModule(WorkspaceModel):
    """Conforme contrato em docs/contracts/MODULE_ACTIVATION.md"""
    module_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=False)
    # ... resto conforme contrato

# 3. Usar helpers definidos no contrato
from apps.core.modules import is_module_active

if is_module_active(workspace, "leads"):
    # Módulo ativo, permitir acesso
    pass
```

---

## Princípios dos Contratos

### 1. Compatibilidade com Bootstrap

Todos os contratos assumem:
- Multi-tenancy via `WorkspaceModel`
- RBAC existente (`Role`, `User.get_permissions()`)
- ViewSets base (`WorkspaceViewSet`)
- Soft delete automático

### 2. Extensibilidade

Contratos permitem:
- Configurações por workspace (JSONField `config`)
- Customizações via herança
- Integração com módulos existentes

### 3. Simplicidade

Contratos são:
- **Mínimos** - Apenas o essencial
- **Claros** - Estrutura bem definida
- **Práticos** - Exemplos de uso incluídos

---

## Quando Criar Novo Contrato

Crie um novo contrato quando:

1. ✅ Funcionalidade é **crítica** para casos de uso declarados
2. ✅ Custo de adicionar depois é **alto** (refatoração estrutural)
3. ✅ Múltiplos produtos derivados **precisarão** da funcionalidade
4. ✅ Funcionalidade afeta **estrutura base** (models, middleware, permissões)

**Não crie contrato para:**
- Funcionalidades que podem ser adicionadas como app isolado
- Features específicas de um único produto
- Melhorias de performance ou UX

---

## Manutenção dos Contratos

### Atualizando Contratos

Se um produto derivado encontrar necessidade de mudança:

1. **Avalie** se a mudança beneficia outros produtos
2. **Documente** a mudança proposta
3. **Atualize** o contrato se aprovado
4. **Versionize** mudanças que quebram compatibilidade

### Versionamento

Contratos usam versionamento semântico:
- **MAJOR** - Mudanças que quebram compatibilidade
- **MINOR** - Novas funcionalidades compatíveis
- **PATCH** - Correções e clarificações

---

## Referências

- [`@docs/ARCHITECTURE.md`](../ARCHITECTURE.md) - Decisões arquiteturais gerais
- [`@docs/SHARED_VS_CUSTOMIZABLE.md`](../SHARED_VS_CUSTOMIZABLE.md) - Código compartilhado vs customizável
- [`@backend/apps/core/models.py`](../../backend/apps/core/models.py) - Models base
- [`@backend/apps/accounts/models.py`](../../backend/apps/accounts/models.py) - User, Workspace, Role

---

**Última atualização**: 2024-12
**Versão do Bootstrap**: 1.0.0


