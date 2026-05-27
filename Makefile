.PHONY: start stop restart logs clean ps build shell-backend shell-frontend

start:
	@echo "[vedaai] Stopping host processes on ports 3000, 5000..."
	-npx --yes kill-port 3000 5000 2>nul || true
	@echo "[vedaai] Tearing down existing containers and volumes..."
	docker compose down --remove-orphans --volumes
	@echo "[vedaai] Building and starting fresh..."
	docker compose up --build --force-recreate --detach
	@echo ""
	@echo "  Frontend URL -> http://localhost:3000"
	@echo "  Backend URL  -> http://localhost:5000"
	@echo "  Health Check -> http://localhost:5000/health"
	@echo ""
	@echo "Run 'make logs' to follow all service output."
	@echo "Run 'make ps'   to check container status."

stop:
	docker compose down --remove-orphans

restart:
	docker compose restart

logs:
	docker compose logs --follow --tail=100

logs-backend:
	docker compose logs --follow --tail=100 backend

logs-frontend:
	docker compose logs --follow --tail=100 frontend

ps:
	docker compose ps

build:
	docker compose build --no-cache

shell-backend:
	docker compose exec backend sh

clean:
	docker compose down --remove-orphans --volumes --rmi all
	docker system prune -f
