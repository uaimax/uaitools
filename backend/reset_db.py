#!/usr/bin/env python
"""Script para resetar banco de dados completamente."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.db import connection

print("🔄 Resetando banco de dados...")
print("")

with connection.cursor() as cursor:
    # Dropar schema public completamente
    print("1. Dropar schema public...")
    cursor.execute("DROP SCHEMA IF EXISTS public CASCADE")
    cursor.execute("CREATE SCHEMA public")
    cursor.execute("GRANT ALL ON SCHEMA public TO postgres")
    cursor.execute("GRANT ALL ON SCHEMA public TO public")
    print("   ✅ Schema resetado")
    print("")

# Aplicar migrations
print("2. Aplicando migrations...")
os.system("python manage.py migrate --verbosity=1")

print("")
print("✅ Processo concluído!")
print("")
print("Verificando bau_mental:")
os.system("python manage.py showmigrations bau_mental | tail -5")
