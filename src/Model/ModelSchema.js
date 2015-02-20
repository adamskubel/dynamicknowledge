
var data = {
    "top":
    {
        stateMap: {
            "base" : {
                focus:"memorySystem",
                text: "memorySystemText"
            }
        }
    },
    "objects":
    {
        "memorySystem":
        {
            type: "stretchy",
            stateMap: {
                "base" : {
                    children:[
                        "virtualspace",
                        "pagetable",
                        "physicalspace"
                    ]
                }
            }
        },
        "pageTable" : {
            type : "predef",
            relationships: [
                {
                    type: "annotation-container",
                    stateMap:
                    {
                        "base":
                        {
                            children: ["L1", "L2"]
                        },
                        "state1":
                        {
                            children: ["LabelScroller"]
                        }
                    }
                }
            ],
            "properties" : {
                "predefObjectKey":"PageTable"
            }
        },
        "LabelScroller" :
        {
            type : "scroller",
            stateMap:
            {
                "state1":
                {
                    children:["L1","L2"]
                }
            }
        },
        "L1" : {
            type:"label",
            id:"L1",
            text:"Hello",
            size:[100,100],
            stateMap:{
                "base" : {
                    position:[0,0,0]
                }
            }
        },
        "L2" : {
            type:"label",
            id:"L2",
            text:"HelloAgain",
            size:[100,100],
            stateMap:{
                "somestate" : {
                    position:[0,0,0]
                }
            }
        }
    }
};

