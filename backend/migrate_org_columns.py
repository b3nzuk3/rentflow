"""Add missing org profile columns to existing SQLite database."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "rentflow.db")

COLUMNS = [
    ("phone", "TEXT"),
    ("email", "TEXT"),
    ("address", "TEXT"),
    ("website", "TEXT"),
    ("tax_pin", "TEXT"),
    ("reg_number", "TEXT"),
    ("business_type", "TEXT"),
    ("logo_url", "TEXT"),
]

def migrate():
    if not os.path.exists(DB_PATH):
        print("No database found. Run seed.py first.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(organizations)")
    existing = {row[1] for row in cursor.fetchall()}

    added = 0
    for col_name, col_type in COLUMNS:
        if col_name not in existing:
            cursor.execute(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_type}")
            added += 1
            print(f"  Added column: {col_name}")
        else:
            print(f"  Already exists: {col_name}")

    conn.commit()
    conn.close()
    print(f"\nMigration complete. {added} column(s) added.")


if __name__ == "__main__":
    migrate()
