/** Opções de processamento de arquivo. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type ProcessingMode = "single" | "split_paragraphs" | "split_lines";

interface FileProcessingOptionsProps {
  value: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
}

export function FileProcessingOptions({
  value,
  onChange,
}: FileProcessingOptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Opções de processamento</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Uma nota grande</p>
                <p className="text-xs text-muted-foreground">
                  Todo o arquivo vira uma única nota
                </p>
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="split_paragraphs" id="split_paragraphs" />
            <Label htmlFor="split_paragraphs" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Dividir por parágrafos</p>
                <p className="text-xs text-muted-foreground">
                  Cada parágrafo vira uma nota separada
                </p>
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="split_lines" id="split_lines" />
            <Label htmlFor="split_lines" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Dividir por linhas</p>
                <p className="text-xs text-muted-foreground">
                  Cada linha vira uma nota separada
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
