/** Componente Dialog para exibir documentos legais (Termos e Política de Privacidade). */

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getTerms, getPrivacyPolicy, type LegalDocument } from '@/features/legal/services/legal';

interface LegalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'terms' | 'privacy';
}

export function LegalDocumentDialog({
  open,
  onOpenChange,
  documentType,
}: LegalDocumentDialogProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !document) {
      setLoading(true);
      setError(null);

      const fetchDocument = async () => {
        try {
          const data =
            documentType === 'terms' ? await getTerms() : await getPrivacyPolicy();
          setDocument(data);
        } catch (err: any) {
          console.error('Erro ao buscar documento:', err);
          setError(
            err.response?.data?.error ||
              'Erro ao carregar documento. Tente novamente mais tarde.'
          );
        } finally {
          setLoading(false);
        }
      };

      fetchDocument();
    }
  }, [open, documentType, document]);

  const title =
    documentType === 'terms' ? 'Termos e Condições' : 'Política de Privacidade';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {documentType === 'terms'
              ? 'Leia atentamente os termos e condições antes de aceitar.'
              : 'Leia atentamente nossa política de privacidade antes de aceitar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {document && !loading && !error && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{document.content}</ReactMarkdown>
              {document.version && (
                <p className="text-xs text-muted-foreground mt-4">
                  Versão {document.version} - Última atualização:{' '}
                  {new Date(document.last_updated).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

