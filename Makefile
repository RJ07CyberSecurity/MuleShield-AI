# MuleShield AI Monorepo Makefile

.PHONY: help install build up down test lint clean

help:
	@echo "MuleShield AI Monorepo CLI"
	@echo "Available commands:"
	@echo "  install   - Install dependencies for web and backend services"
	@echo "  build     - Build docker images for all services"
	@echo "  up        - Start all services with docker-compose"
	@echo "  down      - Stop all services"
	@echo "  test      - Run tests across all components"
	@echo "  lint      - Lint the codebase"
	@echo "  clean     - Clean up build files, cache, and docker volumes"

install:
	cd apps/web && npm install

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

test:
	cd apps/web && npm test

lint:
	cd apps/web && npm run lint

clean:
	docker-compose down -v
