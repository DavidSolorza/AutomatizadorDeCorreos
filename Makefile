.PHONY: start

start:
	@echo "Starting backend..."
	cd backend && python run.py &
	@echo "Starting frontend..."
	cd frontend && pnpm dev
