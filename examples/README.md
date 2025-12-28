# 📚 Exemplos de Referência

Esta pasta contém exemplos de código e projetos que servem como referência e inspiração para o desenvolvimento do SaaS Bootstrap.

## 📱 Mobile App Example

**Localização:** `examples/mobile/`

**Projeto:** Smart Honey App (React Native + Expo)

**Origem:** `git@github.com:uaimax/smart-honey-app.git`

### Sobre

App React Native funcional desenvolvido com Expo, focado em registro rápido de despesas. Serve como **referência de arquitetura e padrões** para o futuro app mobile do SaaS Bootstrap.

### Características Principais

- ✅ **React Native + Expo** - Stack moderna e produtiva
- ✅ **TypeScript** - Type safety
- ✅ **Arquitetura bem estruturada** - Separação clara de responsabilidades
- ✅ **Offline-first** - Fila de sincronização offline
- ✅ **Gravação de áudio** - Integração com APIs de áudio
- ✅ **Design system** - Cores, tipografia, espaçamento organizados
- ✅ **Hooks customizados** - Reutilização de lógica
- ✅ **Context API** - Estado global
- ✅ **Navegação** - React Navigation configurado

### Estrutura de Referência

```
examples/mobile/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── screens/          # Telas principais
│   ├── navigation/       # Configuração de navegação
│   ├── services/         # Lógica de negócio e API
│   ├── hooks/            # Custom hooks
│   ├── context/          # Estado global
│   ├── types/            # TypeScript types
│   ├── theme/            # Design system
│   └── utils/            # Funções utilitárias
├── .context/             # Documentação para LLMs
├── .cursorrules          # Regras do projeto
└── README.md             # Documentação completa
```

### Como Usar como Referência

1. **Arquitetura de Pastas**: Use como modelo para organizar o futuro app mobile
2. **Padrões de Código**: Consulte `.cursorrules` e estrutura de componentes
3. **Integração com API**: Veja `src/services/api.ts` para padrões de chamadas
4. **Offline Support**: Estude `src/services/queue.ts` para implementação offline
5. **Hooks Customizados**: Use `src/hooks/` como referência para criar hooks reutilizáveis
6. **Design System**: Consulte `src/theme/` para organização de cores e estilos

### ⚠️ Importante

- Este é um **exemplo de referência**, não código ativo
- Não modifique este código diretamente
- Use como inspiração para o app mobile que será criado em `mobile/`
- Mantenha atualizado via `git pull` quando necessário

### Atualizar o Exemplo

```bash
cd examples/mobile
git pull origin main
```

---

**Nota:** Este exemplo foi clonado apenas para referência. O app mobile do SaaS Bootstrap será criado em `mobile/` seguindo padrões similares mas adaptados ao contexto do projeto.

