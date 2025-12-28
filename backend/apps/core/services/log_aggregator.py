"""Log Aggregator - Agrega e serve logs estruturados para análise por LLMs.

Funcionalidades:
- Tail de arquivos de log em tempo real
- Parse de JSON de cada linha
- Agregação de logs backend + frontend
- API para streaming (SSE) para LLMs
"""

import json
import subprocess
import threading
import time
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional
from queue import Queue, Empty

from django.conf import settings


class LogAggregator:
    """Agrega logs de backend e frontend em tempo real."""

    def __init__(self, log_dir: Optional[Path] = None):
        """Inicializa agregador de logs.

        Args:
            log_dir: Diretório onde estão os arquivos de log.
                    Se None, usa logs/ na raiz do projeto.
        """
        if log_dir is None:
            # Usar logs/ na raiz do projeto (mesmo nível que backend/)
            base_dir = Path(settings.BASE_DIR).parent
            log_dir = base_dir / "logs"

        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)

        # Cache de logs recentes (últimos 1000)
        self.recent_logs: List[Dict[str, Any]] = []
        self.max_cache_size = 1000

        # Thread para tail de logs
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._queue: Queue = Queue()

    def _parse_log_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse uma linha de log JSON.

        Args:
            line: Linha do arquivo de log

        Returns:
            Dict com dados do log ou None se não for JSON válido
        """
        line = line.strip()
        if not line:
            return None

        try:
            log_entry = json.loads(line)

            # Normalizar estrutura
            if not isinstance(log_entry, dict):
                return None

            # Adicionar metadados de agregação
            log_entry["aggregated_at"] = time.time()
            log_entry["aggregated_iso"] = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())

            return log_entry
        except json.JSONDecodeError:
            # Linha não é JSON válido (ex: stack trace, output do servidor)
            # Criar entrada estruturada para linhas não-JSON
            return {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
                "level": "INFO",
                "source": "unknown",
                "message": line[:500],  # Limitar tamanho
                "raw": True,
                "aggregated_at": time.time(),
                "aggregated_iso": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
            }

    def _tail_file(self, filepath: Path, source: str) -> Iterator[Dict[str, Any]]:
        """Faz tail de um arquivo de log e parse JSON.

        Args:
            filepath: Caminho do arquivo de log
            source: Identificador da fonte (backend, frontend)

        Yields:
            Dict com dados do log parseado
        """
        if not filepath.exists():
            return

        try:
            # Usar tail -f para seguir arquivo
            process = subprocess.Popen(
                ["tail", "-f", str(filepath)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
            )

            for line in iter(process.stdout.readline, ""):
                if not line:
                    break

                log_entry = self._parse_log_line(line)
                if log_entry:
                    # Adicionar source se não estiver presente
                    if "source" not in log_entry:
                        log_entry["source"] = source

                    yield log_entry
        except Exception as e:
            # Log erro mas não quebrar
            print(f"Erro ao fazer tail de {filepath}: {e}")

    def _get_log_files(self) -> List[tuple[Path, str]]:
        """Obtém lista de arquivos de log ativos.

        Returns:
            Lista de tuplas (caminho, source)
        """
        today = time.strftime("%Y%m%d")
        files = []

        # Backend log
        backend_log = self.log_dir / f"backend-{today}.log"
        if backend_log.exists():
            files.append((backend_log, "backend"))

        # Frontend log
        frontend_log = self.log_dir / f"frontend-{today}.log"
        if frontend_log.exists():
            files.append((frontend_log, "frontend"))

        # Frontend console logs (JSON do endpoint)
        frontend_console_log = self.log_dir / f"frontend-{today}.log"
        if frontend_console_log.exists():
            files.append((frontend_console_log, "frontend-console"))

        return files

    def _aggregate_loop(self):
        """Loop principal de agregação (roda em thread separada)."""
        while self._running:
            try:
                # Obter arquivos de log ativos
                log_files = self._get_log_files()

                if not log_files:
                    # Sem arquivos de log, aguardar
                    time.sleep(5)
                    continue

                # Para cada arquivo, fazer tail
                threads = []
                for filepath, source in log_files:
                    def tail_and_queue(fp, src):
                        try:
                            for log_entry in self._tail_file(fp, src):
                                self._queue.put(log_entry)
                        except Exception as e:
                            print(f"Erro em tail de {fp}: {e}")

                    thread = threading.Thread(
                        target=tail_and_queue,
                        args=(filepath, source),
                        daemon=True,
                    )
                    thread.start()
                    threads.append(thread)

                # Processar logs da queue
                while self._running:
                    try:
                        log_entry = self._queue.get(timeout=1)

                        # Adicionar ao cache
                        self.recent_logs.append(log_entry)
                        if len(self.recent_logs) > self.max_cache_size:
                            self.recent_logs.pop(0)
                    except Empty:
                        break

                # Aguardar threads terminarem (não devem terminar, mas por segurança)
                for thread in threads:
                    thread.join(timeout=0.1)

            except Exception as e:
                print(f"Erro no loop de agregação: {e}")
                time.sleep(5)

    def start(self):
        """Inicia agregação de logs em background."""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._aggregate_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Para agregação de logs."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def get_recent_logs(
        self,
        limit: int = 100,
        source: Optional[str] = None,
        level: Optional[str] = None,
        since: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Obtém logs recentes com filtros.

        Args:
            limit: Número máximo de logs a retornar
            source: Filtrar por source (backend, frontend, etc)
            level: Filtrar por nível (DEBUG, INFO, WARN, ERROR)
            since: Timestamp Unix (retornar apenas logs após este timestamp)

        Returns:
            Lista de logs filtrados
        """
        logs = self.recent_logs.copy()

        # Filtrar por source
        if source:
            logs = [log for log in logs if log.get("source") == source]

        # Filtrar por level
        if level:
            logs = [log for log in logs if log.get("level") == level]

        # Filtrar por timestamp
        if since:
            logs = [
                log
                for log in logs
                if log.get("aggregated_at", 0) >= since
            ]

        # Ordenar por timestamp (mais recente primeiro)
        logs.sort(key=lambda x: x.get("aggregated_at", 0), reverse=True)

        return logs[:limit]

    def stream_logs(
        self,
        source: Optional[str] = None,
        level: Optional[str] = None,
    ) -> Iterator[Dict[str, Any]]:
        """Stream de logs em tempo real (para SSE).

        Args:
            source: Filtrar por source
            level: Filtrar por nível

        Yields:
            Logs conforme chegam
        """
        last_timestamp = time.time()

        while True:
            try:
                # Obter logs novos desde último timestamp
                new_logs = self.get_recent_logs(
                    limit=1000,
                    source=source,
                    level=level,
                    since=last_timestamp,
                )

                for log in new_logs:
                    yield log
                    last_timestamp = max(
                        last_timestamp,
                        log.get("aggregated_at", last_timestamp),
                    )

                time.sleep(0.5)  # Evitar CPU spinning
            except Exception as e:
                print(f"Erro no stream de logs: {e}")
                time.sleep(1)


# Singleton global
_aggregator: Optional[LogAggregator] = None


def get_aggregator() -> LogAggregator:
    """Obtém instância singleton do agregador."""
    global _aggregator
    if _aggregator is None:
        _aggregator = LogAggregator()
        _aggregator.start()
    return _aggregator


