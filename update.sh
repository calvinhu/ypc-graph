#!/bin/bash
curl http://127.0.0.1:5000/api/v0/toprushers/2016/100 > ~/Workspace/ypc-graph/static/data/2016/rushing.json
curl http://127.0.0.1:5000/api/v0/topreceivers/2016/100 > ~/Workspace/ypc-graph/static/data/2016/receiving.json
