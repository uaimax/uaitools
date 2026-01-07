# Configuração do Cloudflare R2 no CapRover

## 📋 Visão Geral

O SupBrainNote usa Cloudflare R2 para armazenar arquivos de áudio. O storage tem fallback automático para sistema de arquivos local se R2 não estiver configurado.

## 🔧 Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no app **backend** do CapRover:

```bash
# Cloudflare R2 - Obrigatórias
R2_ACCOUNT_ID=seu-account-id-aqui
R2_ACCESS_KEY_ID=sua-access-key-aqui
R2_SECRET_ACCESS_KEY=sua-secret-key-aqui
R2_BUCKET=nome-do-bucket-aqui

# Cloudflare R2 - Opcional
R2_CUSTOM_DOMAIN=https://cdn.seudominio.com  # Se tiver domínio customizado
```

## ✅ Como Obter as Credenciais

1. **Acesse o Cloudflare Dashboard**
2. **Vá em R2 → Manage R2 API Tokens**
3. **Crie um novo token:**
   - Permissões: Object Read & Write
   - Bucket: Selecione o bucket desejado
4. **Anote:**
   - Account ID (encontrado na URL ou no dashboard)
   - Access Key ID
   - Secret Access Key
   - Bucket Name

## 🔍 Verificar Configuração

Após configurar as variáveis, faça deploy e verifique os logs:

```bash
# Ver logs do backend
caprover logs -a ut-be --tail 50
```

**Sinais de que está funcionando:**
- ✅ Uploads de áudio são salvos sem erro
- ✅ Transcrições processam corretamente
- ✅ Não há erros de "No such file or directory" relacionados a storage

**Sinais de problema:**
- ❌ Erro: `FileNotFoundError: [Errno 2] No such file or directory: '/app/media/...'`
- ❌ Avisos de fallback para storage local
- ❌ Transcrições falhando com erro de arquivo não encontrado

## 🚨 Troubleshooting

### Erro: "No such file or directory" no storage

**Causa:** Storage está em modo local (fallback) porque R2 não está configurado ou variáveis estão incorretas.

**Solução:**
1. Verifique se todas as 4 variáveis obrigatórias estão configuradas:
   ```bash
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET
   ```
2. Verifique se não há espaços extras ou caracteres especiais
3. Faça deploy novamente após configurar
4. Verifique logs para confirmar que R2 está sendo usado

### Arquivos antigos não funcionam

**Causa:** Arquivos salvos antes de configurar R2 estão no storage local, mas agora o sistema tenta acessar do R2.

**Solução:**
- Arquivos novos funcionarão normalmente (serão salvos no R2)
- Arquivos antigos podem precisar ser re-uploaded ou migrados manualmente

### Testar Conexão R2

Você pode testar a conexão localmente (se tiver acesso ao ambiente):

```bash
# No container do backend
caprover exec -a ut-be "python test_r2_connection.py"
```

Ou criar um endpoint de teste (temporário):

```python
# Em uma view temporária
from apps.supbrainnote.storage import SupBrainNoteAudioStorage

storage = SupBrainNoteAudioStorage()
print(f"Storage usando R2: {not storage._use_local}")
print(f"Bucket: {storage.bucket_name if hasattr(storage, 'bucket_name') else 'N/A'}")
```

## 📝 Checklist de Configuração

- [ ] `R2_ACCOUNT_ID` configurado
- [ ] `R2_ACCESS_KEY_ID` configurado
- [ ] `R2_SECRET_ACCESS_KEY` configurado
- [ ] `R2_BUCKET` configurado
- [ ] `R2_CUSTOM_DOMAIN` configurado (opcional)
- [ ] Deploy realizado após configurar variáveis
- [ ] Logs verificados (sem erros de storage)
- [ ] Upload de áudio testado
- [ ] Transcrição funcionando

## 🔄 Comportamento do Storage

O storage tem **fallback automático**:

1. **Se R2 estiver configurado:**
   - Tenta salvar no R2 primeiro
   - Se R2 falhar (rate limit, erro de conexão), faz fallback para local
   - Tenta abrir do R2 primeiro
   - Se não encontrar no R2, tenta local (fallback)

2. **Se R2 não estiver configurado:**
   - Usa storage local automaticamente
   - Todos os arquivos são salvos em `/app/media/`

**Importante:** Em produção, sempre configure R2 para evitar problemas de persistência (arquivos locais são perdidos em redeploy).

## 📚 Referências

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [django-storages S3 Backend](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)


