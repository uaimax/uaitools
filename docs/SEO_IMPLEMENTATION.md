# Implementação de SEO Dinâmico

> **Data**: 2025-12-25
> **Status**: ✅ Implementado

## Visão Geral

Foi implementado um sistema completo de SEO dinâmico para o frontend, permitindo que cada página tenha títulos e meta descriptions otimizados automaticamente.

## Componentes Criados

### 1. Hook `useSEO`

**Arquivo**: `frontend/src/hooks/useSEO.ts`

Hook React que gerencia automaticamente:
- `<title>` - Título da página
- `<meta name="description">` - Descrição da página
- `<meta name="keywords">` - Palavras-chave
- Open Graph tags (og:title, og:description, og:image, etc.)
- Twitter Card tags
- Canonical URL
- Meta robots (noindex/nofollow quando necessário)
- Idioma do HTML baseado no i18n

**Características**:
- Suporte a interpolação de variáveis dinâmicas (ex: `{{name}}`)
- Atualização automática quando a rota muda
- Integração com i18n para traduções
- Valores padrão quando não especificados

### 2. Componente `SEO`

**Arquivo**: `frontend/src/components/SEO.tsx`

Componente wrapper declarativo para usar o hook `useSEO` de forma mais simples.

**Uso**:
```tsx
<SEO
  title="Minha Página"
  description="Descrição da minha página"
  keywords="palavra1, palavra2"
  dynamicData={{ name: "João" }}
/>
```

## Traduções

### Arquivos Criados
- `frontend/src/locales/pt/seo.json` - Traduções em português
- `frontend/src/locales/en/seo.json` - Traduções em inglês

### Estrutura de Traduções
```json
{
  "site_name": "SaaS Bootstrap",
  "default": {
    "title": "SaaS Bootstrap",
    "description": "Descrição padrão"
  },
  "home": { ... },
  "login": { ... },
  "dashboard": { ... },
  "leads": {
    "title": "Leads",
    "list": { ... },
    "create": { ... },
    "edit": { ... }
  }
}
```

## Páginas Atualizadas

Todas as páginas principais foram atualizadas com SEO:

### Páginas Públicas
- ✅ **Home** (`/`) - SEO otimizado
- ✅ **Login** (`/login`) - SEO + noindex
- ✅ **Register** (`/register`) - SEO otimizado
- ✅ **Forgot Password** (`/forgot-password`) - SEO + noindex
- ✅ **Reset Password** (`/reset-password`) - SEO + noindex
- ✅ **OAuth Callback** (`/oauth/callback`) - SEO + noindex

### Páginas Admin (noindex)
- ✅ **Dashboard** (`/admin/dashboard`) - SEO + noindex
- ✅ **Leads List** (`/admin/leads`) - SEO + noindex
- ✅ **Lead Create** (`/admin/leads/new`) - SEO + noindex
- ✅ **Lead Edit** (`/admin/leads/:id`) - SEO dinâmico com nome do lead + noindex
- ✅ **Settings** (`/admin/settings`) - SEO + noindex
- ✅ **Documents** (`/admin/documents`) - SEO + noindex

## SEO Dinâmico

### Exemplo: Lead Form Page

A página de edição de lead usa dados dinâmicos:

```tsx
<SEO
  title={t("seo:leads.edit.title", { name: lead?.name || "Lead" })}
  description={t("seo:leads.edit.description", { name: lead?.name || "Lead" })}
  dynamicData={{ name: lead?.name }}
  noindex={true}
/>
```

Isso resulta em:
- **Título**: "Editar Lead - João Silva | SaaS Bootstrap"
- **Descrição**: "Edite as informações do lead João Silva."

## Meta Tags Implementadas

### Básicas
- `<title>` - Título da página
- `<meta name="description">` - Descrição
- `<meta name="keywords">` - Palavras-chave
- `<meta name="robots">` - Controle de indexação
- `<link rel="canonical">` - URL canônica

### Open Graph (Facebook, LinkedIn, etc.)
- `og:title` - Título para redes sociais
- `og:description` - Descrição para redes sociais
- `og:image` - Imagem para compartilhamento
- `og:type` - Tipo de conteúdo (website, article, etc.)
- `og:url` - URL da página
- `og:site_name` - Nome do site
- `og:locale` - Idioma

### Twitter Card
- `twitter:card` - Tipo de card (summary_large_image)
- `twitter:title` - Título
- `twitter:description` - Descrição
- `twitter:image` - Imagem

## index.html Atualizado

O `index.html` foi atualizado com:
- Título e meta description padrão otimizados
- Open Graph tags padrão
- Twitter Card tags padrão
- Idioma do HTML (`lang="pt-BR"`)
- Meta tags essenciais

## Boas Práticas Implementadas

1. **Páginas públicas**: SEO completo, indexáveis
2. **Páginas privadas/admin**: `noindex=true` para não aparecerem em buscadores
3. **Dados dinâmicos**: Interpolação de variáveis quando disponível
4. **Traduções**: Suporte completo a i18n
5. **Fallbacks**: Valores padrão quando dados não disponíveis
6. **Canonical URLs**: URLs canônicas para evitar conteúdo duplicado

## Como Usar em Novas Páginas

### Exemplo Básico
```tsx
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function MyPage() {
  const { t } = useTranslation(["seo"]);

  return (
    <>
      <SEO
        title={t("seo:my_page.title")}
        description={t("seo:my_page.description")}
        keywords="palavra1, palavra2"
      />
      {/* Conteúdo da página */}
    </>
  );
}
```

### Exemplo com Dados Dinâmicos
```tsx
<SEO
  title={t("seo:item.edit.title", { name: item.name })}
  description={t("seo:item.edit.description", { name: item.name })}
  dynamicData={{ name: item.name, id: item.id }}
  noindex={true}
/>
```

## Configuração de Variáveis de Ambiente

Para URLs completas em Open Graph, configure:

```env
VITE_APP_URL=https://seu-dominio.com
```

Se não configurado, usa `window.location.origin` automaticamente.

## Próximos Passos (Opcional)

1. **Imagem OG**: Criar `/public/og-image.png` para compartilhamento
2. **Sitemap**: Gerar sitemap.xml dinamicamente
3. **Structured Data**: Adicionar JSON-LD para rich snippets
4. **Analytics**: Integrar Google Search Console

## Referências

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google SEO Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

