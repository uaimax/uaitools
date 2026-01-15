# Setup Full-Text Search - Guia de Implementação

## ✅ O que foi implementado

1. **Migration `0005_add_fulltext_search.py`**
   - Cria extensão `pg_trgm` no PostgreSQL (se disponível)
   - Adiciona índice GIN para busca full-text no campo `transcript`

2. **QueryViewSet atualizado**
   - Usa busca full-text nativa do PostgreSQL (`tsvector`)
   - Fallback para similaridade trigram (`pg_trgm`) se disponível
   - Fallback para busca simples se extensões não estiverem disponíveis

## 🚀 Como aplicar

### 1. Aplicar migration

```bash
cd backend
python manage.py migrate bau_mental
```

### 2. Verificar extensão (opcional)

Se a migration falhar ao criar a extensão (falta de permissões), criar manualmente:

```sql
-- Conectar ao PostgreSQL
psql -U seu_usuario -d seu_banco

-- Criar extensão
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3. Verificar índices

```sql
-- Verificar se índice foi criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bau_mental_note'
AND indexname = 'note_transcript_gin_idx';
```

## 📊 Performance esperada

- **Antes**: ~2s para 1.000 notas
- **Depois**: ~50-100ms para 1.000 notas
- **Melhoria**: 20-40x mais rápido

## 🔍 Como funciona

### Busca Full-Text (tsvector)
- Usa `SearchVector` e `SearchQuery` do Django
- Configuração `portuguese` para melhor suporte ao português
- Ranking por relevância (`SearchRank`)

### Busca por Similaridade (pg_trgm)
- Fallback se full-text não encontrar resultados
- Usa similaridade trigram (funciona bem com erros de digitação)
- Threshold de 0.1 (ajustável)

### Fallback
- Se extensões não estiverem disponíveis, usa busca simples em Python
- Garante que sempre funciona, mesmo sem otimizações

## ⚠️ Notas importantes

1. **PostgreSQL obrigatório**: Full-text search só funciona com PostgreSQL
2. **SQLite**: Usa fallback automático (busca simples)
3. **Permissões**: Extensão `pg_trgm` requer permissões de superuser
4. **Índice**: Pode demorar para criar em tabelas grandes (primeira vez)

## 🧪 Testar

```python
# No shell do Django
python manage.py shell

from apps.bau_mental.models import Note
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

# Testar busca
notes = Note.objects.annotate(
    search=SearchVector('transcript', config='portuguese'),
    rank=SearchRank(SearchVector('transcript', config='portuguese'),
                   SearchQuery('sua pergunta', config='portuguese'))
).filter(
    search=SearchQuery('sua pergunta', config='portuguese')
).order_by('-rank')[:10]

print(f"Encontradas {notes.count()} notas")
```

## 📝 Próximos passos (opcional)

- Ajustar threshold de similaridade (atualmente 0.1)
- Adicionar cache para perguntas frequentes
- Considerar Vector Store (pgvector) para busca semântica futura


