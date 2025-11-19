import os
import logging
from databricks import sql
from databricks.sdk.core import Config
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
from databricks.sdk.core import Config, oauth_service_principal
from databricks import sql
import os

# Ensure environment variable is set correctly
assert os.getenv('DATABRICKS_WAREHOUSE_ID'), "DATABRICKS_WAREHOUSE_ID must be set in app.yaml."

def sqlQuery(query: str) -> pd.DataFrame:
    cfg = Config() # Pull environment variables for auth
    with sql.connect(
        server_hostname=cfg.host,
        http_path=f"/sql/1.0/warehouses/{os.getenv('DATABRICKS_WAREHOUSE_ID')}",
        credentials_provider=lambda: cfg.authenticate
    ) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall_arrow().to_pandas()


# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simple FastAPI + React App")

# --- API Routes ---
@app.get("/api/hello")
async def hello():
    logger.info("Accessed /api/hello")
    return {"message": "Hello World from FastAPI!"}

@app.get("/api/health")
async def health_check():
    logger.info("Health check at /api/health")
    return {"status": "healthy"}

@app.get("/api/data/")
async def get_data(race_id: int):
    logger.info("Data requested at /api/data")
    df = sqlQuery(f"SELECT * FROM f1.silver.lap_times WHERE raceId = {race_id}")
    logger.info(f"{df}")
    data = [[row.lap,row.position,row.driverId] for _, row in df.iterrows()]
    data_map = {}
    for lap, position, driverId in data:
        data_map.setdefault(driverId, []).append({"x":lap,"y": position})
    logger.info(f"{data_map}")
    # data = [{"x": x, "y": 2 ** x} for x in range(30)]
    return {
        "data": data_map,
        "title": "Hello world!",
        "x_title": "x",
        "y_title": "y"
    }

@app.get("/api/years")
async def get_years():
    logger.info("Years requested at /api/years")
    df = sqlQuery("select distinct year(date) as year from f1.silver.dim_races")
    data = [int(row.year) for _, row in df.iterrows()]
    logger.info(f"years:{data}")
    data.sort(reverse=True)
    return {
        "years":data
    }

@app.get("/api/races/")
async def get_races(year: int):
    logger.info(f"Races requested at /api/races/{year}")
    df = sqlQuery(f"select * from f1.silver.dim_races where year(date) = {year}")
    data = [{"name":row['name'],"id":row['raceId']} for _, row in df.iterrows()]
    logger.info(f"races:{data}")
    data.sort(reverse=True)
    return {
        "races":data
    }

# --- Static Files Setup ---
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

# --- Catch-all for React Routes ---
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_html = os.path.join(static_dir, "index.html")
    if os.path.exists(index_html):
        logger.info(f"Serving React frontend for path: /{full_path}")
        return FileResponse(index_html)
    logger.error("Frontend not built. index.html missing.")
    raise HTTPException(
        status_code=404,
        detail="Frontend not built. Please run 'npm run build' first."
    )