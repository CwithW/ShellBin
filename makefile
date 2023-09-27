.PHONY: backend front docker

backend-environment:
	cd backend && npm install

backend:
	cd backend && npm run build && cp package.json dist/package.json

backend-dev:
	cd backend && npm run dev

front-environment:
	cd front && npm install

front-dev:
	cd front && npm run dev

front:
	cd front && npm run build

docker: clean backend front
	cp -r backend/dist docker/app
	cp -r front/dist docker/app/public
	cp extra/config.yml.gen docker/app/config.yml.gen
	cp extra/docker_entrypoint.sh docker/app/docker_entrypoint.sh
	cp version docker/app/version

VERSION:=$(shell cat version)
build-docker-image: docker
	docker build -t "cwithw/shellbin:$(VERSION)" docker
	docker tag "cwithw/shellbin:$(VERSION)" "cwithw/shellbin:latest"

push-docker: build-docker-image
	docker push "cwithw/shellbin:$(VERSION)"
	docker push "cwithw/shellbin:latest"


clean:
	rm -rf backend/dist
	rm -rf front/dist
	rm -rf docker/app

