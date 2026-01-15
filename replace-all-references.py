#!/usr/bin/env python3
"""Script para substituir todas as referências a bau_mental/bau-mental por bau_mental/bau_mental"""

import os
import re
from pathlib import Path

# Mapeamento de substituições
REPLACEMENTS = [
    # URLs e paths
    (r'/api/v1/bau-mental/', '/api/v1/bau-mental/'),
    (r'/bau-mental', '/bau-mental'),
    (r'apps\.bau_mental', 'apps.bau_mental'),
    (r'apps/bau_mental', 'apps/bau_mental'),
    (r'bau_mental\.', 'bau_mental.'),
    (r'bau_mental/', 'bau_mental/'),
    
    # Nomes de classes e variáveis
    (r'bau_mental', 'bau_mental'),
    (r'bau_mental', 'bau_mental'),
    (r'bau_mental', 'bau_mental'),
    
    # Nomes de arquivos e diretórios (em strings)
    (r'"bau_mental"', '"bau_mental"'),
    (r"'bau_mental'", "'bau_mental'"),
    (r'`bau_mental`', '`bau_mental`'),
    
    # Throttles
    (r'bau_mentalUploadThrottle', 'BauMentalUploadThrottle'),
    (r'bau_mentalQueryThrottle', 'BauMentalQueryThrottle'),
    (r'bau_mental_upload', 'bau_mental_upload'),
    (r'bau_mental_query', 'bau_mental_query'),
    
    # Storage
    (r'bau_mentalAudioStorage', 'BauMentalAudioStorage'),
    (r'bau_mental-audios', 'bau-mental-audios'),
    (r'/bau_mental/audios/', '/bau_mental/audios/'),
    (r'bau_mental/audios/', 'bau_mental/audios/'),
    
    # Tasks e Celery
    (r'bau_mental-cleanup', 'bau-mental-cleanup'),
    (r'bau_mental\.tasks', 'bau_mental.tasks'),
    
    # Tabelas (em SQL/comentários)
    (r'bau_mental_box', 'bau_mental_box'),
    (r'bau_mental_note', 'bau_mental_note'),
    (r'bau_mental_boxshare', 'bau_mental_boxshare'),
    (r'bau_mental_boxshareinvite', 'bau_mental_boxshareinvite'),
    
    # Documentação
    (r'bau_mental_ARCHITECTURE', 'BAU_MENTAL_ARCHITECTURE'),
    (r'bau_mental_SETUP', 'BAU_MENTAL_SETUP'),
    
    # Mobile
    (r'bau_mental\.db', 'bau_mental.db'),
    (r'bau_mental\.com', 'bau-mental.com'),
    (r'"scheme": "bau_mental"', '"scheme": "bau-mental"'),
]

# Arquivos a ignorar
IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    '__pycache__',
    'venv',
    '.postgres-data',
    'package-lock.json',  # Será atualizado com npm install
    'migrations/0002_alter_box_id_alter_note_id.py',  # Tem SQL histórico
    'migrations/0010_rename_app_tables.py',  # Tem SQL histórico
]

def should_ignore_file(filepath: str) -> bool:
    """Verifica se o arquivo deve ser ignorado"""
    for pattern in IGNORE_PATTERNS:
        if pattern in filepath:
            return True
    return False

def replace_in_file(filepath: Path) -> tuple[int, list[str]]:
    """Substitui referências em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return 0, []
    
    original_content = content
    changes = []
    
    for pattern, replacement in REPLACEMENTS:
        if re.search(pattern, content, re.IGNORECASE):
            new_content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
            if new_content != content:
                changes.append(f"  {pattern} → {replacement}")
                content = new_content
    
    if content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return len(changes), changes
        except (PermissionError, OSError):
            return 0, []
    
    return 0, []

def main():
    """Processa todos os arquivos do projeto"""
    project_root = Path(__file__).parent
    
    # Extensões de arquivo para processar
    extensions = {'.md', '.py', '.ts', '.tsx', '.js', '.json', '.sh', '.yml', '.yaml'}
    
    total_files = 0
    total_changes = 0
    files_changed = []
    
    print("🔍 Procurando arquivos...")
    print()
    
    for filepath in project_root.rglob('*'):
        if not filepath.is_file():
            continue
        
        if filepath.suffix not in extensions:
            continue
        
        if should_ignore_file(str(filepath)):
            continue
        
        total_files += 1
        changes_count, changes = replace_in_file(filepath)
        
        if changes_count > 0:
            total_changes += changes_count
            files_changed.append((filepath, changes))
            print(f"✅ {filepath.relative_to(project_root)}")
            for change in changes:
                print(change)
    
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📊 Resumo:")
    print(f"   Arquivos processados: {total_files}")
    print(f"   Arquivos modificados: {len(files_changed)}")
    print(f"   Total de substituições: {total_changes}")
    print()
    
    if files_changed:
        print("📝 Arquivos modificados:")
        for filepath, _ in files_changed:
            print(f"   - {filepath.relative_to(project_root)}")
    else:
        print("✅ Nenhuma referência encontrada!")

if __name__ == '__main__':
    main()
