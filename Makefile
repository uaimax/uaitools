.PHONY: help dev test migrate seed clean

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Inicia servidor de desenvolvimento
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py runserver

test: ## Executa testes
	cd backend && source venv/bin/activate 2>/dev/null || true && pytest

migrate: ## Aplica migrations
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py migrate

makemigrations: ## Cria novas migrations
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py makemigrations

seed: ## Popula dados de exemplo (tenants, users, leads)
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py seed

seed-clear: ## Limpa e recria dados de exemplo
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py seed --clear

clean: ## Remove arquivos temporários
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -r {} + 2>/dev/null || true

cleanup-audit: ## Limpa logs de auditoria antigos (LGPD)
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py cleanup_audit_logs

cleanup-audit-dry: ## Simula limpeza de logs (dry-run)
	cd backend && source venv/bin/activate 2>/dev/null || true && python manage.py cleanup_audit_logs --dry-run

