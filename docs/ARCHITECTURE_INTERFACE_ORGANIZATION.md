# Arquitetura de Organização de Interfaces

> **Versão**: 1.0.0
> **Data**: 2025-01-27
> **Status**: ✅ Ativo

---

## 🎯 Princípio Central

**O dashboard `/admin` é para funcionalidades administrativas, não para hospedar módulos.**

Módulos podem e devem possuir **interfaces independentes** quando fazem sentido como produtos standalone.

---

## 📋 Regras de Organização

### `/admin/*` - Funcionalidades Administrativas

**Uso:** Apenas para funcionalidades administrativas e de gestão.

**Exemplos:**
- `/admin/dashboard` - Dashboard geral do sistema
- `/admin/leads` - Gestão de leads (CRUD administrativo)
- `/admin/settings` - Configurações do sistema
- `/admin/documents` - Documentos legais

**Características:**
- Usa `MainLayout` com sidebar de navegação
- Header com menus administrativos
- Breadcrumbs para navegação hierárquica
- Terminologia administrativa

### `/*` - Módulos Independentes

**Uso:** Módulos single-purpose que são produtos por si só.

**Exemplos:**
- `/bau-mental` - Anotador por voz (não é admin, é um app)
- `/investments` - Gestor de investimentos (produto standalone)
- `/chat` - Chat interno (se existir)

**Características:**
- Layout próprio, sem sidebar administrativa
- Interface focada na tarefa principal
- Zero cliques para ação principal
- Mobile-first

---

## 🏗️ Estrutura de Rotas

```
/admin/*          → Funcionalidades administrativas (MainLayout + Sidebar)
/bau-mental     → Módulo independente (Layout próprio)
/investments      → Módulo independente (Layout próprio)
/*                → Outros módulos independentes
```

---

## 📐 Padrões de Layout

### Layout Administrativo (`MainLayout`)

```typescript
<MainLayout>
  <Sidebar />      // Navegação entre módulos admin
  <Header />       // Menus administrativos
  <Content />      // Conteúdo administrativo
</MainLayout>
```

**Quando usar:**
- CRUD de recursos administrativos
- Configurações do sistema
- Dashboards de gestão
- Relatórios

### Layout de Módulo Independente

```typescript
<ModuleLayout>
  <MinimalHeader />  // Logo, busca, config
  <MainAction />     // Ação principal (ex: botão gravar)
  <SecondaryContent /> // Conteúdo secundário
</ModuleLayout>
```

**Quando usar:**
- Módulos single-purpose
- Apps focados em uma tarefa
- Produtos que não precisam de navegação complexa

---

## ✅ Checklist: Qual Layout Usar?

### Use `/admin/*` + `MainLayout` se:
- [ ] É uma funcionalidade administrativa
- [ ] Precisa de navegação entre múltiplas seções
- [ ] É um CRUD de recursos
- [ ] Usuário precisa ver múltiplas opções ao mesmo tempo

### Use `/*` + Layout próprio se:
- [ ] É um módulo single-purpose
- [ ] Ação principal deve ser imediata (zero cliques)
- [ ] Não precisa de navegação complexa
- [ ] É um produto standalone

---

## 📚 Exemplos

### ✅ Correto: bau_mental como módulo independente

```
/bau-mental
├── Layout próprio (sem sidebar)
├── Botão de gravar gigante
├── Interface focada na gravação
└── Zero cliques para começar
```

### ✅ Correto: Leads como funcionalidade admin

```
/admin/leads
├── MainLayout (com sidebar)
├── Lista de leads
├── Formulários de CRUD
└── Navegação administrativa
```

---

## 🔄 Migração de Módulos

Se um módulo está em `/admin/*` mas deveria ser independente:

1. **Criar layout próprio** do módulo
2. **Mover rota** de `/admin/module` para `/module`
3. **Remover** uso de `MainLayout`
4. **Simplificar** interface para ação principal
5. **Atualizar** links no menu (se necessário)

---

## 📝 Notas Importantes

- **Não misturar:** Módulos independentes não devem usar `MainLayout`
- **Consistência:** Cada tipo de interface tem seu propósito
- **UX:** Interfaces independentes devem ser mais simples e focadas
- **Mobile:** Módulos independentes devem ser mobile-first

---

## 🎯 Princípio Final

> **"Se é um produto, tem interface própria. Se é admin, vai para /admin."**

---

**Última atualização**: 2025-01-27



