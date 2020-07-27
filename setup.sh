#!/bin/bash
sed -i 's#raspbian.raspberrypi.org#mirrors.tuna.tsinghua.edu.cn/raspberry-pi-os#g' /etc/apt/sources.list
sed -i '1 i\deb-src http://mirrors.tuna.tsinghua.edu.cn/raspberry-pi-os/raspbian/ buster main non-free contrib rpi' /etc/apt/sources.list
sed -i 's#deb http://archive.raspberrypi.org/debian/ buster main#deb http://mirrors.tuna.tsinghua.edu.cn/raspberrypi/ buster main ui#g' /etc/apt/sources.list.d/raspi.list
apt-get update
apt-get install git librtlsdr-dev libusb-1.0-0-dev
git clone git://github.com/davy12315/adsb.git
cd adsb
mv get_message dump1090 *.* /root -f
cd /root/dump1090
make
cd /root
bash setup.sh
