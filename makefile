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
	cp -r backend/dist docker/docker/app
	cp -r front/dist docker/docker/app/public
	cp -r extra/config.yml.gen docker/config/config.yml

clean:
	rm -rf backend/dist
	rm -rf front/dist
	rm -rf docker/docker/app

