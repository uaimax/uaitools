/** Preview do conteúdo do arquivo. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilePreviewProps {
  content: string;
  maxLines?: number;
}

export function FilePreview({ content, maxLines = 20 }: FilePreviewProps) {
  const lines = content.split("\n");
  const previewLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preview do conteúdo</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px]">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {previewLines.join("\n")}
            {hasMore && (
              <span className="text-muted-foreground">
                {"\n"}... ({lines.length - maxLines} linhas restantes)
              </span>
            )}
          </pre>
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-2">
          {content.length} caracteres, {lines.length} linhas
        </p>
      </CardContent>
    </Card>
  );
}
