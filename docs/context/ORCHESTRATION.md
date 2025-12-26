# Orquestração Entre Agentes

> **Última atualização**: 2024-12
> **Propósito**: Definir protocolo de handoff e orquestração entre agentes @007

---

## 🎯 Propósito

Este documento define como os **agentes especializados @007** devem interagir entre si, fazer handoff, escalar problemas e resolver conflitos.

**Referência completa**: `@AGENTS.md`

---

## 🔄 Protocolo de Handoff

### Formato Padrão

Quando um agente precisa passar trabalho para outro, use este formato:

```markdown
## HANDOFF: @007origem → @007destino

### Contexto
[Resumo do que foi feito]

### Entregáveis
- [Lista de arquivos/mudanças]

### Próximos Passos
- [O que o agente destino deve fazer]

### Riscos/Atenção
- [Pontos de atenção]
```

### Regras de Handoff

1. **Sempre documentar** o que foi feito
2. **Passar contexto completo** (não assumir conhecimento)
3. **Identificar riscos** encontrados
4. **Sugerir próximos passos** claros
5. **Incluir referências** relevantes

---

## 📊 Fluxos Comuns de Handoff

### Desenvolvimento Backend

```
@007architect → @007backend → @007qa → @007security → @007docs
```

**Exemplo**:
1. `@007architect` define estrutura
2. `@007backend` implementa
3. `@007qa` valida testes
4. `@007security` revisa segurança
5. `@007docs` documenta

---

### Desenvolvimento Frontend

```
@007architect → @007frontend → @007qa → @007docs
```

**Exemplo**:
1. `@007architect` define estrutura
2. `@007frontend` implementa
3. `@007qa` valida testes
4. `@007docs` documenta

---

### Análise e Descoberta

```
@007explorer → @007architect → [agente especializado]
```

**Exemplo**:
1. `@007explorer` analisa código
2. `@007architect` decide estrutura
3. Agente especializado implementa

---

## ⚖️ Resolução de Conflitos

### Hierarquia de Decisão

```
1. @007security    — Veto em questões de segurança
2. @007architect   — Decisões estruturais
3. Agente do domínio específico
4. Humano (sempre pode overridar)
```

### Processo de Conflito

1. **Identificar**: Documentar posições conflitantes
2. **Escalar**: Subir para agente de maior hierarquia
3. **Decidir**: Agente sênior decide com justificativa
4. **Documentar**: Registrar decisão e razão

---

## 🚨 Escalonamento

### Quando Escalar

Escale para agente superior quando:

1. **Conflito de decisão** entre agentes
2. **Área protegida** envolvida (zona vermelha/amarela)
3. **Mudança estrutural** necessária
4. **Risco de segurança** identificado
5. **Dúvida sobre impacto** em outros módulos

### Como Escalar

```markdown
## ESCALATION: @007origem → @007destino

### Motivo
[Por que está escalando]

### Contexto
[O que foi tentado]

### Decisão Necessária
[O que precisa ser decidido]

### Opções Consideradas
- [Opção 1]
- [Opção 2]
```

---

## 🔄 Máquina de Estados

### Fluxo de Trabalho LLM

```
DISCOVERY → ANALYSIS → DESIGN → PLAN → IMPLEMENTATION → REVIEW
```

#### DISCOVERY
- **Agente**: `@007explorer`
- **Ação**: Entender contexto, ler `ANALYSIS.md`, mapear dependências

#### ANALYSIS
- **Agente**: `@007explorer` ou agente especializado
- **Ação**: Analisar impacto, identificar riscos, avaliar alternativas

#### DESIGN
- **Agente**: `@007architect`
- **Ação**: Definir estrutura, padrões, decisões arquiteturais

#### PLAN
- **Agente**: Agente especializado
- **Ação**: Criar plano detalhado, aguardar aprovação (se zona amarela/vermelha)

#### IMPLEMENTATION
- **Agente**: Agente especializado (`@007backend`, `@007frontend`)
- **Ação**: Implementar código seguindo plano

#### REVIEW
- **Agente**: `@007qa`, `@007security`
- **Ação**: Validar testes, revisar segurança, garantir qualidade

---

## 📋 Matriz de Responsabilidades (RACI)

| Atividade | architect | backend | frontend | security | qa | devops | explorer | docs |
|-----------|:---------:|:-------:|:--------:|:--------:|:--:|:------:|:--------:|:----:|
| Arquitetura | **R** | C | C | C | I | C | I | I |
| APIs | C | **R** | C | C | C | I | I | I |
| UI/UX | C | I | **R** | I | C | I | I | I |
| Segurança | C | C | C | **R** | C | C | I | I |
| Testes | I | C | C | I | **R** | I | I | I |
| Deploy | C | I | I | C | I | **R** | I | I |
| Análise | C | I | I | I | I | I | **R** | C |
| Docs | I | C | C | I | I | I | C | **R** |

**R** = Responsável | **C** = Consultado | **I** = Informado

---

## 🔗 Referências Cruzadas

### Agentes Especializados

- `@AGENTS.md` — Definição completa de todos os agentes
- `@AGENTS.md#007architect` — Agente arquiteto
- `@AGENTS.md#007backend` — Agente backend
- `@AGENTS.md#007frontend` — Agente frontend
- `@AGENTS.md#007security` — Agente segurança
- `@AGENTS.md#007qa` — Agente qualidade
- `@AGENTS.md#007devops` — Agente devops
- `@AGENTS.md#007explorer` — Agente explorador
- `@AGENTS.md#007docs` — Agente documentador

### Contexto

- `@CLAUDE.md` — Contexto global
- `@docs/context/PROTECTED_AREAS.md` — Áreas protegidas
- `@docs/context/STATE_MACHINE.md` — Máquina de estados detalhada

---

## ⚠️ Lembrete Final

> **Todo agente deve:**
>
> 1. ✅ Respeitar zonas de proteção
> 2. ✅ Ler contexto antes de agir
> 3. ✅ Documentar o que fez
> 4. ✅ Fazer handoff adequado
> 5. ✅ Escalar quando em dúvida

**Na dúvida, pergunte ao humano.**




