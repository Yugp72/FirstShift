VENV ?= .venv
PY := $(VENV)/bin/python
PORT ?= 8000

.PHONY: setup seed dev api web build serve test demo-reset

setup:            ## install backend + frontend deps
	python3 -m venv $(VENV)
	$(PY) -m pip install -q -r backend/requirements.txt
	npm --prefix frontend install --no-audit --no-fund

seed:             ## rebuild the SQLite demo DB from backend/seed/*.json
	$(PY) -m backend.seed

dev:              ## API on :8000 + Vite on :5173 (open http://localhost:5173)
	@trap 'kill 0' INT TERM; \
	$(VENV)/bin/uvicorn backend.app:app --reload --reload-dir backend --port 8000 & \
	npm --prefix frontend run dev -- --host

api:
	$(VENV)/bin/uvicorn backend.app:app --reload --reload-dir backend --port 8000

web:
	npm --prefix frontend run dev -- --host

build:            ## production frontend build (served by FastAPI)
	npm --prefix frontend run build

serve: build      ## one process, one URL: FastAPI serves frontend/dist
	$(VENV)/bin/uvicorn backend.app:app --host 0.0.0.0 --port $(PORT)

test:
	$(PY) -m pytest -q backend/tests

demo-reset:       ## reseed before every demo take
	curl -s -X POST localhost:$(PORT)/api/demo/reset && echo
