/** Página principal da versão web do Baú Mental com sistema de rotas. */

import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { WebLayout } from "../components/layout/WebLayout";
import { BoxViewPage } from "./BoxViewPage";
import { GlobalViewPage } from "./GlobalViewPage";
import { InboxViewPage } from "./InboxViewPage";
import { NoteDetailPage } from "./NoteDetailPage";
import { ThreadPage } from "./ThreadPage";
import { HomePage } from "./HomePage";
import { useBoxes } from "../hooks/use-boxes";
import { useBauMentalStore } from "../stores/bau-mental-store";
import { useEffect } from "react";

export default function BauMentalWebPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: boxes } = useBoxes();
  const { setSelectedBoxId } = useBauMentalStore();

  // Redirecionar para última caixinha ou Global se estiver na rota base
  useEffect(() => {
    if (location.pathname === "/bau-mental") {
      const boxesArray = Array.isArray(boxes) ? boxes : [];
      if (boxesArray.length > 0) {
        // Redirecionar para primeira caixinha
        const firstBox = boxesArray[0];
        setSelectedBoxId(firstBox.id);
        // O Navigate será tratado pelo componente
      } else {
        // Redirecionar para Global
        setSelectedBoxId(null);
      }
    }
  }, [location.pathname, boxes, setSelectedBoxId]);

  const handleSearch = (query: string) => {
    // A busca já está sendo feita automaticamente via searchQuery no store
    // que é usado pelos hooks useNotes nas páginas
    const { setSearchQuery } = useBauMentalStore.getState();
    setSearchQuery(query);
  };

  return (
    <WebLayout onSearch={handleSearch}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/bau-mental/home" replace />}
        />
        <Route path="/home" element={<HomePage />} />
        <Route path="/box/:id" element={<BoxViewPage />} />
        <Route path="/inbox" element={<InboxViewPage />} />
        <Route path="/global" element={<GlobalViewPage />} />
        <Route path="/note/:id" element={<NoteDetailPage />} />
        <Route path="/thread/:id?" element={<ThreadPage />} />
      </Routes>
    </WebLayout>
  );
}
