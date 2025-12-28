# PRD Completo — SupBrainNote Mobile

**Versão:** 2.0
**Data:** Dezembro 2024
**Autor:** Product & UX Specification
**Stack:** React Native + Expo
**Plataformas:** iOS 14+ / Android 10+

---

# PARTE 1: VISÃO DO PRODUTO

## 1.1 Problema

Pessoas com múltiplos projetos e contextos de vida sofrem de **sobrecarga cognitiva**:

- Pensamentos surgem em momentos aleatórios (no carro, no banho, caminhando)
- Capturar exige fricção (abrir app, digitar, categorizar)
- Informações ficam espalhadas (WhatsApp, Notes, emails, cabeça)
- Recuperar é impossível ("já discutimos isso?", "onde anotei?")

## 1.2 Solução

**SupBrainNote** é um anotador por voz que usa IA para:

1. **Capturar** — gravar pensamentos com zero fricção
2. **Organizar** — classificar automaticamente em "caixinhas" temáticas
3. **Recuperar** — responder perguntas sobre o que já foi anotado

## 1.3 Proposta de Valor

> "Grave, jogue, esqueça. Quando precisar, pergunte."

## 1.4 Métricas de Sucesso

| Métrica | Meta MVP | Meta 6 meses |
|---------|----------|--------------|
| Tempo até primeira gravação | < 30 segundos | < 15 segundos |
| Gravações por usuário/semana | > 5 | > 15 |
| Taxa de classificação correta | > 75% | > 90% |
| Retenção D7 | > 30% | > 50% |
| NPS | > 20 | > 40 |

---

# PARTE 2: DESIGN SYSTEM

## 2.1 Filosofia de Design

### Princípios Fundamentais

| Princípio | Significado | Aplicação |
|-----------|-------------|-----------|
| **Invisível** | O app some, o conteúdo aparece | UI mínima, foco na tarefa |
| **Imediato** | Resposta instantânea | Feedback < 100ms |
| **Confiável** | Usuário nunca perde dados | Salva local primeiro, sincroniza depois |
| **Perdoador** | Erros são reversíveis | Undo em todas as ações destrutivas |

### Tom de Voz

- **Conciso** — frases curtas, sem jargão
- **Calmo** — nunca alarmista, mesmo em erros
- **Útil** — sempre oferece próximo passo

Exemplos:
- ✅ "Nota salva"
- ❌ "Sua nota foi salva com sucesso em nosso sistema!"
- ✅ "Sem internet. Salvamos localmente."
- ❌ "Erro de conexão! Verifique sua rede."

---

## 2.2 Cores

### Paleta Principal

```
┌─────────────────────────────────────────────────────────────┐
│  DARK THEME (Padrão)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Background                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ bg-base  │ │ bg-elevated│ │ bg-overlay│                  │
│  │ #0D0D0F  │ │ #18181B   │ │ #27272A   │                   │
│  │ Fundo    │ │ Cards     │ │ Modais    │                   │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  Primary (Ação principal)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ primary  │ │ primary- │ │ primary- │                    │
│  │ #6366F1  │ │ hover    │ │ pressed  │                    │
│  │ Indigo   │ │ #818CF8  │ │ #4F46E5  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  Text                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ text-    │ │ text-    │ │ text-    │                    │
│  │ primary  │ │ secondary│ │ tertiary │                    │
│  │ #FAFAFA  │ │ #A1A1AA  │ │ #71717A  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  Semantic                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ success  │ │ warning  │ │ error    │ │ info     │      │
│  │ #22C55E  │ │ #F59E0B  │ │ #EF4444  │ │ #3B82F6  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Recording (Estado de gravação)                             │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ rec-idle │ │ rec-     │                                 │
│  │ #6366F1  │ │ active   │                                 │
│  │ Indigo   │ │ #EF4444  │                                 │
│  └──────────┘ └──────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cores das Caixinhas

Sistema de cores automático para distinguir visualmente as caixinhas:

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ box-1    │ │ box-2    │ │ box-3    │ │ box-4    │
│ #6366F1  │ │ #8B5CF6  │ │ #EC4899  │ │ #F59E0B  │
│ Indigo   │ │ Violet   │ │ Pink     │ │ Amber    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ box-5    │ │ box-6    │ │ box-7    │ │ box-8    │
│ #10B981  │ │ #06B6D4  │ │ #3B82F6  │ │ #F43F5E  │
│ Emerald  │ │ Cyan     │ │ Blue     │ │ Rose     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Regra: Cor é atribuída automaticamente na criação. Usuário pode mudar depois (v2).

### Aplicação de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| Fundo da tela | bg-base | Sempre |
| Cards de nota | bg-elevated | Fundo dos cards |
| Modais/Overlays | bg-overlay | Com 80% opacidade |
| Botão de gravar (idle) | primary | Estado padrão |
| Botão de gravar (recording) | rec-active | Pulsando |
| Texto principal | text-primary | Títulos, transcrições |
| Texto secundário | text-secondary | Timestamps, hints |
| Texto desabilitado | text-tertiary | Placeholders |
| Badge de caixinha | box-[n] | Cor da caixinha |
| Ações destrutivas | error | Excluir, sair |
| Confirmações | success | Toasts de sucesso |

---

## 2.3 Tipografia

### Fonte

**SF Pro** (iOS) / **Roboto** (Android) — fontes nativas do sistema.

Motivo: Performance (já carregada), familiaridade, acessibilidade.

### Escala Tipográfica

```
┌─────────────────────────────────────────────────────────────┐
│  ESCALA TIPOGRÁFICA                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  display        32px / 40px LH / -0.5 tracking / Bold       │
│  Uso: Títulos de seção grandes (raro)                       │
│                                                             │
│  title-1        24px / 32px LH / -0.3 tracking / Semibold   │
│  Uso: Nome do app, títulos de tela                          │
│                                                             │
│  title-2        20px / 28px LH / -0.2 tracking / Semibold   │
│  Uso: Subtítulos, nome de caixinha                          │
│                                                             │
│  title-3        17px / 24px LH / 0 tracking / Semibold      │
│  Uso: Labels importantes, seções                            │
│                                                             │
│  body           17px / 24px LH / 0 tracking / Regular       │
│  Uso: Texto principal, transcrições                         │
│                                                             │
│  body-small     15px / 20px LH / 0 tracking / Regular       │
│  Uso: Texto secundário, previews                            │
│                                                             │
│  caption        13px / 18px LH / 0.1 tracking / Regular     │
│  Uso: Timestamps, metadata, hints                           │
│                                                             │
│  caption-small  11px / 14px LH / 0.2 tracking / Medium      │
│  Uso: Badges, contadores                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementação (React Native)

```typescript
// theme/typography.ts

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  title1: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
    fontWeight: '600',
  },
  title2: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  title3: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '600',
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: '400',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '400',
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
};
```

---

## 2.4 Espaçamento

### Sistema de 4px

Todos os espaçamentos são múltiplos de 4px para consistência visual.

```
┌─────────────────────────────────────────────────────────────┐
│  ESCALA DE ESPAÇAMENTO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  space-1    4px     Mínimo (entre ícone e texto)           │
│  space-2    8px     Pequeno (padding interno compacto)     │
│  space-3    12px    Médio-pequeno                          │
│  space-4    16px    Padrão (padding de cards)              │
│  space-5    20px    Médio-grande                           │
│  space-6    24px    Grande (entre seções)                  │
│  space-8    32px    Extra-grande                           │
│  space-10   40px    Separação de blocos                    │
│  space-12   48px    Margens de tela                        │
│  space-16   64px    Espaço para FAB                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Aplicação

| Contexto | Espaçamento |
|----------|-------------|
| Padding horizontal de tela | 16px (space-4) |
| Padding interno de card | 16px (space-4) |
| Gap entre cards | 12px (space-3) |
| Gap entre seções | 24px (space-6) |
| Margem inferior para FAB | 80px (space-16 + space-4) |
| Padding de botões | 12px vertical, 24px horizontal |

---

## 2.5 Bordas e Sombras

### Border Radius

```
radius-none     0px      Elementos especiais
radius-sm       4px      Badges, chips
radius-md       8px      Inputs, botões pequenos
radius-lg       12px     Cards
radius-xl       16px     Modais, bottom sheets
radius-full     9999px   Botão de gravar, avatares
```

### Sombras (Dark Theme)

No dark theme, usamos bordas sutis ao invés de sombras tradicionais:

```
┌─────────────────────────────────────────────────────────────┐
│  ELEVAÇÃO                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  elevation-0    Nenhuma (elementos no fundo)               │
│                 border: none                                │
│                                                             │
│  elevation-1    Cards normais                              │
│                 border: 1px solid rgba(255,255,255,0.06)   │
│                                                             │
│  elevation-2    Cards destacados, dropdowns                │
│                 border: 1px solid rgba(255,255,255,0.1)    │
│                 + glow sutil: 0 0 20px rgba(99,102,241,0.1)│
│                                                             │
│  elevation-3    Modais, FAB                                │
│                 border: 1px solid rgba(255,255,255,0.12)   │
│                 + shadow: 0 8px 32px rgba(0,0,0,0.4)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2.6 Iconografia

### Biblioteca

**Lucide Icons** — consistente, leve, MIT license.

### Tamanhos

```
icon-sm     16px    Dentro de texto, badges
icon-md     20px    Botões, listas
icon-lg     24px    Navegação, ações principais
icon-xl     32px    Destaque, empty states
icon-2xl    48px    Ilustrações, onboarding
```

### Ícones Principais

| Contexto | Ícone | Nome Lucide |
|----------|-------|-------------|
| Gravar | 🎤 | `mic` |
| Gravar (ativo) | 🔴 | `circle` (filled) |
| Play áudio | ▶ | `play` |
| Pause áudio | ⏸ | `pause` |
| Inbox | 📥 | `inbox` |
| Caixinha | 📦 | `box` |
| Busca | 🔍 | `search` |
| Configurações | ⚙️ | `settings` |
| Voltar | ← | `arrow-left` |
| Menu | ⋮ | `more-vertical` |
| Editar | ✏️ | `pencil` |
| Excluir | 🗑️ | `trash-2` |
| Mover | 📤 | `folder-input` |
| Sucesso | ✓ | `check` |
| Erro | ✕ | `x` |
| Aviso | ⚠️ | `alert-triangle` |

---

## 2.7 Animações e Transições

### Princípios

1. **Propósito** — animação comunica, não decora
2. **Velocidade** — rápido o suficiente pra não atrasar, lento o suficiente pra perceber
3. **Física natural** — ease-out para entradas, ease-in para saídas

### Curvas de Easing

```typescript
// theme/animations.ts

export const easing = {
  // Elementos entrando (começam rápido, desaceleram)
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

  // Elementos saindo (começam devagar, aceleram)
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',

  // Movimento contínuo
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

  // Bounce sutil (para confirmações)
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};
```

### Durações

```
duration-instant    50ms     Feedback de toque
duration-fast       150ms    Micro-interações
duration-normal     250ms    Transições padrão
duration-slow       400ms    Modais, overlays
duration-slower     600ms    Animações complexas
```

### Animações Específicas

| Elemento | Animação | Duração | Easing |
|----------|----------|---------|--------|
| Toast entrada | Slide down + fade | 250ms | easeOut |
| Toast saída | Slide up + fade | 200ms | easeIn |
| Modal entrada | Slide up + fade | 300ms | easeOut |
| Modal saída | Slide down + fade | 250ms | easeIn |
| Card removido | Slide left + collapse | 300ms | easeInOut |
| Botão pressionado | Scale 0.95 | 100ms | easeOut |
| Pulso gravando | Scale 1.0 → 1.1 → 1.0 | 1000ms | easeInOut (loop) |
| Waveform | Amplitude real-time | 60fps | linear |
| FAB entrada | Scale 0 → 1 + fade | 200ms | bounce |
| Tela transição | Slide horizontal | 300ms | easeInOut |

---

## 2.8 Feedback Háptico

### Quando usar

| Ação | Tipo de Haptic | iOS | Android |
|------|----------------|-----|---------|
| Iniciar gravação | Heavy impact | impactHeavy | EFFECT_HEAVY_CLICK |
| Parar gravação | Medium impact | impactMedium | EFFECT_CLICK |
| Sucesso (nota salva) | Success | notificationSuccess | EFFECT_TICK |
| Erro | Error | notificationError | EFFECT_DOUBLE_CLICK |
| Seleção (caixinha) | Light impact | impactLight | EFFECT_TICK |
| Pull to refresh | Light impact | impactLight | EFFECT_TICK |

### Implementação

```typescript
// utils/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

---

## 2.9 Componentes Base

### Botão Primário

```
┌─────────────────────────────────────────┐
│  BOTÃO PRIMÁRIO                         │
├─────────────────────────────────────────┤
│                                         │
│  Estados:                               │
│                                         │
│  ┌─────────────────┐  Default           │
│  │     ENTRAR      │  bg: primary       │
│  └─────────────────┘  text: white       │
│                                         │
│  ┌─────────────────┐  Pressed           │
│  │     ENTRAR      │  bg: primary-press │
│  └─────────────────┘  scale: 0.98       │
│                                         │
│  ┌─────────────────┐  Loading           │
│  │    ◌            │  spinner + opacity │
│  └─────────────────┘  disabled          │
│                                         │
│  ┌─────────────────┐  Disabled          │
│  │     ENTRAR      │  opacity: 0.5      │
│  └─────────────────┘  não clicável      │
│                                         │
│  Specs:                                 │
│  - Height: 48px                         │
│  - Border radius: 8px                   │
│  - Padding: 12px 24px                   │
│  - Font: title-3                        │
│  - Min width: 120px                     │
│                                         │
└─────────────────────────────────────────┘
```

### Botão Secundário

```
┌─────────────────────────────────────────┐
│  BOTÃO SECUNDÁRIO                       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────┐  Default           │
│  │    Cancelar     │  bg: transparent   │
│  └─────────────────┘  border: 1px white │
│                       text: text-primary │
│                                         │
│  Specs:                                 │
│  - Height: 48px                         │
│  - Border radius: 8px                   │
│  - Border: 1px solid rgba(255,255,255,0.2) │
│                                         │
└─────────────────────────────────────────┘
```

### Botão Ghost (Link)

```
┌─────────────────────────────────────────┐
│  BOTÃO GHOST                            │
├─────────────────────────────────────────┤
│                                         │
│  Esqueci minha senha   Default          │
│                        text: primary    │
│                        underline: none  │
│                                         │
│  Esqueci minha senha   Pressed          │
│  ─────────────────     opacity: 0.7     │
│                                         │
└─────────────────────────────────────────┘
```

### Input Field

```
┌─────────────────────────────────────────┐
│  INPUT FIELD                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📧  Digite seu email            │    │  Default
│  └─────────────────────────────────┘    │  bg: bg-elevated
│                                         │  border: 1px rgba(255,255,255,0.1)
│  ┌─────────────────────────────────┐    │
│  │ 📧  max@email.com               │    │  Focused
│  └─────────────────────────────────┘    │  border: 1px primary
│          ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                │  glow sutil
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📧  emailinvalido               │    │  Error
│  └─────────────────────────────────┘    │  border: 1px error
│  Email inválido                         │  text: error (abaixo)
│                                         │
│  Specs:                                 │
│  - Height: 52px                         │
│  - Border radius: 8px                   │
│  - Padding: 16px                        │
│  - Icon: 20px, text-tertiary            │
│  - Placeholder: text-tertiary           │
│  - Value: text-primary                  │
│                                         │
└─────────────────────────────────────────┘
```

### Card de Nota

```
┌─────────────────────────────────────────┐
│  CARD DE NOTA                           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ┌────────┐                      │    │
│  │ │UAIZOUK │           14:32      │    │  ← Badge + timestamp
│  │ └────────┘                      │    │
│  │                                 │    │
│  │ "Salão Aurora pode servir pro   │    │  ← Preview (2 linhas max)
│  │  evento. Parece ter espaço..."  │    │
│  │                                 │    │
│  │ ▶ 0:23                          │    │  ← Mini player
│  └─────────────────────────────────┘    │
│                                         │
│  Specs:                                 │
│  - Padding: 16px                        │
│  - Border radius: 12px                  │
│  - Background: bg-elevated              │
│  - Border: elevation-1                  │
│  - Gap interno: 8px                     │
│                                         │
│  Badge:                                 │
│  - Padding: 4px 8px                     │
│  - Border radius: 4px                   │
│  - Background: box-color (10% opacity)  │
│  - Text: box-color                      │
│  - Font: caption-small, uppercase       │
│                                         │
│  Preview:                               │
│  - Font: body-small                     │
│  - Color: text-secondary                │
│  - Max lines: 2                         │
│  - Truncate: ellipsis                   │
│                                         │
│  Mini player:                           │
│  - Icon: 16px                           │
│  - Font: caption                        │
│  - Color: text-tertiary                 │
│                                         │
└─────────────────────────────────────────┘
```

### Toast

```
┌─────────────────────────────────────────┐
│  TOAST                                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ✓  Nota salva em UAIZOUK  [Ver] │    │  Success
│  └─────────────────────────────────┘    │  bg: success (15% opacity)
│                                         │  border-left: 3px success
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ⚠️  Sem internet. Salvo local.  │    │  Warning
│  └─────────────────────────────────┘    │  bg: warning (15% opacity)
│                                         │  border-left: 3px warning
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ✕  Erro ao salvar. Tente de novo│    │  Error
│  └─────────────────────────────────┘    │  bg: error (15% opacity)
│                                         │  border-left: 3px error
│                                         │
│  Specs:                                 │
│  - Position: top, abaixo safe area      │
│  - Margin horizontal: 16px              │
│  - Padding: 12px 16px                   │
│  - Border radius: 8px                   │
│  - Duration: 4000ms (auto dismiss)      │
│  - Swipe up para fechar                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 2.10 Safe Areas e Dimensões

### Safe Areas

```
┌─────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Status bar (iOS: 44px, Android: varies)
├─────────────────────────────────────────┤
│                                         │
│           CONTEÚDO SEGURO               │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Home indicator (iOS: 34px)
└─────────────────────────────────────────┘
```

### Dimensões de Referência

| Dispositivo | Largura | Altura |
|-------------|---------|--------|
| iPhone SE | 375px | 667px |
| iPhone 14 | 390px | 844px |
| iPhone 14 Pro Max | 430px | 932px |
| Pixel 7 | 412px | 915px |
| Galaxy S23 | 360px | 780px |

### Breakpoints (se necessário)

```
compact     < 375px    Ajustes de padding
regular     375-430px  Design padrão
expanded    > 430px    Tablets (futuro)
```

---

# PARTE 3: FLUXO DE AUTENTICAÇÃO

## 3.1 Estratégia de Sessão

### Objetivo
Usuário faz login UMA VEZ e nunca mais vê tela de login (a menos que faça logout explícito ou token expire após 30 dias de inatividade).

### Implementação

```
┌─────────────────────────────────────────────────────────────┐
│  FLUXO DE AUTENTICAÇÃO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  App inicia                                                 │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ Splash      │  ← Nativo (evita flash branco)            │
│  │ (< 500ms)   │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐    Não    ┌─────────────┐                 │
│  │ Tem refresh │─────────▶│   Login     │                 │
│  │   token?    │           │   Screen    │                 │
│  └──────┬──────┘           └─────────────┘                 │
│         │ Sim                                               │
│         ▼                                                   │
│  ┌─────────────┐    Falhou  ┌─────────────┐                │
│  │ Refresh     │──────────▶│   Login     │                │
│  │  silencioso │            │   Screen    │                │
│  └──────┬──────┘            └─────────────┘                │
│         │ Sucesso                                           │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │    HOME     │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tokens

```typescript
// Armazenamento seguro
import * as SecureStore from 'expo-secure-store';

interface AuthTokens {
  accessToken: string;   // JWT, expira em 15 minutos
  refreshToken: string;  // Opaco, expira em 30 dias
  expiresAt: number;     // Timestamp
}

// Guardar tokens
await SecureStore.setItemAsync('auth_tokens', JSON.stringify(tokens));

// Recuperar tokens
const tokens = JSON.parse(await SecureStore.getItemAsync('auth_tokens'));

// Limpar (logout)
await SecureStore.deleteItemAsync('auth_tokens');
```

---

## 3.2 Tela: Splash

**Duração:** < 500ms (apenas verificação de token)

**Visual:** Logo do app centralizado, background bg-base

**Não mostrar:** Loading spinner, texto, animação longa

---

## 3.3 Tela: Login

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Safe area top
├─────────────────────────────────────────┤
│                                         │
│                                         │
│            ┌───────────┐                │
│            │    🧠     │                │  ← Logo 64px
│            └───────────┘                │
│                                         │
│           SupBrainNote                  │  ← title-1
│                                         │
│     Grave, jogue, esqueça.              │  ← body-small
│     Quando precisar, pergunte.          │     text-secondary
│                                         │
│                            (40px gap)   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📧  Email                       │    │  ← Input
│  └─────────────────────────────────┘    │
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │ 🔒  Senha                   👁   │    │  ← Input + toggle
│  └─────────────────────────────────┘    │
│                            (24px gap)   │
│  ┌─────────────────────────────────┐    │
│  │           ENTRAR                │    │  ← Botão primário
│  └─────────────────────────────────┘    │
│                            (16px gap)   │
│         Esqueci minha senha             │  ← Link (ghost button)
│                                         │
│  ──────────────── ou ────────────────   │  ← Divider
│                            (16px gap)   │
│  ┌─────────────────────────────────┐    │
│  │     Continuar com Apple        │    │  ← Social (iOS only)
│  └─────────────────────────────────┘    │
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │    G  Continuar com Google      │    │  ← Social
│  └─────────────────────────────────┘    │
│                                         │
│                                         │
│                                         │
│       Não tem conta? Criar conta        │  ← Link
│                                         │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Safe area bottom
└─────────────────────────────────────────┘
```

### Comportamentos

| Ação | Comportamento |
|------|---------------|
| Digita email | Valida formato em tempo real |
| Digita senha | Mínimo 8 caracteres |
| Toggle 👁 | Mostra/esconde senha |
| Tap "Entrar" | Loading state, desabilita form |
| Erro de credencial | Toast error + shake no form |
| Sucesso | Navega pra Home (sem animação) |
| Tap "Esqueci senha" | Navega pra ForgotPassword |
| Tap "Criar conta" | Navega pra SignUp |
| Tap social login | Abre modal nativo OAuth |

### Validações

```typescript
const validations = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido',
  },
  password: {
    minLength: 8,
    message: 'Mínimo 8 caracteres',
  },
};
```

---

## 3.4 Tela: Criar Conta

```
┌─────────────────────────────────────────┐
│ [←]                                     │  ← Voltar pro Login
├─────────────────────────────────────────┤
│                                         │
│         Criar sua conta                 │  ← title-1
│                                         │
│                            (32px gap)   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 👤  Nome                        │    │
│  └─────────────────────────────────┘    │
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │ 📧  Email                       │    │
│  └─────────────────────────────────┘    │
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │ 🔒  Senha                   👁   │    │
│  └─────────────────────────────────┘    │
│  Mínimo 8 caracteres                    │  ← caption, text-tertiary
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │ 🔒  Confirmar senha         👁   │    │
│  └─────────────────────────────────┘    │
│                            (16px gap)   │
│  ☐ Li e aceito os Termos de Uso e       │  ← Checkbox
│    Política de Privacidade              │     Links clicáveis
│                            (24px gap)   │
│  ┌─────────────────────────────────┐    │
│  │        CRIAR CONTA              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ──────────────── ou ────────────────   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     Continuar com Apple        │    │
│  └─────────────────────────────────┘    │
│                            (12px gap)   │
│  ┌─────────────────────────────────┐    │
│  │    G  Continuar com Google      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Validações

| Campo | Regra | Feedback |
|-------|-------|----------|
| Nome | Não vazio | "Nome é obrigatório" |
| Email | Formato válido | "Email inválido" |
| Email | Não existe | "Este email já está cadastrado" (da API) |
| Senha | >= 8 chars | "Mínimo 8 caracteres" |
| Confirmar | = Senha | "Senhas não coincidem" |
| Termos | Checked | Botão desabilitado até marcar |

### Pós-criação

1. Conta criada com sucesso
2. Login automático (tokens salvos)
3. Navega direto pra Home
4. (Opcional) Modal de onboarding / criar primeira caixinha

---

## 3.5 Tela: Esqueci a Senha

**Estado 1: Solicitar email**

```
┌─────────────────────────────────────────┐
│ [←]                                     │
├─────────────────────────────────────────┤
│                                         │
│        Recuperar senha                  │  ← title-1
│                                         │
│  Digite seu email e enviaremos          │  ← body-small
│  um link para redefinir sua senha.      │     text-secondary
│                                         │
│                            (32px gap)   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📧  Email                       │    │
│  └─────────────────────────────────┘    │
│                            (24px gap)   │
│  ┌─────────────────────────────────┐    │
│  │        ENVIAR LINK              │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Estado 2: Email enviado**

```
┌─────────────────────────────────────────┐
│ [←]                                     │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│               ✉️                         │  ← icon-2xl, success
│                                         │
│         Email enviado!                  │  ← title-1
│                                         │
│  Enviamos um link de recuperação        │  ← body-small
│  para max@email.com.                    │     text-secondary
│  O link expira em 1 hora.               │
│                                         │
│                            (32px gap)   │
│                                         │
│  Não recebeu? Reenviar em 58s           │  ← caption, countdown
│                                         │     Após 60s: "Reenviar email"
│                            (24px gap)   │
│  ┌─────────────────────────────────┐    │
│  │       VOLTAR AO LOGIN           │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

# PARTE 4: TELAS PRINCIPAIS

## 4.1 Tela: Home

### Layout

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│                                         │
│  SupBrainNote                    [⚙️]   │  ← Header
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│              ┌─────────┐                │
│              │         │                │
│              │   🎤    │                │  ← Botão gigante
│              │         │                │     150px diâmetro
│              └─────────┘                │
│                                         │
│        Toque para gravar                │  ← Hint (some após 1º uso)
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Últimas notas                   [→]    │  ← Section header
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ UAIZOUK              hoje 14:32 │    │
│  │ "Salão Aurora pode servir..."   │    │
│  │ ▶ 0:23                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ CASA                 hoje 09:15 │    │
│  │ "Ligar pro eletricista sobre... │    │
│  │ ▶ 0:12                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ UAIZOUK             ontem 22:10 │    │
│  │ "Orçamento máximo seria R$..."  │    │
│  │ ▶ 0:18                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ INBOX               ontem 18:45 │    │
│  │ "Falar com Marcos sobre..."     │    │
│  │ ▶ 0:08                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│            Ver mais (12)                │  ← Link, total de notas
│                                         │
├─────────────────────────────────────────┤
│         ┌─────────────────┐             │
│         │  📥 Inbox (3)   │             │  ← Bottom bar
│         └─────────────────┘             │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### Especificações

**Header**
- Height: 56px
- Padding horizontal: 16px
- Logo/nome: title-2, text-primary
- Ícone settings: icon-lg, text-secondary

**Botão de Gravar**
- Diâmetro: 150px
- Border radius: full (círculo)
- Background: primary
- Icon: mic, 48px, white
- Elevation: elevation-3 (sombra + glow)
- Posição: centralizado, ~30% do topo da área de conteúdo

**Hint "Toque para gravar"**
- Font: caption
- Color: text-tertiary
- Margin top: 16px
- Visibilidade: some após primeira gravação (flag em AsyncStorage)

**Section "Últimas notas"**
- Header: title-3, text-primary
- Seta [→]: icon-md, text-tertiary (clicável, vai pra lista completa)
- Gap entre cards: 12px

**Bottom Bar**
- Height: 60px + safe area bottom
- Background: bg-elevated
- Border top: 1px rgba(255,255,255,0.06)
- Botão Inbox:
  - Background: bg-overlay
  - Border radius: 20px
  - Padding: 8px 16px
  - Icon: inbox, icon-md
  - Text: body-small
  - Badge: se > 0, círculo vermelho com número

---

### Estado: Gravando

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│                                         │
│  ← Overlay escuro (bg-base 90% opacity) │
│                                         │
│                                         │
│                                         │
│              ┌─────────┐                │
│              │  ●      │                │  ← Pulso vermelho
│              │  0:04   │                │     rec-active
│              │         │                │     Animação: scale pulse
│              └─────────┘                │
│                                         │
│                                         │
│  ▁▂▃▅▂▁▃▅▆▃▂▁▄▅▃▂▁▃▄▅▆▄▃▂▁▃▅▇▅▃▁      │  ← Waveform
│                                         │     60fps, amplitude real
│                                         │     Color: primary (50% opacity)
│                                         │
│                                         │
│    [Cancelar]              [✓ Enviar]   │  ← Botões
│                                         │     Secundário | Primário
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

**Especificações do estado gravando:**

- Overlay: bg-base com 90% opacidade, blur opcional
- Botão muda: primary → rec-active (vermelho)
- Ícone muda: mic → circle filled (bolinha)
- Contador: title-1, centralizado no botão
- Animação pulse: 1s loop, scale 1.0 → 1.08 → 1.0
- Waveform:
  - Width: 80% da tela
  - Height: 60px
  - Bars: 40-60 barras
  - Update: a cada 50ms
  - Color: primary com 50% opacity

**Interações:**
- "Cancelar": descarta áudio, fecha overlay, haptic light
- "Enviar": processa áudio, mostra loading
- Tap fora: nada (previne descarte acidental)
- Swipe down: nada
- Back button (Android): equivale a "Cancelar"

---

### Estado: Processando

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│              ┌─────────┐                │
│              │         │                │
│              │   ◌     │                │  ← Spinner
│              │         │                │     primary color
│              └─────────┘                │
│                                         │
│        Processando...                   │  ← caption
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Timeout:** 15 segundos max. Se ultrapassar:
- Toast warning: "Salvamos sua nota, processamento em andamento"
- Fecha overlay
- Nota aparece na lista com status "processando"

---

### Estado: Sucesso

Toast no topo:

```
┌─────────────────────────────────────────┐
│ ✓  Nota salva em UAIZOUK         [Ver]  │
└─────────────────────────────────────────┘
```

- Duração: 4 segundos
- [Ver] abre a nota diretamente
- Haptic: success

---

### Estado: Sem Notas (Primeiro Uso)

```
┌─────────────────────────────────────────┐
│                                         │
│  SupBrainNote                    [⚙️]   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              ┌─────────┐                │
│              │         │                │
│              │   🎤    │                │
│              │         │                │
│              └─────────┘                │
│                                         │
│        Toque para gravar                │
│         sua primeira nota               │  ← Hint expandido
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              🎧                         │  ← Ilustração
│                                         │
│     Suas notas aparecerão aqui          │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│         ┌─────────────────┐             │
│         │    📥 Inbox     │             │  ← Sem badge
│         └─────────────────┘             │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

---

## 4.2 Tela: Inbox

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  Inbox                              │  ← Header
│      3 para classificar                 │     Subtítulo: caption
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📥 INBOX            hoje, 11:45 │    │
│  │                                 │    │
│  │ "Lembrar de falar com Marcos   │    │
│  │  sobre aquele negócio que ele  │    │
│  │  mencionou na reunião passada" │    │
│  │                                 │    │
│  │ ▶ 0:15                          │    │
│  │                                 │    │
│  │ ────────────────────────────── │    │  ← Divider
│  │                                 │    │
│  │ Mover para:                     │    │
│  │ ┌──────┐┌──────┐┌──────┐┌────┐ │    │
│  │ │ Casa ││UAIZ. ││Trab. ││ + │ │    │  ← Caixinhas
│  │ └──────┘└──────┘└──────┘└────┘ │    │     Scroll horizontal
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📥 INBOX            hoje, 08:20 │    │
│  │                                 │    │
│  │ "Pesquisar sobre aquele curso  │    │
│  │  que o João indicou"           │    │
│  │                                 │    │
│  │ ▶ 0:08                          │    │
│  │                                 │    │
│  │ ────────────────────────────── │    │
│  │                                 │    │
│  │ Mover para:                     │    │
│  │ ┌──────┐┌──────┐┌──────┐┌────┐ │    │
│  │ │ Casa ││UAIZ. ││Trab. ││ + │ │    │
│  │ └──────┘└──────┘└──────┘└────┘ │    │
│  └─────────────────────────────────┘    │
│                                         │
│           (scroll para mais)            │
│                                         │
├─────────────────────────────────────────┤
│              [🎤]                       │  ← FAB
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### Especificações

**Card expandido do Inbox:**
- Preview: até 3 linhas (vs 2 na home)
- Seletor de caixinhas:
  - Altura: 32px
  - Scroll horizontal
  - Background: box-color (10% opacity)
  - Border: 1px box-color (30% opacity)
  - Text: caption, box-color
  - Botão [+]: mesmo estilo, icon "plus"

**Ação de classificar:**
1. Tap na caixinha
2. Haptic light
3. Card faz slide left (300ms)
4. Card colapsa (200ms)
5. Toast: "Movido para UAIZOUK"
6. Contador no header atualiza

**Botão [+] (criar caixinha):**
1. Tap
2. Modal "Nova caixinha" abre
3. Após criar:
   - Nova caixinha aparece na lista
   - Nota é movida automaticamente
   - Card colapsa

**FAB:**
- Mesmo comportamento da Home
- Notas gravadas daqui vão pra Inbox

---

### Estado: Inbox Vazio

```
┌─────────────────────────────────────────┐
│ [←]  Inbox                              │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│               ✓                         │  ← icon-xl, success
│                                         │
│        Tudo organizado!                 │  ← title-2
│                                         │
│    Suas notas estão nas caixinhas.      │  ← body-small, text-secondary
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│              [🎤]                       │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

---

## 4.3 Tela: Lista de Notas

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  Todas as notas             [🔍]    │  ← Header
│      16 notas                           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Filtrar: Todas as caixinhas ▼  │    │  ← Dropdown
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Hoje ─────────────────────────────     │  ← Separador de data
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ UAIZOUK              14:32      │    │
│  │ "Salão Aurora pode servir..."   │    │
│  │ ▶ 0:23                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ CASA                  09:15     │    │
│  │ "Ligar pro eletricista..."      │    │
│  │ ▶ 0:12                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Ontem ────────────────────────────     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ UAIZOUK              22:10      │    │
│  │ "Orçamento máximo seria..."     │    │
│  │ ▶ 0:18                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ INBOX                18:45      │    │
│  │ "Falar com Marcos sobre..."     │    │
│  │ ▶ 0:08                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│         (scroll infinito)               │
│                                         │
├─────────────────────────────────────────┤
│              [🎤]                       │  ← FAB
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### Dropdown de Filtro

```
Ao clicar no dropdown:

┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────┐     │
│ │ ✓ Todas as caixinhas            │     │
│ ├─────────────────────────────────┤     │
│ │   Casa (5)                      │     │
│ ├─────────────────────────────────┤     │
│ │   UAIZOUK (8)                   │     │
│ ├─────────────────────────────────┤     │
│ │   Trabalho - Aetrix (3)         │     │
│ ├─────────────────────────────────┤     │
│ │   Réveillon 2024 (0)            │     │
│ ├─────────────────────────────────┤     │
│ │ ⚙️ Gerenciar caixinhas          │     │  ← Vai pra tela de gestão
│ └─────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

**Ao selecionar uma caixinha:**
- Header muda: "UAIZOUK" (nome da caixinha)
- Subtítulo: "8 notas"
- Lista filtra instantaneamente
- Badge do dropdown mostra a cor da caixinha

---

### Busca (ao clicar 🔍)

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  ┌─────────────────────────┐ [✕]   │
│      │ Buscar notas...      🎤 │        │  ← Input de busca
│      └─────────────────────────┘        │
├─────────────────────────────────────────┤
│                                         │
│  Buscas recentes:                       │  ← Se houver
│                                         │
│  🕐 salão aurora                        │
│  🕐 orçamento                           │
│  🕐 eletricista                         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  (teclado aberto)                       │
│                                         │
└─────────────────────────────────────────┘
```

**Ao digitar/buscar:**
- Busca em tempo real (debounce 300ms)
- Resultados substituem "buscas recentes"
- Highlight do termo nos resultados
- [✕] limpa busca e volta à lista normal

---

## 4.4 Tela: Nota Individual

### Modo Visualização

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  Nota                       [···]   │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │          UAIZOUK                │    │  ← Badge clicável
│  └─────────────────────────────────┘    │     Vai pra lista filtrada
│                                         │
│  🎤 Sua nota                            │  ← Origem
│  12 de dezembro, 2024 às 14:32          │  ← Data completa
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   ▶     advancement────○── 0:23  │    │  ← Player
│  │        🔉 ▁▂▃▅▃▂▁              │    │     Volume + waveform mini
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  Passei na porta do Salão Aurora, na    │
│  Rua das Flores. Parece ter espaço      │
│  suficiente pro UAIZOUK. O lugar tava   │
│  fechado mas pelo vidro deu pra ver     │
│  que é amplo. Acho que cabe umas 80     │
│  pessoas tranquilo. Preciso ligar pra   │
│  pegar valor do aluguel.                │
│                                         │  ← body, text-primary
│  ───────────────────────────────────    │     Scroll se necessário
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 💡 Identificamos:               │    │  ← Insights da IA (opcional)
│  │                                 │    │
│  │ • Local mencionado: Salão Aurora│    │
│  │ • Capacidade: ~80 pessoas       │    │
│  │ • Ação pendente: ligar p/ preço │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│              [🎤]                       │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### Menu [···]

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ✏️  Editar nota                 │    │
│  ├─────────────────────────────────┤    │
│  │ 📦  Mover para outra caixinha   │    │
│  ├─────────────────────────────────┤    │
│  │ 🗑️  Excluir nota                │    │  ← Cor: error
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

### Modo Edição

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [Cancelar]  Editar         [Salvar]     │  ← Header de edição
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  UAIZOUK                    ▼   │    │  ← Dropdown p/ trocar caixinha
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Passei na porta do Salão        │    │
│  │ Aurora, na Rua das Flores.      │    │
│  │ Parece ter espaço suficiente    │    │
│  │ pro UAIZOUK. O lugar tava       │    │
│  │ fechado mas pelo vidro deu pra  │    │
│  │ ver que é amplo. Acho que cabe  │    │
│  │ umas 80 pessoas tranquilo.      │    │
│  │ Preciso ligar pra pegar valor   │    │
│  │ do aluguel.                     │    │
│  │                                 │    │
│  │ ATUALIZAÇÃO: Liguei e o valor   │    │  ← Edição do usuário
│  │ é R$1.800 por dia.|             │    │     Cursor
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔊 Ouvir áudio original    0:23 │    │  ← Player compacto
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ Q W E R T Y U I O P               │  │  ← Teclado
│  │ A S D F G H J K L                 │  │
│  │ Z X C V B N M  ⌫                  │  │
│  │ 123  🌐  [espaço]  return         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Comportamentos:**
- TextInput multiline com auto-grow
- Teclado abre automaticamente
- Scroll se texto for maior que área visível
- "Cancelar":
  - Se houve mudança: modal de confirmação
  - Se não: volta pro modo visualização
- "Salvar":
  - Loading state
  - Toast "Nota atualizada"
  - Volta pro modo visualização

---

## 4.5 Tela: Gerenciar Caixinhas

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  Caixinhas                          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ●  Casa                         │    │  ← Cor + nome
│  │    5 notas                 [···]│    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ●  UAIZOUK                      │    │
│  │    8 notas                 [···]│    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ●  Trabalho - Aetrix            │    │
│  │    3 notas                 [···]│    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ●  Réveillon 2024               │    │
│  │    0 notas                 [···]│    │
│  └─────────────────────────────────┘    │
│                                         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      + Criar nova caixinha      │    │  ← Botão secundário
│  └─────────────────────────────────┘    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Menu [···] da Caixinha

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │ ✏️  Renomear                    │    │
│  ├─────────────────────────────────┤    │
│  │ 🗑️  Excluir                     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 4.6 Tela: Configurações

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ [←]  Configurações                      │
├─────────────────────────────────────────┤
│                                         │
│  CONTA                                  │  ← Section header
│  ┌─────────────────────────────────┐    │
│  │ 👤  Max                         │    │
│  │     max@email.com               │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Alterar senha               [→] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  DADOS                                  │
│  ┌─────────────────────────────────┐    │
│  │ Gerenciar caixinhas         [→] │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Exportar notas              [→] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  SOBRE                                  │
│  ┌─────────────────────────────────┐    │
│  │ Versão                    1.0.0 │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Termos de uso               [→] │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Política de privacidade     [→] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🚪 Sair da conta                │    │  ← Destaque diferente
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🗑️ Excluir minha conta          │    │  ← Cor: error
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

# PARTE 5: MODAIS E COMPONENTES GLOBAIS

## 5.1 Modal: Criar Caixinha

```
┌─────────────────────────────────────────┐
│                                         │
│  ▔▔▔▔▔▔▔▔▔▔ (handle)                   │
│                                         │
│     Nova caixinha                       │  ← title-2
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Nome da caixinha                │    │  ← Input, autofocus
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Cancelar   │  │     Criar       │   │  ← Botões
│  └─────────────┘  └─────────────────┘   │     Secundário | Primário
│                                         │
└─────────────────────────────────────────┘
```

**Specs:**
- Tipo: Bottom sheet
- Border radius top: 16px
- Handle: 36x4px, bg-overlay, centered
- Padding: 24px
- Backdrop: bg-base 50% opacity, dismissível

---

## 5.2 Modal: Renomear Caixinha

```
┌─────────────────────────────────────────┐
│                                         │
│  ▔▔▔▔▔▔▔▔▔▔                            │
│                                         │
│     Renomear caixinha                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ UAIZOUK                         │    │  ← Pré-preenchido, selecionado
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Cancelar   │  │     Salvar      │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5.3 Modal: Mover Nota

```
┌─────────────────────────────────────────┐
│                                         │
│  ▔▔▔▔▔▔▔▔▔▔                            │
│                                         │
│     Mover para                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ○  Casa                         │    │
│  ├─────────────────────────────────┤    │
│  │ ●  UAIZOUK              (atual) │    │  ← Marcado + disabled
│  ├─────────────────────────────────┤    │
│  │ ○  Trabalho - Aetrix            │    │
│  ├─────────────────────────────────┤    │
│  │ ○  Réveillon 2024               │    │
│  ├─────────────────────────────────┤    │
│  │ +  Criar nova caixinha          │    │  ← Abre modal encadeado
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           Cancelar              │    │  ← Só cancelar, seleção é imediata
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Comportamento:** Ao selecionar uma caixinha (exceto atual):
1. Haptic light
2. Modal fecha
3. Toast "Movido para [caixinha]"
4. Se veio do Inbox, card colapsa

---

## 5.4 Modal: Confirmar Exclusão

**Excluir nota:**

```
┌─────────────────────────────────────────┐
│                                         │
│     Excluir nota?                       │
│                                         │
│  O áudio e a transcrição serão          │
│  removidos permanentemente.             │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Cancelar   │  │    Excluir      │   │  ← Excluir: cor error
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Excluir caixinha com notas:**

```
┌─────────────────────────────────────────┐
│                                         │
│     Excluir "UAIZOUK"?                  │
│                                         │
│  Esta caixinha tem 8 notas.             │
│  O que fazer com elas?                  │
│                                         │
│  ○ Mover para Inbox                     │  ← Opção segura (default)
│  ○ Excluir tudo permanentemente         │  ← Opção destrutiva
│                                         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Cancelar   │  │   Confirmar     │   │
│  └─────────────┘  └─────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5.5 Toast System

### Posicionamento

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │  ← Toast aqui
│ │ ✓  Nota salva em UAIZOUK      [Ver] │ │     Margin top: 8px
│ └─────────────────────────────────────┘ │     Margin horizontal: 16px
│                                         │
│           (resto da tela)               │
│                                         │
└─────────────────────────────────────────┘
```

### Tipos

| Tipo | Ícone | Cor borda | Cor fundo |
|------|-------|-----------|-----------|
| Success | ✓ (check) | success | success 15% |
| Warning | ⚠️ (alert-triangle) | warning | warning 15% |
| Error | ✕ (x) | error | error 15% |
| Info | ℹ️ (info) | info | info 15% |

### Comportamentos

- Auto-dismiss: 4 segundos
- Swipe up: dismiss imediato
- Tap na ação [Ver]: navega e dismiss
- Múltiplos toasts: stack (máximo 2 visíveis)

---

## 5.6 FAB (Floating Action Button)

### Specs

```
┌───────────┐
│           │
│    🎤     │  ← Icon: mic, 24px, white
│           │
└───────────┘

Diâmetro: 56px
Border radius: full (28px)
Background: primary
Shadow: elevation-3
Position: bottom center
Bottom: 16px + safe area
```

### Comportamentos

- Presente em: Inbox, Lista de Notas, Nota Individual
- Não presente em: Home (tem o botão grande), Configurações
- Ao pressionar: mesma lógica de gravação da Home
- Scroll: FAB permanece fixo

---

# PARTE 6: OFFLINE E PERFORMANCE

## 6.1 Estratégia Offline-First

### Princípio

> Gravação NUNCA falha. Se não tem internet, salva local e sincroniza depois.

### Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Usuário grava                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                       │
│  │ Salva áudio     │  ← Sempre local primeiro              │
│  │ localmente      │     FileSystem.documentDirectory       │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐    Não    ┌─────────────────┐         │
│  │ Tem internet?   │─────────▶│ Adiciona à fila │         │
│  └────────┬────────┘           │ de sincronização│         │
│           │ Sim                └────────┬────────┘         │
│           ▼                             │                   │
│  ┌─────────────────┐                    │                   │
│  │ Upload + transcrição │               │                   │
│  └────────┬────────┘                    │                   │
│           │                             │                   │
│           ▼                             │                   │
│  ┌─────────────────┐                    │                   │
│  │ Salva no banco  │◀───────────────────┘                  │
│  │ local (SQLite)  │     Quando voltar online              │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fila de Sincronização

```typescript
// types/sync.ts
interface QueuedItem {
  id: string;
  type: 'note' | 'edit' | 'delete' | 'move';
  payload: any;
  createdAt: Date;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
  lastError?: string;
}

// Retry strategy
const RETRY_DELAYS = [
  1000,    // 1s
  5000,    // 5s
  30000,   // 30s
  60000,   // 1min
  300000,  // 5min
];
```

### Feedback Visual

```
┌─────────────────────────────────────────┐
│ ⚠️ 2 notas aguardando sincronização     │  ← Banner amarelo
│    Conecte à internet para enviar       │     Topo da Home
└─────────────────────────────────────────┘
```

Notas pendentes na lista:

```
┌─────────────────────────────────────────┐
│ ☁️↑ CASA               agora            │  ← Ícone de "uploading"
│ "Nova nota aguardando..."               │
│ ▶ 0:12                                  │
└─────────────────────────────────────────┘
```

---

## 6.2 Performance

### Metas

| Métrica | Meta | Como medir |
|---------|------|------------|
| Cold start | < 2s | Time to Interactive |
| Tap → Recording | < 300ms | First audio frame |
| Lista scroll | 60fps | Frame drops |
| Navegação | < 200ms | Screen transition |

### Otimizações

**1. Splash Nativo**
```json
// app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#0D0D0F"
    }
  }
}
```

**2. Lazy Loading de Telas**
```typescript
// navigation/MainStack.tsx
const NoteDetailScreen = React.lazy(() => import('../screens/NoteDetailScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
```

**3. Lista Virtualizada**
```typescript
// Usar FlashList ao invés de FlatList
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={notes}
  renderItem={renderNote}
  estimatedItemSize={100}
/>
```

**4. Imagens Otimizadas**
- Waveform: Canvas/SVG, não imagens
- Ícones: SVG via lucide-react-native
- Sem imagens pesadas no app

**5. Estado Local Primeiro**
```typescript
// Otimistic updates
const deleteNote = async (id: string) => {
  // 1. Remove do estado local imediatamente
  setNotes(prev => prev.filter(n => n.id !== id));

  // 2. Envia pro servidor em background
  try {
    await api.deleteNote(id);
  } catch (error) {
    // 3. Rollback se falhar
    setNotes(prev => [...prev, originalNote]);
    showToast({ type: 'error', message: 'Erro ao excluir' });
  }
};
```

---

# PARTE 7: ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.styles.ts
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Toast/
│   │   ├── Modal/
│   │   ├── FAB/
│   │   └── index.ts
│   ├── notes/
│   │   ├── NoteCard/
│   │   ├── NotePlayer/
│   │   ├── BoxBadge/
│   │   └── index.ts
│   ├── recording/
│   │   ├── RecordButton/
│   │   ├── Waveform/
│   │   ├── RecordingOverlay/
│   │   └── index.ts
│   └── boxes/
│       ├── BoxSelector/
│       ├── BoxItem/
│       └── index.ts
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── home/
│   │   └── HomeScreen.tsx
│   ├── inbox/
│   │   └── InboxScreen.tsx
│   ├── notes/
│   │   ├── NotesListScreen.tsx
│   │   ├── NoteDetailScreen.tsx
│   │   └── NoteEditScreen.tsx
│   ├── boxes/
│   │   └── BoxesManagementScreen.tsx
│   └── settings/
│       └── SettingsScreen.tsx
│
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthStack.tsx
│   ├── MainStack.tsx
│   └── types.ts
│
├── services/
│   ├── api/
│   │   ├── client.ts        # Axios/fetch config
│   │   ├── auth.ts          # Login, signup, refresh
│   │   ├── notes.ts         # CRUD notas
│   │   └── boxes.ts         # CRUD caixinhas
│   ├── audio/
│   │   ├── recorder.ts      # expo-av recording
│   │   └── player.ts        # expo-av playback
│   ├── storage/
│   │   ├── secure.ts        # SecureStore (tokens)
│   │   ├── async.ts         # AsyncStorage (preferences)
│   │   └── database.ts      # SQLite (notas offline)
│   └── sync/
│       ├── queue.ts         # Fila de sincronização
│       └── network.ts       # NetInfo listeners
│
├── hooks/
│   ├── useAuth.ts
│   ├── useRecording.ts
│   ├── useNotes.ts
│   ├── useBoxes.ts
│   ├── useOfflineSync.ts
│   └── useToast.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── NotesContext.tsx
│   ├── ToastContext.tsx
│   └── index.ts
│
├── types/
│   ├── auth.ts
│   ├── note.ts
│   ├── box.ts
│   └── api.ts
│
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   ├── animations.ts
│   └── index.ts
│
├── utils/
│   ├── formatters.ts        # Datas, duração, etc
│   ├── validators.ts        # Email, senha
│   ├── haptics.ts           # Feedback háptico
│   └── helpers.ts           # Misc
│
├── constants/
│   ├── config.ts            # API URLs, timeouts
│   └── storage.ts           # Keys do storage
│
└── App.tsx
```

---

# PARTE 8: CHECKLIST DE IMPLEMENTAÇÃO

## Fase 1: Fundação (Semana 1-2)

- [ ] Setup Expo + TypeScript
- [ ] Configurar estrutura de pastas
- [ ] Implementar theme (cores, typography, spacing)
- [ ] Criar componentes base (Button, Input, Card)
- [ ] Configurar navegação (React Navigation)
- [ ] Implementar AuthContext + SecureStore
- [ ] Criar telas de autenticação (Login, SignUp, ForgotPassword)
- [ ] Conectar com API de auth

## Fase 2: Core (Semana 3-4)

- [ ] Implementar HomeScreen (layout)
- [ ] Criar RecordButton + animações
- [ ] Implementar gravação de áudio (expo-av)
- [ ] Criar RecordingOverlay + Waveform
- [ ] Implementar upload de áudio
- [ ] Conectar com API de transcrição
- [ ] Criar NoteCard component
- [ ] Listar últimas notas na Home
- [ ] Implementar Toast system

## Fase 3: Organização (Semana 5-6)

- [ ] Criar InboxScreen
- [ ] Implementar BoxSelector inline
- [ ] Criar NotesListScreen com filtro
- [ ] Implementar dropdown de caixinhas
- [ ] Criar BoxesManagementScreen
- [ ] Implementar modais (criar, renomear, excluir)
- [ ] Adicionar FAB nas telas secundárias

## Fase 4: Detalhes (Semana 7-8)

- [ ] Criar NoteDetailScreen
- [ ] Implementar player de áudio
- [ ] Criar NoteEditScreen
- [ ] Implementar busca
- [ ] Criar SettingsScreen
- [ ] Adicionar haptic feedback
- [ ] Implementar animações de transição

## Fase 5: Polish (Semana 9-10)

- [ ] Implementar offline queue
- [ ] Criar banco local (SQLite)
- [ ] Adicionar listeners de network
- [ ] Implementar sync em background
- [ ] Otimizar performance (FlashList, lazy loading)
- [ ] Testar em dispositivos reais
- [ ] Ajustar safe areas iOS/Android
- [ ] Preparar para publicação

---

# PARTE 9: ASSETS NECESSÁRIOS

## Ícones e Imagens

| Asset | Tamanho | Formato | Uso |
|-------|---------|---------|-----|
| App icon | 1024x1024 | PNG | Stores |
| Splash | 1284x2778 | PNG | Launch screen |
| Logo | 64x64 | SVG | Header |
| Adaptive icon (Android) | 432x432 | PNG | Foreground |

## Fontes

Usar fontes do sistema (SF Pro / Roboto). Sem fontes customizadas.

## Sons

| Som | Duração | Uso |
|-----|---------|-----|
| record_start.wav | ~100ms | Início da gravação |
| record_stop.wav | ~100ms | Fim da gravação |
| success.wav | ~200ms | Nota salva (opcional) |

---

*Fim do PRD. Este documento serve como fonte única de verdade para o desenvolvimento do SupBrainNote Mobile.*