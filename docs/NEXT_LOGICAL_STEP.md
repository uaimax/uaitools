# Próximo Passo Lógico - Análise

## 📊 Estado Atual

### ✅ Implementado (Crítico)
1. Validação de Ownership (IDOR Prevention)
2. Filtro de Dados Sensíveis em Logs
3. Validação de Formato do Workspace Header

### 📝 Documentado
4. Sanitização de Input - Padrão documentado
5. Mass Assignment Prevention - Já correto nos serializers
6. Query Params Validation - Padrão documentado

---

## 🔍 Análise do Código Atual

### Campo `notes` em Lead
- **Tipo:** `TextField` (texto livre)
- **Risco:** Pode conter HTML/JavaScript (XSS stored)
- **Status:** Não sanitizado
- **Prioridade:** 🟡 Média (pode esperar)

### Query Parameter `status` em LeadViewSet
- **Uso:** `status = self.request.query_params.get("status")`
- **Validação:** ❌ Não valida contra `STATUS_CHOICES`
- **Risco:** Permite valores inválidos, pode causar erros
- **Prioridade:** 🟡 Média (não crítico, mas melhora qualidade)

---

## 🎯 Próximo Passo Lógico

### Opção 1: Validar Query Parameters (Recomendado)
**Por quê:**
- ✅ Custo baixo (~5 linhas)
- ✅ Previne erros e melhora qualidade
- ✅ Alinha com padrão documentado
- ✅ Campo `status` já tem `STATUS_CHOICES` definidos

**Implementação:**
```python
# apps/leads/viewsets.py
def get_queryset(self):
    queryset = super().get_queryset()

    # Validar status contra choices
    status = self.request.query_params.get("status")
    if status:
        valid_statuses = [choice[0] for choice in Lead.STATUS_CHOICES]
        if status in valid_statuses:
            queryset = queryset.filter(status=status)

    # ... resto do código
```

**Benefícios:**
- Previne erros de valores inválidos
- Melhora qualidade do código
- Segue padrão documentado
- Custo muito baixo

---

### Opção 2: Implementar Sanitização para `notes`
**Por quê:**
- ✅ Previne XSS stored
- ✅ Campo já existe e pode conter HTML
- ⚠️ Requer adicionar dependência `bleach`
- ⚠️ Custo médio

**Implementação:**
- Criar `SanitizedCharField` em `apps/core/serializers.py`
- Aplicar em `LeadSerializer.notes`
- Adicionar `bleach` ao `requirements.txt`

**Benefícios:**
- Previne XSS stored
- Padrão já documentado
- Pode ser feito depois sem grande custo

---

### Opção 3: Testes de Integração
**Por quê:**
- ✅ Valida que proteções funcionam end-to-end
- ✅ Garante que nada quebrou
- ⚠️ Custo médio-alto
- ⚠️ Pode esperar (testes unitários já existem)

---

## 📊 Comparação

| Opção | Custo | Benefício | Prioridade | Quando |
|-------|-------|-----------|------------|--------|
| 1. Validar Query Params | 🟢 Baixo | 🟡 Médio | 🟡 Média | **AGORA** |
| 2. Sanitização `notes` | 🟡 Médio | 🟡 Médio | 🟡 Média | Quando necessário |
| 3. Testes Integração | 🟡 Médio | 🟢 Alto | 🟢 Baixa | Antes de produção |

---

## 🎯 Recomendação

**Próximo passo lógico: Validar Query Parameters no LeadViewSet**

**Razões:**
1. ✅ Custo muito baixo (~5 linhas)
2. ✅ Melhora qualidade imediatamente
3. ✅ Alinha com padrão documentado
4. ✅ Previne erros de valores inválidos
5. ✅ Não requer dependências externas

**Depois disso:**
- Sanitização de `notes` quando necessário
- Testes de integração antes de produção

---

**Conclusão:** Validar query parameters é o próximo passo mais lógico - rápido, melhora qualidade, e segue padrões já documentados.




