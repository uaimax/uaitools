# Guia de Setup do SupBrainNote

> **Versão**: 1.0.0
> **Data**: 2025-01-27

---

## 📋 Pré-requisitos

1. **Backend Django** rodando
2. **Frontend React** rodando
3. **Redis** rodando (para Celery)
4. **Celery Worker** rodando (para processamento assíncrono)
5. **OpenAI API Key** configurada

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no `.env` do backend:

```bash
# OpenAI (já configurado)
OPENAI_API_KEY=sk-...

# Celery (já configurado)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 2. Criar Migrations

```bash
cd backend
python manage.py makemigrations supbrainnote
python manage.py migrate
```

### 3. Iniciar Celery Worker

Em um terminal separado:

```bash
cd backend
celery -A config worker -l info
```

**Importante:** O Celery é necessário para processar transcrições e classificações de forma assíncrona.

### 4. Verificar Frontend

O frontend já está configurado. Apenas certifique-se de que está rodando:

```bash
cd frontend
npm run dev
```

---

## 🚀 Como Usar

### 1. Acessar o Módulo

1. Acesse `http://localhost:5173/admin/dashboard`
2. No menu lateral, clique em **"SupBrainNote"** (ícone de microfone)
3. Ou acesse diretamente: `http://localhost:5173/admin/supbrainnote`

### 2. Criar Primeira Caixinha

1. Clique no botão **"+ Nova"** na lista de caixinhas
2. Digite o nome (ex: "Casa", "Trabalho", "UAIZOUK")
3. Clique em **"Criar"**

### 3. Gravar Áudio

1. Na aba **"Gravar"**, clique e segure o botão de microfone
2. Fale sua anotação
3. Solte o botão para parar
4. Clique em **"Enviar"**

**O que acontece:**
- Áudio é enviado para o servidor
- Celery task `transcribe_audio` é disparada
- Transcrição é feita via Whisper API
- Após transcrição, task `classify_note` é disparada
- Anotação é classificada automaticamente em uma caixinha

### 4. Enviar Áudio de Arquivo

1. Clique no botão **"Enviar áudio"** no topo
2. Selecione o arquivo de áudio (.m4a, .mp3, .wav, .ogg)
3. Opcionalmente, selecione a caixinha de destino
4. Clique em **"Enviar"**

### 5. Consultar Anotações

1. Na aba **"Perguntar"**, digite sua pergunta
2. Exemplo: "O que já foi dito sobre o local do UAIZOUK?"
3. Clique em **"Perguntar"**
4. A IA responderá com base nas anotações

---

## 🔍 Verificar Funcionamento

### Backend

1. **Verificar migrations:**
   ```bash
   python manage.py showmigrations supbrainnote
   ```

2. **Verificar Celery:**
   ```bash
   # Deve mostrar tasks do supbrainnote
   celery -A config inspect registered
   ```

3. **Testar API:**
   ```bash
   # Listar caixinhas
   curl -H "Authorization: Bearer <token>" \
        -H "X-Workspace-ID: <workspace_id>" \
        http://localhost:8001/api/v1/supbrainnote/boxes/
   ```

### Frontend

1. **Verificar console do navegador** (F12)
2. **Verificar Network tab** para requisições
3. **Verificar se há erros** de importação

---

## 🐛 Troubleshooting

### Problema: "Migrations não encontradas"

**Solução:**
```bash
cd backend
python manage.py makemigrations supbrainnote
python manage.py migrate
```

### Problema: "Celery não processa tasks"

**Solução:**
1. Verificar se Redis está rodando: `redis-cli ping`
2. Verificar se Celery worker está rodando
3. Verificar logs do Celery para erros

### Problema: "Transcrição não funciona"

**Solução:**
1. Verificar se `OPENAI_API_KEY` está configurada
2. Verificar se há créditos na conta OpenAI
3. Verificar logs do backend para erros

### Problema: "Página não aparece no menu"

**Solução:**
1. Verificar se a rota está em `/admin/supbrainnote`
2. Recarregar a página (Ctrl+F5)
3. Verificar console do navegador para erros

### Problema: "Upload de áudio falha"

**Solução:**
1. Verificar se pasta `media/` existe e tem permissões
2. Verificar tamanho do arquivo (máximo 50MB)
3. Verificar formato do arquivo (.m4a, .mp3, .wav, .ogg)

---

## 📊 Estrutura de Dados

### Box (Caixinha)

- `id`: UUID
- `workspace_id`: ID do workspace
- `name`: Nome da caixinha
- `color`: Cor (hex, opcional)
- `description`: Descrição (opcional)
- `notes_count`: Quantidade de anotações (calculado)

### Note (Anotação)

- `id`: UUID
- `workspace_id`: ID do workspace
- `box_id`: ID da caixinha (null = inbox)
- `audio_file`: Arquivo de áudio
- `transcript`: Transcrição do áudio
- `source_type`: "memo" ou "group_audio"
- `processing_status`: "pending", "processing", "completed", "failed"
- `ai_confidence`: Confiança da classificação (0-1)
- `duration_seconds`: Duração do áudio
- `file_size_bytes`: Tamanho do arquivo

---

## 🔐 Segurança

- **Rate Limiting:**
  - Uploads: 10/hora por workspace
  - Consultas: 50/hora por workspace

- **Validação:**
  - Tipos de arquivo permitidos: .m4a, .mp3, .wav, .ogg, .webm
  - Tamanho máximo: 50MB
  - Tamanho mínimo: 1KB

- **Multi-tenancy:**
  - Todos os dados filtrados por workspace
  - Ownership validado automaticamente

---

## 📚 Referências

- `@docs/SUPBRAINNOTE_ARCHITECTURE.md` - Arquitetura detalhada
- `@backend/apps/supbrainnote/ANALYSIS.md` - Análise do módulo
- `@docs/ARCHITECTURE.md` - Decisões arquiteturais gerais

---

**Última atualização**: 2025-01-27


