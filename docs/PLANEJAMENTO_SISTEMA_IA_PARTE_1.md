# PLANEJAMENTO: Sistema Inteligente de Investimentos com IA - PARTE 1: FUNDAÇÃO E DADOS

> **Data**: 2025-01-XX
> **Objetivo**: Transformar sistema atual em assistente inteligente onde IA é o cérebro proativo
> **Escopo**: Ações B3 (extensível para Bitcoin e outros no futuro)
> **Status**: 📋 Planejamento - Parte 1 de 3

---

## 🎯 VISÃO GERAL

### Problema Atual
O sistema exige muito do usuário para definir estratégias, alocações-alvo e critérios fixos, enquanto a IA apenas executa regras pré-definidas.

### Solução Proposta
IA como cérebro proativo que:
- ✅ Tem estratégias próprias pré-cadastradas (templates)
- ✅ Analisa contexto completo do usuário automaticamente
- ✅ Gera recomendações inteligentes sem exigir configuração
- ✅ Valida e revalida estratégias continuamente
- ✅ Mostra performance histórica de cada estratégia
- ✅ Mantém dados sempre atualizados
- ✅ Oferece chat contextual na carteira

### Fluxo Ideal
1. **Usuário**: "Tenho R$200, onde invisto?"
2. **Sistema**: Analisa contexto completo
3. **Sistema**: Escolhe estratégia adequada
4. **Sistema**: Gera alocações dinamicamente
5. **Sistema**: Retorna recomendação com justificativa
6. **Usuário**: Confirma ou ajusta

---

## 📋 REQUISITOS FUNCIONAIS

### RF1: Dicas/Preferências do Usuário ✅
**Objetivo**: Usuário pode dar "dicas" para IA sem precisar configurar tudo.
- Preferências de setores (exclusão/preferência).
- Campo de texto livre para critérios adicionais.
- IA explica ajustes baseados nessas preferências.

### RF2: Validação e Revalidação de Estratégias ✅
**Objetivo**: Garantir que estratégias sempre fazem sentido no contexto atual.
- Validação antes da aplicação e revalidação diária via background job.
- Alertas e sugestões de ajustes automáticos.

### RF3: Nota/Performance Histórica ✅
**Objetivo**: Usuário leigo sabe se a estratégia está funcionando bem.
- Nota automática (0-5 estrelas) baseada em resultados reais.
- Comparação com benchmark (IBOV).

### RF4: Sistema Vivo (Dados Atualizados) ✅
**Objetivo**: Garantir o uso dos dados mais recentes possíveis.
- Atualização automática de dados de mercado e cache inteligente.

### RF5: Chat Contextual na Carteira ✅
**Objetivo**: Usuário pode perguntar qualquer coisa sobre sua carteira.
- IA com acesso total ao contexto (carteira, histórico, mercado, estratégia).
- Linguagem simples para leigos.

---

## 🏗️ ARQUITETURA DE DADOS (Modelos Django)

### 1. StrategyTemplate
`backend/apps/investments/models.py`
Template de estratégia pré-cadastrada pela IA, contendo critérios base e lógica de adaptação.

### 2. InvestorProfile
`backend/apps/investments/models.py`
Perfil do investidor (risco, horizonte, objetivo) inferido pela IA através do comportamento e carteira.

### 3. UserPreferences
`backend/apps/investments/models.py`
Armazena setores excluídos/preferidos e critérios adicionais do usuário.

### 4. StrategyValidation
`backend/apps/investments/models.py`
Registro de cada validação realizada, status e sugestões de ajustes.

### 5. StrategyPerformance
`backend/apps/investments/models.py`
Métricas históricas (retorno, DY realizado, aderência) e score calculado.

### 6. PortfolioChat
`backend/apps/investments/models.py`
Histórico de mensagens do chat com snapshot do contexto para cada interação.

### 7. DataFreshness
`backend/apps/investments/models.py`
Controle granular da atualização de cada tipo de dado por ativo.

### 8. SectorMapping
`backend/apps/investments/models.py`
Mapeamento de tickers para setores e subsetores para filtros de diversificação e preferências.

---

*Continua na Parte 2: Serviços, Lógica e APIs.*

