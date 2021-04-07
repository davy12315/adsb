import socket
import urllib2
import urllib
import sys
import ConfigParser
import zlib
import base64
import os,uuid
import time

serverHost = '127.0.0.1'
serverPort = 30003

config = ConfigParser.ConfigParser()
config.readfp(open(sys.path[0]+'/config.ini',"rb"))

uuid_file=sys.path[0]+'/UUID'

if os.path.exists(uuid_file) :
        file_object = open(uuid_file)
        mid = file_object.read()
        file_object.close()
else :
        mid = uuid.uuid1().get_hex()[16:]
        file_object = open(uuid_file , 'w')
        file_object.write( mid )
        file_object.close()

def insert_mid(file_path='', mid=''):
    lines = []
    try:
        with open(file_path, 'r') as f:
            for line in f:
                lines.append(line)
    except IOError:
        pass

    if len(lines) >= 26:
        if lines[26].find('<h5>') < 0:
            lines.insert(26, '<h5>UUID: %s</h5>\n' %mid)
            with open(file_path, 'w+') as f:
                for line in lines:
                    f.write(line)

insert_mid(file_path=r'/root/dump1090/public_html/gmap.html', mid=mid)

sockobj = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
sockobj.connect((serverHost,serverPort))

def send_message(source_data):
	try:
		source_data=base64.b64encode(zlib.compress(source_data))
		f=urllib2.urlopen(url = config.get("global","sendurl"),data =  urllib.urlencode({'from':mid,'code':source_data}),timeout = 2)
		return True
	except Exception,e:
		print str(e)
		return True

tmp_buf=''

while 1:
	buf = sockobj.recv(8192)
	if not buf: break
	if len(buf) != 0:
		tmp_buf=tmp_buf+buf
		if buf[len(buf)-1] == '\n':
			if send_message(tmp_buf) :
				tmp_buf=''
time.sleep(0)
