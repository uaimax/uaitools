# Contexto Geral

Esta pasta contém aprendizados gerais que afetam o projeto como um todo (devops, scripts, integração).

## 📁 Arquivos

- `mistakes.md` - Erros já enfrentados e soluções
- `learnings.md` - Soluções que funcionaram bem
- `patterns.md` - Padrões identificados
- `anti-patterns.md` - O que evitar
- `milestones.md` - **Marcos importantes do projeto** (fases, commits, pushes, freezes)

## 🎯 Quando Usar

Consulte esta pasta antes de:
- Configurar scripts de automação
- Resolver problemas de deploy/CI/CD
- Configurar ferramentas de desenvolvimento (tmux, etc)
- Problemas que afetam backend E frontend
- Configuração de ambiente
- **SEMPRE consultar `milestones.md` antes de começar trabalho** para entender estado atual

**Documente em `milestones.md` quando:**
- Concluir uma fase do projeto
- Fazer commit que muda estrutura significativamente
- Fazer push importante (versão, freeze)
- Finalizar funcionalidade crítica

## 📝 Formato

Cada entrada segue o formato:

```markdown
---
date: YYYY-MM-DD
category: [devops|general]
tags: [tag1, tag2]
severity: [low|medium|high|critical]
---

## [Título]

### Contexto
...

### Problema/Aprendizado
...

### Solução
...

### Lições Aprendidas
...

### Referências
...
```



