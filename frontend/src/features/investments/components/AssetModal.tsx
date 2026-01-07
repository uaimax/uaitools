/** Modal para adicionar/editar ativo. */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAsset, useUpdateAsset } from "../hooks/use-investments";
import { useToast } from "@/hooks/use-toast";
import type { Asset } from "../hooks/use-investments";

interface AssetModalProps {
  portfolioId: string | null;
  asset?: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetModal({ portfolioId, asset, open, onOpenChange }: AssetModalProps) {
  const { toast } = useToast();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");

  useEffect(() => {
    if (asset) {
      setTicker(asset.ticker);
      setQuantity(asset.quantity);
      setAveragePrice(asset.average_price);
    } else {
      setTicker("");
      setQuantity("");
      setAveragePrice("");
    }
  }, [asset, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId) return;

    const quantityNum = parseFloat(quantity.replace(",", "."));
    const priceNum = parseFloat(averagePrice.replace(",", "."));

    if (!ticker.trim()) {
      toast({
        title: "Ticker é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Quantidade inválida",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Preço inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (asset) {
        await updateAsset.mutateAsync({
          id: asset.id,
          data: {
            ticker: ticker.trim().toUpperCase(),
            quantity: quantityNum.toString(),
            average_price: priceNum.toString(),
          },
        });
        toast({
          title: "Ativo atualizado",
          description: "As informações foram salvas",
        });
      } else {
        await createAsset.mutateAsync({
          portfolio: portfolioId,
          ticker: ticker.trim().toUpperCase(),
          quantity: quantityNum.toString(),
          average_price: priceNum.toString(),
        });
        toast({
          title: "Ativo adicionado",
          description: "O ativo foi adicionado à sua carteira",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: asset ? "Não foi possível atualizar" : "Não foi possível adicionar",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? "Editar ativo" : "Adicionar ativo"}</DialogTitle>
          <DialogDescription>
            {asset
              ? "Atualize as informações do ativo"
              : "Adicione um novo ativo à sua carteira"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker *</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="TAEE11"
              required
              disabled={!!asset}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="average_price">Preço Médio (R$) *</Label>
            <Input
              id="average_price"
              type="text"
              value={averagePrice}
              onChange={(e) => setAveragePrice(e.target.value)}
              placeholder="35.50"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAsset.isPending || updateAsset.isPending}>
              {asset ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



