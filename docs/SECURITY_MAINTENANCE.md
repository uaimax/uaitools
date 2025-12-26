# Manutenção de Segurança - Guia para LLMs

**Objetivo:** Este documento orienta LLMs a manter padrões de segurança ao fazer manutenção no código.

---

## 🎯 Princípios Fundamentais

1. **Segurança por construção**: Padrões devem ser aplicados desde o início
2. **Validação explícita**: Não confiar apenas em filtros automáticos
3. **Documentação clara**: Padrões devem ser fáceis de seguir

---

## 📚 Onde Consultar

### Antes de Criar/Modificar Código

1. **`backend/.context/security-patterns.md`** - Padrões obrigatórios
2. **`backend/.context/mistakes.md`** - Erros comuns a evitar
3. **`backend/.context/anti-patterns.md`** - O que não fazer

### Durante Code Review

1. Verificar se `WorkspaceObjectPermission` está presente
2. Verificar se `read_only_fields` está definido
3. Verificar se query parameters são validados
4. Verificar se não há logging de dados sensíveis

---

## ✅ Checklist de Segurança

### Ao Criar Novo ViewSet

- [ ] Herda de `WorkspaceViewSet` se precisa multi-tenancy?
- [ ] Inclui `WorkspaceObjectPermission` em `permission_classes`?
- [ ] Query parameters são validados?
- [ ] Não usa `.extra()` ou `.raw()` sem sanitização?

### Ao Criar Novo Serializer

- [ ] `read_only_fields` definido explicitamente?
- [ ] Campos sensíveis estão protegidos?
- [ ] Campos de texto livre usam sanitização (se necessário)?

### Ao Adicionar Logging

- [ ] Não loga dados sensíveis diretamente?
- [ ] Usa `extra={}` para contexto estruturado?
- [ ] Campos sensíveis serão redigidos automaticamente?

### Ao Trabalhar com Queries

- [ ] Sempre filtra por `workspace` (se WorkspaceModel)?
- [ ] Usa Django ORM (não SQL raw)?
- [ ] Query parameters validados?

---

## 🔗 Referências Rápidas

- **Padrões:** `backend/.context/security-patterns.md`
- **Erros:** `backend/.context/mistakes.md`
- **Anti-patterns:** `backend/.context/anti-patterns.md`
- **Análise:** `docs/SECURITY_ANALYSIS.md`
- **Implementação:** `docs/SECURITY_IMPLEMENTATION.md`

---

**Última atualização:** 2025-12-24




