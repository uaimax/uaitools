# .context/ - Aprendizados e Soluções do Backend

Esta pasta contém **aprendizados documentados** específicos do **backend Django** para evitar que a LLM (e desenvolvedores) repitam os mesmos erros ou dificuldades já enfrentadas.

## 📁 Estrutura

- **`learnings.md`** - Histórico de aprendizados positivos (o que funcionou bem)
- **`mistakes.md`** - Erros comuns e suas soluções
- **`patterns.md`** - Padrões identificados que devem ser seguidos
- **`anti-patterns.md`** - Padrões que devem ser evitados
- **`security-patterns.md`** - ⚠️ **Padrões obrigatórios de segurança** (consultar sempre!)

## 🎯 Como Usar

### Para a LLM

A LLM deve:
1. **Ler `security-patterns.md` PRIMEIRO** antes de criar/modificar ViewSets, Serializers ou código de segurança
2. **Ler esta pasta** antes de fazer mudanças no backend
3. **Documentar automaticamente** quando resolver um problema novo no backend
4. **Consultar** antes de implementar soluções similares

### Para Desenvolvedores

1. **Adicionar** aprendizados importantes manualmente
2. **Revisar** periodicamente (mensalmente) para limpeza
3. **Consultar** antes de implementar features similares

## 📝 Formato Padrão

Cada entrada deve seguir este formato:

```markdown
---
date: YYYY-MM-DD
category: [django|drf|database|api|general]
tags: [tag1, tag2]
severity: [low|medium|high|critical]
---

## [Título Descritivo]

### Contexto
[O que estava sendo feito quando o problema/aprendizado ocorreu]

### Problema/Aprendizado
[Descrição clara do problema ou aprendizado]

### Solução
[Como foi resolvido ou implementado]

### Lições Aprendidas
[O que evitar no futuro, padrões a seguir]

### Referências
- Arquivos: `path/to/file.py`
- Issues: #123
- Docs: `docs/ARCHITECTURE.md`
```

## 🔄 Processo de Manutenção

1. **Adição Automática**: LLM adiciona automaticamente após resolver problemas
2. **Revisão Mensal**: Limpar entradas obsoletas, consolidar similares
3. **Priorização**: Manter apenas aprendizados relevantes (severity: medium+)

## ⚠️ Importante

- **Não duplicar** informações já em `.cursorrules` ou `docs/`
- **Focar** em aprendizados específicos do backend Django/DRF
- **Manter** formato consistente para facilitar parsing da LLM
- **Versionar** tudo no Git

## 🔗 Estrutura Geral do Projeto

- `backend/.context/` - Aprendizados do backend (esta pasta)
- `frontend/.context/` - Aprendizados do frontend
- `.context/` (raiz) - Aprendizados gerais (devops, etc)

