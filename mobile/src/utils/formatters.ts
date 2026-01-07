/**
 * Utilitários para formatação
 */

/**
 * Formata timestamp relativo (hoje, ontem, data)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `hoje, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  if (diffDays === 1) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `ontem, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  }

  // Formato completo
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata duração em segundos para mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Trunca texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}


