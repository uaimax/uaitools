# Otimização de Busca no PostgreSQL - SupBrainNote

## 📊 Análise da Situação Atual

### Problema Identificado

A busca atual em `QueryViewSet.ask()` é **muito ineficiente**:

```python
# ❌ PROBLEMA: Busca em Python (O(n*m))
question_words = question.lower().split()
notes_list = []
for note in notes_queryset[:limit * 2]:  # Carrega TODAS as notas
    if any(word in note.transcript.lower() for word in question_words):
        notes_list.append(note)
```

**Problemas:**
1. **Carrega todas as notas** do banco (`limit * 2`) antes de filtrar
2. **Filtra em Python** ao invés de usar SQL
3. **Sem índices** para busca full-text no campo `transcript`
4. **Busca literal** (não semântica) - não encontra sinônimos ou conceitos relacionados

### Impacto de Performance

- **Com 100 notas**: ~200ms
- **Com 1.000 notas**: ~2s
- **Com 10.000 notas**: ~20s+ (inaceitável)

---

## 🚀 Soluções Recomendadas

### Opção 1: Full-Text Search do PostgreSQL (RECOMENDADO - Rápido)

**Vantagens:**
- ✅ Nativo do PostgreSQL (sem dependências extras)
- ✅ Muito mais rápido que busca Python
- ✅ Suporta ranking de relevância
- ✅ Fácil de implementar
- ✅ Funciona com português (com configuração)

**Desvantagens:**
- ❌ Ainda busca por palavras-chave (não semântica)
- ❌ Não entende sinônimos automaticamente

#### Implementação

1. **Adicionar extensão `pg_trgm`** (similaridade trigram) ou usar `tsvector` nativo:

```sql
-- Conectar ao PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

2. **Criar migration para índice GIN**:

```python
# backend/apps/supbrainnote/migrations/XXXX_add_fulltext_search.py
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('supbrainnote', '0001_initial'),  # Ajustar número
    ]

    operations = [
        # Adicionar campo de busca (opcional - pode usar SearchVector em tempo real)
        migrations.AddIndex(
            model_name='note',
            index=GinIndex(
                fields=['transcript'],
                name='note_transcript_gin_idx',
                opclasses=['gin_trgm_ops'],  # Para pg_trgm
            ),
        ),
    ]
```

3. **Atualizar QueryViewSet**:

```python
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import Q

# No método ask():
# Busca full-text com ranking
search_vector = SearchVector('transcript', config='portuguese')
search_query = SearchQuery(question, config='portuguese')

notes_queryset = Note.objects.annotate(
    search=search_vector,
    rank=SearchRank(search_vector, search_query)
).filter(
    workspace=workspace,
    processing_status="completed",
    transcript__isnull=False,
    search=search_query  # Busca full-text
).exclude(transcript="")

# Filtrar por caixinha se fornecido
if box_id:
    notes_queryset = notes_queryset.filter(box_id=box_id)

# Ordenar por relevância
notes_list = list(notes_queryset.order_by('-rank')[:limit])
```

**Performance esperada:**
- Com 10.000 notas: ~50-100ms (200x mais rápido)

---

### Opção 2: Vector Store com pgvector (AVANÇADO - Melhor qualidade)

**Vantagens:**
- ✅ **Busca semântica** - encontra notas similares mesmo sem palavras exatas
- ✅ Entende contexto e sinônimos
- ✅ Melhor relevância nas respostas
- ✅ Escalável para milhões de notas

**Desvantagens:**
- ❌ Requer extensão `pgvector` no PostgreSQL
- ❌ Precisa gerar embeddings (OpenAI API)
- ❌ Mais complexo de implementar
- ❌ Custo adicional (API de embeddings)

#### Implementação

1. **Instalar extensão pgvector no PostgreSQL**:

```sql
-- Conectar ao PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;
```

2. **Adicionar ao requirements.txt**:

```txt
pgvector>=0.2.0
django-pgvector>=0.1.0
```

3. **Criar migration**:

```python
# backend/apps/supbrainnote/migrations/XXXX_add_vector_embedding.py
from django.db import migrations
import pgvector.django

class Migration(migrations.Migration):
    dependencies = [
        ('supbrainnote', 'XXXX_add_fulltext_search'),  # Depois do full-text
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='transcript_embedding',
            field=pgvector.django.VectorField(
                dimensions=1536,  # OpenAI ada-002
                null=True,
                blank=True,
            ),
        ),
        migrations.AddIndex(
            model_name='note',
            index=pgvector.django.HnswIndex(
                fields=['transcript_embedding'],
                name='note_embedding_idx',
                m=16,
                ef_construction=64,
            ),
        ),
    ]
```

4. **Atualizar model**:

```python
# backend/apps/supbrainnote/models.py
import pgvector.django

class Note(UUIDPrimaryKeyMixin, WorkspaceModel):
    # ... campos existentes ...

    transcript_embedding = pgvector.django.VectorField(
        dimensions=1536,  # OpenAI ada-002
        null=True,
        blank=True,
    )
```

5. **Gerar embeddings na task de transcrição**:

```python
# backend/apps/supbrainnote/tasks.py
from openai import OpenAI

@shared_task
def transcribe_audio(note_id: str) -> Dict[str, Any]:
    # ... código de transcrição existente ...

    # Após transcrição bem-sucedida:
    if transcript:
        # Gerar embedding
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        embedding_response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=transcript
        )
        note.transcript_embedding = embedding_response.data[0].embedding
        note.save(update_fields=['transcript_embedding'])
```

6. **Atualizar QueryViewSet para busca vetorial**:

```python
from pgvector.django import L2Distance

# Gerar embedding da pergunta
question_embedding = generate_embedding(question)  # Função helper

# Busca por similaridade vetorial
notes_queryset = Note.objects.annotate(
    distance=L2Distance('transcript_embedding', question_embedding)
).filter(
    workspace=workspace,
    processing_status="completed",
    transcript_embedding__isnull=False,
).order_by('distance')[:limit]
```

**Performance esperada:**
- Com 10.000 notas: ~100-200ms
- Com 100.000 notas: ~500ms-1s
- **Qualidade**: Muito melhor (busca semântica)

---

## 📋 Recomendação de Implementação

### Fase 1: Full-Text Search (Imediato)
1. ✅ Implementar busca full-text com `pg_trgm` ou `tsvector`
2. ✅ Criar índices GIN
3. ✅ Atualizar `QueryViewSet.ask()`
4. ✅ Testar performance

**Tempo estimado**: 2-3 horas
**Impacto**: 100-200x mais rápido

### Fase 2: Vector Store (Futuro - quando necessário)
1. ✅ Instalar `pgvector` no PostgreSQL
2. ✅ Adicionar campo `transcript_embedding`
3. ✅ Gerar embeddings na task de transcrição
4. ✅ Atualizar busca para usar similaridade vetorial
5. ✅ Manter full-text como fallback

**Tempo estimado**: 1-2 dias
**Impacto**: Busca semântica + melhor qualidade

---

## 🔧 Outras Otimizações

### Índices Adicionais

```python
# Já existem índices bons, mas podemos adicionar:
class Meta:
    indexes = [
        # ... índices existentes ...
        # Índice para busca por transcript (full-text)
        GinIndex(
            fields=['transcript'],
            name='note_transcript_gin_idx',
            opclasses=['gin_trgm_ops'],
        ),
    ]
```

### Cache de Resultados

Para perguntas frequentes, considerar cache Redis:

```python
from django.core.cache import cache

cache_key = f"query:{workspace_id}:{hash(question)}"
cached_result = cache.get(cache_key)
if cached_result:
    return Response(cached_result)

# ... busca normal ...
cache.set(cache_key, result, timeout=3600)  # 1 hora
```

---

## 📊 Comparação de Soluções

| Solução | Velocidade | Qualidade | Complexidade | Custo |
|---------|-----------|----------|--------------|-------|
| **Atual (Python)** | ❌ Muito lenta | ⚠️ Básica | ✅ Simples | ✅ Grátis |
| **Full-Text Search** | ✅ Rápida | ⚠️ Boa | ✅ Simples | ✅ Grátis |
| **Vector Store** | ✅ Muito rápida | ✅ Excelente | ⚠️ Média | ⚠️ API costs |

---

## 🎯 Próximos Passos

1. **Imediato**: Implementar Full-Text Search (Opção 1)
2. **Futuro**: Avaliar necessidade de Vector Store baseado em:
   - Volume de notas (>10k)
   - Feedback dos usuários sobre qualidade
   - Necessidade de busca semântica

---

## 📚 Referências

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [pgvector - Vector Similarity Search](https://github.com/pgvector/pgvector)
- [Django Full-Text Search](https://docs.djangoproject.com/en/5.0/ref/contrib/postgres/search/)


