"""
Data Ingestion Script
=====================
Loads the LBNL Queued Up Excel data into PostgreSQL database.

Usage:
    cd backend
    python scripts/ingest_data.py

Before running:
    1. Make sure .env file has your DATABASE_URL with correct password
    2. Install dependencies: pip install -r requirements.txt
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlmodel import Session, select
from dotenv import load_dotenv
from datetime import datetime

from app.database import engine, create_db_and_tables
from app.models.queue_project import QueueProject

# Load environment variables
load_dotenv()

# Path to Excel file (in project root)
EXCEL_PATH = Path(__file__).parent.parent.parent / "LBNL_Ix_Queue_Data_File_thru2024_v2 (1).xlsx"


def parse_date(value):
    """Safely parse date values from Excel"""
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return pd.to_datetime(value).date()
        except:
            return None
    return None


def parse_float(value):
    """Safely parse float values"""
    if pd.isna(value) or value is None:
        return None
    try:
        return float(value)
    except:
        return None


def parse_int(value):
    """Safely parse integer values"""
    if pd.isna(value) or value is None:
        return None
    try:
        return int(float(value))
    except:
        return None


def parse_string(value, max_length=None):
    """Safely parse string values"""
    if pd.isna(value) or value is None:
        return None
    s = str(value).strip()
    if max_length and len(s) > max_length:
        s = s[:max_length]
    return s if s else None


def load_excel_data():
    """Load data from Excel file"""
    print(f"Reading Excel file: {EXCEL_PATH}")

    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Excel file not found at: {EXCEL_PATH}")

    # Read the correct sheet with header in row 1 (0-indexed)
    # Sheet "03. Complete Queue Data" contains all 36,441 records
    df = pd.read_excel(
        EXCEL_PATH,
        sheet_name='03. Complete Queue Data',
        header=1  # Header is in row index 1 (second row)
    )

    print(f"Loaded {len(df)} rows")
    print(f"Columns: {list(df.columns)}")

    return df


def transform_row(row):
    """Transform a DataFrame row to QueueProject model"""
    return QueueProject(
        q_id=parse_string(row.get('q_id'), 100),
        q_status=parse_string(row.get('q_status'), 50),
        q_date=parse_date(row.get('q_date')),
        prop_date=parse_date(row.get('prop_date')),
        on_date=parse_date(row.get('on_date')),
        wd_date=parse_date(row.get('wd_date')),
        ia_date=parse_date(row.get('ia_date')),
        ia_status_raw=parse_string(row.get('IA_status_raw'), 255),
        ia_status_clean=parse_string(row.get('IA_status_clean'), 100),
        county=parse_string(row.get('county'), 100),
        state=parse_string(row.get('state'), 2),
        fips_code=parse_string(row.get('fips_codes'), 10),
        poi_name=parse_string(row.get('poi_name'), 255),
        region=parse_string(row.get('region'), 50),
        project_name=parse_string(row.get('project_name'), 255),
        utility=parse_string(row.get('utility'), 255),
        entity=parse_string(row.get('entity'), 100),
        developer=parse_string(row.get('developer'), 255),
        service_type=parse_string(row.get('service'), 50),
        project_type=parse_string(row.get('project_type'), 50),
        type1=parse_string(row.get('type1'), 100),
        type2=parse_string(row.get('type2'), 100),
        type3=parse_string(row.get('type3'), 100),
        mw1=parse_float(row.get('mw1')),
        mw2=parse_float(row.get('mw2')),
        mw3=parse_float(row.get('mw3')),
        type_clean=parse_string(row.get('type_clean'), 100),
        q_year=parse_int(row.get('q_year')),
        prop_year=parse_int(row.get('prop_year')),
    )


def ingest_data():
    """Main ingestion function"""
    print("=" * 60)
    print("Queue Insights - Data Ingestion")
    print("=" * 60)

    # Step 1: Create tables
    print("\n[1/4] Creating database tables...")
    create_db_and_tables()
    print("Tables created successfully!")

    # Step 2: Load Excel data
    print("\n[2/4] Loading Excel data...")
    df = load_excel_data()

    # Step 3: Check for existing data
    print("\n[3/4] Checking existing data...")
    with Session(engine) as session:
        existing_count = session.exec(select(QueueProject)).all()
        if len(existing_count) > 0:
            print(f"Found {len(existing_count)} existing records.")
            response = input("Do you want to delete existing data and reload? (yes/no): ")
            if response.lower() == 'yes':
                session.exec(QueueProject.__table__.delete())
                session.commit()
                print("Existing data deleted.")
            else:
                print("Keeping existing data. Skipping ingestion.")
                return

    # Step 4: Insert data in batches
    print("\n[4/4] Inserting data into database...")
    batch_size = 1000
    total_rows = len(df)
    inserted = 0
    errors = 0

    with Session(engine) as session:
        batch = []
        for idx, row in df.iterrows():
            try:
                project = transform_row(row)
                batch.append(project)

                if len(batch) >= batch_size:
                    session.add_all(batch)
                    session.commit()
                    inserted += len(batch)
                    print(f"Progress: {inserted}/{total_rows} ({100*inserted/total_rows:.1f}%)")
                    batch = []

            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"Error on row {idx}: {e}")

        # Insert remaining batch
        if batch:
            session.add_all(batch)
            session.commit()
            inserted += len(batch)

    print("\n" + "=" * 60)
    print("INGESTION COMPLETE!")
    print("=" * 60)
    print(f"Total rows processed: {total_rows}")
    print(f"Successfully inserted: {inserted}")
    print(f"Errors: {errors}")

    # Verify
    with Session(engine) as session:
        count = len(session.exec(select(QueueProject)).all())
        print(f"\nVerification: {count} records in database")


if __name__ == "__main__":
    ingest_data()
