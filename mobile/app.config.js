/**
 * Configuração do Expo com config plugin para intent filters
 */

const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin para adicionar intent filters corretamente no AndroidManifest.xml
 */
function withAndroidIntentFilters(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainActivity = androidManifest.manifest.application[0].activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (!mainActivity) {
      console.warn('MainActivity não encontrada no AndroidManifest');
      return config;
    }

    // Garantir que a activity está exportada (necessário no Android 12+)
    if (!mainActivity.$['android:exported']) {
      mainActivity.$['android:exported'] = 'true';
    }

    // Adicionar intent filters se não existirem
    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    // Remover intent filters antigos de audio/* para evitar duplicação
    mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
      (filter) =>
        !(
          filter.action?.[0]?.['$']?.['android:name'] === 'android.intent.action.SEND' &&
          filter.data?.[0]?.['$']?.['android:mimeType'] === 'audio/*'
        ) &&
        !(
          filter.action?.[0]?.['$']?.['android:name'] === 'android.intent.action.SEND_MULTIPLE' &&
          filter.data?.[0]?.['$']?.['android:mimeType'] === 'audio/*'
        )
    );

    // Adicionar intent filter para ACTION_SEND com audio/*
    mainActivity['intent-filter'].push({
      action: [
        {
          $: {
            'android:name': 'android.intent.action.SEND',
          },
        },
      ],
      category: [
        {
          $: {
            'android:name': 'android.intent.category.DEFAULT',
          },
        },
      ],
      data: [
        {
          $: {
            'android:mimeType': 'audio/*',
          },
        },
      ],
    });

    // Adicionar intent filter para ACTION_SEND_MULTIPLE com audio/*
    mainActivity['intent-filter'].push({
      action: [
        {
          $: {
            'android:name': 'android.intent.action.SEND_MULTIPLE',
          },
        },
      ],
      category: [
        {
          $: {
            'android:name': 'android.intent.category.DEFAULT',
          },
        },
      ],
      data: [
        {
          $: {
            'android:mimeType': 'audio/*',
          },
        },
      ],
    });

    return config;
  });
}

module.exports = {
  expo: {
    name: 'SupBrainNote',
    slug: 'supbrainnote-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0D0D0F',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.uaitools.supbrainnote',
      infoPlist: {
        UISupportsDocumentBrowser: true,
        CFBundleDocumentTypes: [
          {
            CFBundleTypeName: 'Audio Files',
            CFBundleTypeRole: 'Viewer',
            LSItemContentTypes: [
              'public.audio',
              'public.mp3',
              'public.m4a',
              'com.apple.m4a-audio',
              'public.aac-audio',
              'org.xiph.opus',
              'public.ogg',
              'public.opus',
            ],
          },
        ],
      },
    },
    scheme: 'supbrainnote',
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0D0D0F',
      },
      package: 'com.uaitools.supbrainnote',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.VIBRATE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      intentFilters: [
        {
          action: 'android.intent.action.SEND',
          type: 'audio/*',
          category: ['android.intent.category.DEFAULT'],
        },
        {
          action: 'android.intent.action.SEND_MULTIPLE',
          type: 'audio/*',
          category: ['android.intent.category.DEFAULT'],
        },
      ],
      versionCode: 1,
    },
    web: {
      favicon: './assets/icon.png',
    },
    plugins: [
      [
        'expo-av',
        {
          microphonePermission:
            'SupBrainNote precisa acessar o microfone para gravar suas notas por voz.',
        },
      ],
      'expo-secure-store',
      'expo-sqlite',
      [
        'expo-share-intent',
        {
          ios: {
            appGroupIdentifier: 'group.com.uaitools.supbrainnote',
          },
          android: {
            mimeTypes: ['audio/*'],
          },
        },
      ],
      // Plugin customizado para garantir intent filters
      withAndroidIntentFilters,
    ],
    extra: {
      eas: {
        projectId: '49aa7c31-abfa-4475-92dd-e646698d692a',
      },
      EXPO_PUBLIC_API_URL: 'https://ut-be.app.webmaxdigital.com',
    },
    owner: 'uaimax',
  },
};

