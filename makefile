.PHONY: backend front docker

backend-environment:
	cd backend && npm install

backend:
	cd backend && npm run build && cp package.json dist/package.json

backend-dev: backend
	mkdir -p backend/config
	echo IyB0aGUgc2VjcmV0IHRvIGtlZXAgeW91ciBzZXJ2aWNlIHByaXZhdGUNCnVzZXJuYW1lOiBhZG1pbg0KcGFzc3dvcmQ6IGFkbWluDQojIHRoZSBwb3J0IHlvdSBhY2Nlc3MgdGhlIHNlcnZpY2Ugd2l0aCBIVFRQDQptYW5hZ2VQb3J0OiAzMDAwDQojIHRoZSBwb3J0IHZpY3RpbXMgY29ubmVjdCB0bw0Kc2hlbGxQb3J0OiAzMDAxDQojIGF1dG9tYXRpY2FsbHkgcmVtb3ZlIGNvbm5lY3Rpb25zIHRoYXQgYXJlIGRlYWQgWCBzZWNvbmRzIGFnby4gc2V0IHRvIDAgdG8gZGlzYWJsZQ0KIyBkZWZhdWx0IGlzIDM2MDAgc2Vjb25kcyAoMSBob3VyKQ0KcmVtb3ZlRGVhZEFmdGVyOiAzNjAw | base64 -d > backend/config/config.yml
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
	docker build -t "cwithw/shellbin:demosite" docker

push-docker: build-docker-image
	docker push "cwithw/shellbin:demosite"


clean:
	rm -rf backend/dist
	rm -rf front/dist
	rm -rf docker/app

