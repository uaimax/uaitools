# Máquina de Estados — Fluxo de Trabalho LLM

> **Última atualização**: 2024-12
> **Propósito**: Definir estados e transições do fluxo de trabalho LLM

---

## 🎯 Propósito

Este documento define a **máquina de estados** que guia o fluxo de trabalho de LLMs no repositório, desde a descoberta até a implementação e revisão.

**Referência**: `@CLAUDE.md` — Workflow de Trabalho

---

## 🔄 Estados Principais

```
DISCOVERY → ANALYSIS → DESIGN → PLAN → IMPLEMENTATION → REVIEW → [FINAL]
```

---

## 📍 Estado 1: DISCOVERY

### Objetivo
Entender o contexto e mapear o que precisa ser feito.

### Agente Responsável
- `@007explorer` (análise inicial)
- Agente especializado (análise específica)

### Ações Obrigatórias

1. **Ler contexto**
   - `@CLAUDE.md` — Contexto global
   - `@AGENTS.md` — Agentes disponíveis
   - `ANALYSIS.md` do módulo atual
   - `@docs/context/PROTECTED_AREAS.md` — Áreas protegidas

2. **Mapear dependências**
   - Identificar módulos afetados
   - Identificar zonas de proteção
   - Identificar riscos

3. **Entender requisitos**
   - O que precisa ser feito?
   - Por quê?
   - Qual o impacto?

### Saída Esperada
- Resumo do contexto
- Lista de dependências
- Identificação de riscos
- Recomendação de próximo estado

### Transições Possíveis
- → `ANALYSIS` (se precisa análise mais profunda)
- → `DESIGN` (se estrutura já está clara)
- → `PLAN` (se implementação é direta)

---

## 📍 Estado 2: ANALYSIS

### Objetivo
Analisar impacto, avaliar alternativas e identificar riscos.

### Agente Responsável
- `@007explorer` (análise geral)
- `@007architect` (análise arquitetural)
- Agente especializado (análise específica)

### Ações Obrigatórias

1. **Analisar impacto**
   - Quais módulos serão afetados?
   - Quais são os riscos?
   - Quais são as dependências?

2. **Avaliar alternativas**
   - Quais são as opções?
   - Quais são os trade-offs?
   - Qual é a melhor opção?

3. **Identificar riscos**
   - Áreas protegidas envolvidas?
   - Mudanças estruturais necessárias?
   - Riscos de segurança?

### Saída Esperada
- Análise de impacto
- Alternativas avaliadas
- Riscos identificados
- Recomendação de próximo estado

### Transições Possíveis
- → `DESIGN` (se precisa definir estrutura)
- → `PLAN` (se implementação é direta)
- → `DISCOVERY` (se precisa mais contexto)

---

## 📍 Estado 3: DESIGN

### Objetivo
Definir estrutura, padrões e decisões arquiteturais.

### Agente Responsável
- `@007architect` (sempre)

### Ações Obrigatórias

1. **Definir estrutura**
   - Onde colocar o código?
   - Quais padrões seguir?
   - Como organizar?

2. **Estabelecer padrões**
   - Convenções de código
   - Padrões de design
   - Boas práticas

3. **Documentar decisões**
   - ADR (Architecture Decision Record)
   - Atualizar `@docs/ARCHITECTURE.md` se necessário

### Saída Esperada
- Estrutura definida
- Padrões estabelecidos
- Decisões documentadas
- Recomendação de próximo estado

### Transições Possíveis
- → `PLAN` (próximo passo)

---

## 📍 Estado 4: PLAN

### Objetivo
Criar plano detalhado de implementação.

### Agente Responsável
- Agente especializado (`@007backend`, `@007frontend`, etc)

### Ações Obrigatórias

1. **Criar plano detalhado**
   - Passos de implementação
   - Arquivos a modificar/criar
   - Testes necessários

2. **Verificar zona de proteção**
   - Zona vermelha? → PARAR e solicitar autorização
   - Zona amarela? → Criar PLAN e aguardar aprovação
   - Zona verde? → Prosseguir

3. **Aguardar aprovação** (se zona amarela/vermelha)

### Saída Esperada
- Plano detalhado
- Lista de arquivos
- Testes planejados
- Aprovação (se necessário)

### Transições Possíveis
- → `IMPLEMENTATION` (após aprovação)
- → `DESIGN` (se plano não está claro)

---

## 📍 Estado 5: IMPLEMENTATION

### Objetivo
Implementar código seguindo o plano.

### Agente Responsável
- Agente especializado (`@007backend`, `@007frontend`, etc)

### Ações Obrigatórias

1. **Implementar código**
   - Seguir plano
   - Seguir convenções
   - Manter arquivos < 300 linhas

2. **Seguir invariantes**
   - Multi-tenancy respeitado
   - Type hints em funções
   - Docstrings em funções públicas
   - Testes junto ao código

3. **Validar incrementalmente**
   - Testes passando
   - Linting OK
   - Sem erros de tipo

### Saída Esperada
- Código implementado
- Testes passando
- Linting OK
- Recomendação de próximo estado

### Transições Possíveis
- → `REVIEW` (próximo passo)

---

## 📍 Estado 6: REVIEW

### Objetivo
Validar qualidade, segurança e testes.

### Agente Responsável
- `@007qa` (qualidade e testes)
- `@007security` (segurança)
- `@007docs` (documentação)

### Ações Obrigatórias

1. **Validar testes**
   - Cobertura adequada?
   - Testes passando?
   - Edge cases cobertos?

2. **Revisar segurança**
   - Vulnerabilidades?
   - Validação de inputs?
   - Proteção de dados?

3. **Validar documentação**
   - `ANALYSIS.md` atualizado?
   - Docstrings completas?
   - README atualizado?

### Saída Esperada
- Validação completa
- Issues identificados (se houver)
- Aprovação ou correções necessárias

### Transições Possíveis
- → `IMPLEMENTATION` (se correções necessárias)
- → `[FINAL]` (se tudo OK)

---

## 📍 Estado 7: [FINAL]

### Objetivo
Tarefa concluída.

### Ações Finais

1. **Documentar conclusão**
   - O que foi feito
   - Arquivos modificados
   - Testes adicionados

2. **Atualizar contexto**
   - `ANALYSIS.md` se necessário
   - `.context/` se aprendizado novo
   - **`.context/milestones.md` se for marco importante** (fase, commit estrutural, push)

3. **Handoff** (se necessário)
   - Para próximo agente
   - Para humano

---

## 🔄 Transições Especiais

### Rollback
Se algo der errado, pode voltar para estado anterior:
- `IMPLEMENTATION` → `PLAN` (se implementação não está correta)
- `PLAN` → `DESIGN` (se plano não está claro)
- `DESIGN` → `ANALYSIS` (se design não está adequado)

### Escalonamento
Se encontrar problema que não pode resolver:
- Escalar para agente superior
- Escalar para humano

---

## 📋 Checklist por Estado

### DISCOVERY
- [ ] Li `@CLAUDE.md`
- [ ] Li `ANALYSIS.md` do módulo
- [ ] Identifiquei zonas de proteção
- [ ] Mapeei dependências

### ANALYSIS
- [ ] Analisei impacto
- [ ] Avaliei alternativas
- [ ] Identifiquei riscos

### DESIGN
- [ ] Defini estrutura
- [ ] Estabeleci padrões
- [ ] Documentei decisões

### PLAN
- [ ] Criei plano detalhado
- [ ] Verifiquei zona de proteção
- [ ] Aguardei aprovação (se necessário)

### IMPLEMENTATION
- [ ] Implementei código
- [ ] Testes passando
- [ ] Linting OK

### REVIEW
- [ ] Testes validados
- [ ] Segurança revisada
- [ ] Documentação atualizada

---

## 📚 Referências

- `@CLAUDE.md` — Contexto global e workflow
- `@AGENTS.md` — Agentes especializados
- `@docs/context/ORCHESTRATION.md` — Orquestração entre agentes
- `@docs/context/PROTECTED_AREAS.md` — Áreas protegidas

---

## ⚠️ Lembrete Final

> **Sempre seguir a máquina de estados.**
>
> Pular estados pode levar a problemas. Se em dúvida, voltar ao estado anterior.



