# 官方 PocketBase 二进制，本地 HTTP 8090，无强制跳转 HTTPS
# 国内构建默认 DaoCloud 镜像（海外: --build-arg BASE_IMAGE=alpine:3.20）
ARG BASE_IMAGE=docker.m.daocloud.io/library/alpine:3.20
FROM ${BASE_IMAGE}

ARG PB_VERSION=0.38.2
ARG TARGETARCH=amd64
# 国内 GitHub 加速（海外可 --build-arg PB_DOWNLOAD_BASE=https://github.com）
ARG PB_DOWNLOAD_BASE=https://ghfast.top/https://github.com

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -q "${PB_DOWNLOAD_BASE}/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb \
  && rm /tmp/pb.zip

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/pb_public", "--hooksDir=/pb_hooks", "--origins=*"]
