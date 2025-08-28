FROM mysql:8.0.36-debian

RUN apt-get update && apt-get install -y locales
RUN sed -i 's/# ja_JP.UTF-8 UTF-8/ja_JP.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
ENV LANG ja_JP.UTF-8
ENV LC_ALL ja_JP.UTF-8
ENV TZ Asia/Tokyo

COPY ./my.cnf /etc/mysql/conf.d/my.cnf
