# Plano de Refatoração: Componentes UI → Tailwind CSS Direto

**Data de Criação**: 2025-12-24
**Status**: 📋 Planejado
**Motivação**: Reduzir carga cognitiva para LLMs, menos código, evitar dependências problemáticas (Radix UI)

---

## 🎯 Objetivo

Refatorar todo o frontend para usar **Tailwind CSS direto** ao invés de componentes UI complexos, mantendo apenas componentes complexos quando absolutamente necessário.

**Benefícios Esperados:**
- ✅ Menos código (classes Tailwind vs componentes complexos)
- ✅ Menos carga cognitiva para LLMs
- ✅ Menos dependências (remover Radix UI)
- ✅ Mais controle sobre o código
- ✅ Melhor para vibe-coding

---

## 📊 Inventário Atual

### Componentes UI Instalados (21 componentes)

#### 🟢 **Simples - Substituir por Tailwind Direto**
1. **button** - Substituir por classes Tailwind
2. **input** - Substituir por `<input>` com classes Tailwind
3. **badge** - Substituir por `<span>` com classes Tailwind
4. **separator** - Substituir por `<hr>` ou `<div>` com classes Tailwind
5. **label** - Substituir por `<label>` com classes Tailwind
6. **textarea** - Substituir por `<textarea>` com classes Tailwind
7. **skeleton** - Substituir por classes Tailwind de animação
8. **alert** - Substituir por `<div>` com classes Tailwind

#### 🟡 **Médios - Criar Versões Tailwind Simples**
9. **card** - Criar componente simples com Tailwind
10. **avatar** - Criar componente simples com Tailwind
11. **checkbox** - Usar `<input type="checkbox">` com classes Tailwind

#### 🔴 **Complexos - Decidir Estratégia**
12. **dialog** - Manter ou usar alternativa (Headless UI?)
13. **alert-dialog** - Manter ou usar alternativa
14. **dropdown-menu** - Manter ou usar alternativa
15. **popover** - Manter ou usar alternativa
16. **select** - Manter ou usar alternativa (nativo com estilização?)
17. **command** - Manter ou remover (usado apenas em TenantSelector)
18. **form** - Manter (React Hook Form + Zod ainda necessário)
19. **table** - Criar versão Tailwind simples
20. **toast** - Manter (funcionalidade complexa) ou usar alternativa
21. **toaster** - Manter se toast for mantido

#### 🟣 **Custom**
22. **social-button** - Refatorar para Tailwind direto

---

## 🗺️ Estratégia de Migração

### Fase 1: Componentes Base Simples (Prioridade Alta)
**Objetivo**: Substituir componentes mais usados e simples

**Componentes:**
- ✅ button
- ✅ input
- ✅ badge
- ✅ label
- ✅ separator
- ✅ textarea

**Ação**: Criar versões Tailwind direto, substituir imports, remover componentes UI antigos.

**Estimativa**: 2-3 horas

---

### Fase 2: Componentes Médios (Prioridade Média)
**Objetivo**: Substituir componentes que precisam de estrutura mas são simples

**Componentes:**
- ✅ card
- ✅ alert
- ✅ avatar
- ✅ checkbox
- ✅ skeleton

**Ação**: Criar componentes simples com Tailwind, manter mesma API quando possível.

**Estimativa**: 2-3 horas

---

### Fase 3: Componentes Complexos - Decisão (Prioridade Baixa)
**Objetivo**: Decidir estratégia para componentes que requerem lógica complexa

**Componentes:**
- ⚠️ dialog / alert-dialog
- ⚠️ dropdown-menu
- ⚠️ popover
- ⚠️ select
- ⚠️ command
- ⚠️ toast / toaster
- ⚠️ form (manter - necessário para React Hook Form)

**Estratégias Possíveis:**

1. **Manter componentes UI complexos apenas para estes** (híbrido)
   - Prós: Funcionalidade complexa já pronta
   - Contras: Ainda depende de Radix UI

2. **Substituir por alternativas**
   - Headless UI (Tailwind Labs) - sem estilos, apenas lógica
   - React Aria (Adobe) - apenas acessibilidade
   - Componentes nativos estilizados

3. **Criar versões próprias simples**
   - Prós: Controle total
   - Contras: Mais trabalho, pode perder acessibilidade

**Recomendação**: Manter componentes UI complexos apenas para Dialog, Dropdown, Popover, Select e Toast. Remover o resto.

**Estimativa**: 3-4 horas (dependendo da estratégia)

---

### Fase 4: Limpeza e Otimização (Prioridade Baixa)
**Objetivo**: Remover dependências não utilizadas e atualizar documentação

**Ações:**
- Remover componentes UI não utilizados
- Remover dependências Radix UI não utilizadas
- Atualizar documentação
- Atualizar `.context/` com novos padrões
- Atualizar `ANALYSIS.md`

**Estimativa**: 1-2 horas

---

## 📝 Padrões de Substituição

### Button → Tailwind Direto

**Antes (componentes UI):**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">Click me</Button>
```

**Depois (Tailwind direto):**
```tsx
<button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
  Click me
</button>
```

**Ou criar componente simples:**
```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  }

  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8"
  }

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  )
}
```

### Input → Tailwind Direto

**Antes:**
```tsx
import { Input } from "@/components/ui/input"
<Input placeholder="Email" />
```

**Depois:**
```tsx
<input
  type="text"
  placeholder="Email"
  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
/>
```

### Card → Componente Simples Tailwind

**Antes:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Depois:**
```tsx
// Componente simples
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div className="flex flex-col space-y-1.5 p-6">
    <h3 className="text-2xl font-semibold leading-none tracking-tight">Title</h3>
  </div>
  <div className="p-6 pt-0">Content</div>
</div>
```

---

## 🎨 Design System Tailwind

Criar arquivo de configuração com classes reutilizáveis:

```typescript
// lib/tailwind-variants.ts
export const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  sizes: {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8"
  }
}
```

---

## 📋 Checklist de Execução

### Fase 1: Componentes Simples
- [ ] Criar versões Tailwind de: button, input, badge, label, separator, textarea
- [ ] Substituir imports em todos os arquivos
- [ ] Testar visualmente cada componente
- [ ] Remover componentes UI antigos
- [ ] Atualizar testes (se houver)

### Fase 2: Componentes Médios
- [ ] Criar versões Tailwind de: card, alert, avatar, checkbox, skeleton
- [ ] Substituir imports
- [ ] Testar funcionalidade
- [ ] Remover componentes UI antigos

### Fase 3: Componentes Complexos
- [ ] Decidir estratégia para cada componente complexo
- [ ] Implementar estratégia escolhida
- [ ] Testar acessibilidade
- [ ] Documentar decisões

### Fase 4: Limpeza
- [ ] Remover dependências Radix UI não utilizadas
- [ ] Atualizar `package.json`
- [ ] Atualizar documentação
- [ ] Atualizar `.context/` com novos padrões
- [ ] Atualizar `ANALYSIS.md`
- [ ] Remover `components.json` (se não for mais necessário)

---

## 🚨 Riscos e Mitigações

### Riscos

1. **Perda de Acessibilidade**
   - *Mitigação*: Implementar ARIA manualmente, testar com screen readers

2. **Inconsistência Visual**
   - *Mitigação*: Criar design system com classes reutilizáveis

3. **Mais Código Inicial**
   - *Mitigação*: Criar componentes base simples, reutilizar

4. **Tempo de Desenvolvimento**
   - *Mitigação*: Fazer em fases, priorizar componentes mais usados

### Benefícios

1. ✅ Menos dependências
2. ✅ Menos código (no longo prazo)
3. ✅ Mais controle
4. ✅ Melhor para LLMs
5. ✅ Mais fácil de manter

---

## 📚 Referências

- [Deep Research: Componentes UI vs Tailwind](docs/research/2025-12-24-frontend-vibe-coding-shadcn-vs-tailwind.md) (arquivo histórico)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Headless UI (alternativa)](https://headlessui.com/)

---

## 🎯 Próximos Passos

1. **Revisar este plano** e ajustar se necessário
2. **Começar Fase 1** - Componentes simples
3. **Testar cada fase** antes de prosseguir
4. **Documentar aprendizados** em `.context/`

---

**Status**: 📋 Aguardando aprovação para iniciar Fase 1

