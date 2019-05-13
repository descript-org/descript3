#!/bin/sh

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/C=RU/ST=Moscow/L=Moscow/O=Descript Inc./CN=nik.pasaran@gmail.com"

