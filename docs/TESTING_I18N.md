# Guia de Testes de Internacionalização (i18n)

Este documento descreve como testar a funcionalidade de internacionalização implementada no projeto.

## ✅ Checklist de Testes

### 1. Testes Básicos

#### 1.1 Mudança de Idioma
- [ ] Acessar a aplicação
- [ ] Localizar o seletor de idioma no header (ícone de globo)
- [ ] Trocar de Português para English
- [ ] Verificar se os textos mudam imediatamente
- [ ] Trocar de English para Português
- [ ] Verificar se os textos voltam ao português

#### 1.2 Persistência do Idioma
- [ ] Trocar idioma para English
- [ ] Recarregar a página (F5)
- [ ] Verificar se o idioma permanece em English
- [ ] Verificar localStorage: `localStorage.getItem('i18nextLng')` deve retornar `"en"`

### 2. Testes de Módulo Auth

#### 2.1 Página de Login
- [ ] Acessar `/login`
- [ ] Verificar se todos os textos estão traduzidos:
  - Título: "Login" / "Login"
  - Descrição: "Entre com sua conta..." / "Sign in to your account..."
  - Campos: "Email", "Senha" / "Email", "Password"
  - Botão: "Entrar" / "Sign in"
  - Link: "Não tem uma conta? Registrar" / "Don't have an account? Register"
- [ ] Trocar idioma e verificar se os textos mudam
- [ ] Testar validação Zod:
  - Deixar campo vazio e submeter
  - Verificar se mensagem de erro aparece traduzida
  - Testar email inválido
  - Verificar mensagens de erro traduzidas

#### 2.2 Página de Registro
- [ ] Acessar `/register`
- [ ] Verificar traduções:
  - Título: "Registrar" / "Register"
  - Campos: "Nome", "Sobrenome", "Email", etc.
  - Botão: "Registrar" / "Register"
  - Checkboxes de termos e privacidade
- [ ] Testar validação:
  - Senha muito curta (< 8 caracteres)
  - Senhas não coincidem
  - Campos obrigatórios
- [ ] Verificar mensagens de erro traduzidas
- [ ] Testar toasts de sucesso/erro traduzidos

### 3. Testes de Módulo Leads

#### 3.1 Listagem de Leads
- [ ] Acessar `/admin/leads` (requer autenticação)
- [ ] Verificar traduções:
  - Título: "Leads" / "Leads"
  - Botão: "Criar lead" / "Create lead"
  - Colunas da tabela: "Nome", "Email", "Telefone", "Status" / "Name", "Email", "Phone", "Status"
  - Status badges: "Novo", "Contatado", etc. / "New", "Contacted", etc.
- [ ] Trocar idioma e verificar mudanças

#### 3.2 Formulário de Lead
- [ ] Acessar `/admin/leads/new`
- [ ] Verificar traduções:
  - Título: "Novo Lead" / "New Lead"
  - Labels dos campos
  - Placeholders
  - Opções do select de status
- [ ] Testar validação Zod:
  - Campo obrigatório vazio
  - Email inválido
- [ ] Verificar mensagens de erro traduzidas
- [ ] Criar lead e verificar toast de sucesso traduzido
- [ ] Editar lead existente e verificar toast de atualização traduzido

### 4. Testes de Componentes Compartilhados

#### 4.1 ResourceListPage
- [ ] Verificar breadcrumbs traduzidos
- [ ] Verificar mensagem de "Nenhum dado encontrado" / "No data found"
- [ ] Verificar botões de ação traduzidos

#### 4.2 Mensagens Comuns
- [ ] Verificar que termos comuns aparecem consistentemente:
  - "Salvar" / "Save"
  - "Cancelar" / "Cancel"
  - "Deletar" / "Delete"
  - "Editar" / "Edit"
  - "Criar" / "Create"

### 5. Testes Técnicos

#### 5.1 Validação de Traduções
Execute no console do navegador:

```javascript
import { validateTranslations } from './src/i18n/test-i18n.ts'
const result = validateTranslations()
console.log(result)
```

#### 5.2 Teste de Mudança de Idioma
```javascript
import { testLanguageChange } from './src/i18n/test-i18n.ts'
const result = testLanguageChange()
console.log(result ? '✅ Passou' : '❌ Falhou')
```

#### 5.3 Teste de Fallback
```javascript
import { testFallback } from './src/i18n/test-i18n.ts'
const result = testFallback()
console.log(result ? '✅ Passou' : '❌ Falhou')
```

#### 5.4 Executar Todos os Testes
```javascript
import { runI18nTests } from './src/i18n/test-i18n.ts'
const results = runI18nTests()
console.log(results)
```

### 6. Testes de Portabilidade

#### 6.1 Módulo Auth Standalone
- [ ] Verificar que `features/auth/locales/` contém todas as traduções necessárias
- [ ] Verificar que o módulo não depende de traduções externas (exceto `common`)
- [ ] Testar que o módulo funciona se movido para outro projeto

#### 6.2 Módulo Leads Standalone
- [ ] Verificar que `features/leads/locales/` contém todas as traduções necessárias
- [ ] Verificar dependências apenas de `common`
- [ ] Testar portabilidade

### 7. Testes de Edge Cases

#### 7.1 Idioma Não Suportado
- [ ] Tentar definir idioma inexistente (ex: "fr")
- [ ] Verificar se fallback para "pt" funciona

#### 7.2 Tradução Ausente
- [ ] Tentar usar chave de tradução inexistente
- [ ] Verificar se fallback funciona corretamente

#### 7.3 Performance
- [ ] Verificar que mudança de idioma é instantânea
- [ ] Verificar que não há reload da página
- [ ] Verificar que localStorage é atualizado corretamente

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📝 Notas

- O idioma é persistido no `localStorage` com a chave `i18nextLng`
- O fallback padrão é `pt` (português)
- Todas as traduções são carregadas no início da aplicação (não há lazy loading)
- Os módulos são portáveis e podem ser movidos para outros projetos

## 🔧 Comandos Úteis

### Verificar Idioma Atual
```javascript
import i18next from 'i18next'
console.log(i18next.language)
```

### Mudar Idioma Programaticamente
```javascript
import i18next from 'i18next'
i18next.changeLanguage('en')
```

### Verificar Tradução Específica
```javascript
import i18next from 'i18next'
i18next.t('common:actions.save')
```

### Limpar Cache de Idioma
```javascript
localStorage.removeItem('i18nextLng')
location.reload()
```



