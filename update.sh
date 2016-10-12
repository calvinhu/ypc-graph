#!/bin/bash
RUSHING=$(curl http://www.ypcgraph.com/api/v0/toprushers/2016/100)
RECEIVING=$(curl http://www.ypcgraph.com/api/v0/topreceivers/2016/100)

# echo $RUSHING
# echo $RECEIVING

# perl -pi -e 's/"result"/"rushing"/g' static/data/2016/rushing.json 
# perl -pi -e 's/"result"/"receiving"/g' static/data/2016/receiving.json 

curl -i \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X PUT --data "$RUSHING" "https://ypcgraph-7be8c.firebaseio.com/rushing.json"

curl -i \
-H "Accept: application/json" \
-H "Content-Type:application/json" \
-X PUT --data "$RECEIVING" "https://ypcgraph-7be8c.firebaseio.com/receiving.json"
# curl -H "Content-Type: application/json" -X PUT -d $RECEIVING https://ypcgraph-7be8c.firebaseio.com/receiving.json
