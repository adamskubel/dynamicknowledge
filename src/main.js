define(function (require, exports, module)
{
	var Engine = require("famous/core/Engine");
	var Surface = require("famous/core/Surface");
	var Transform = require("famous/core/Transform");
	var Modifier = require("famous/core/Modifier");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var RenderController = require("famous/views/RenderController");
    var MouseSync = require('famous/inputs/MouseSync');
	var LineCanvas = require('./LineCanvas');

    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
    var PositionableView = require('./PositioningLayouts/PositionableView');
    var DynamicDetailView = require('./DynamicDetailView');
    var DynamicContainer = require('./PositioningLayouts/DynamicContainer');
    var BoxView = require('./PositioningLayouts/BoxView');
    var MainView = require('MainView');

    var MemorySpace = require('./MemObjects/MemorySpace');
    var PageLookupTable = require('./MemObjects/PageLookupTable');
	var Timer = require('famous/utilities/Timer');
    var Utils = require('./Utils');
    var Vector = require('./ProperVector');

    var Label = require('Model/Label');
    var ModelLoader = require('ModelLoader');
    var GAPIAuthenticator = require('GAPIAuthenticator');

    var AnnotationContainer = require('Model/AnnotationContainer');
    var DynamicObject = require('Model/DynamicObject');
    var DynamicObjectController = require('Controllers/DynamicObjectController');

	function init()
    {
		this.context = Engine.createContext(null);

        var mainView = new MainView(this.context);
        mainView.setCameraMode("2D");
        this.context.add(mainView);


        var objectRegistry = {};
        this.objectRegistry = objectRegistry;

        populateObjects(objectRegistry);

        this.annotationEditors = [];
        this.mainView = mainView;

        this.gapiAuthenticator = new GAPIAuthenticator();
        this.fileId = '0B6eNzoTXZGgISVA1amJmaEZUZmM';

        gapi.load('auth:client,drive-realtime,drive-share', function()
        {
            _initUI.call(this,mainView);
            this.gapiAuthenticator.connect(_authComplete.bind(this));

        }.bind(this));
    }

    var annoColor = 6000;
    var editColor = 12000;



    function _initUI(mainView)
    {
        var rootNode = mainView.rootNode;

        var authButton = new BoxView({text: "Auth", size:[100,80], position:[100,0,0], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        authButton.on('click',function(){
            this.gapiAuthenticator.call(this,_authComplete.bind(this));
        }.bind(this));

        var editButton = new BoxView({text: "Edit", size:[100,80], clickable:false, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        editButton.on('click',function(){
            _setEditMode.call(this,!this._editMode);
        }.bind(this));

        var cameraButton = new BoxView({text: "Camera [2D]", size:[100,80], position:[100,0,0], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        cameraButton.on('click',function(){
            if (mainView.cameraMode == "2D")
            {
                mainView.setCameraMode("3D");
                cameraButton.setText("Camera [3D]");
            }
            else if (mainView.cameraMode == "3D")
            {
                mainView.setCameraMode("Free");
                cameraButton.setText("Camera [Free]");
            }
            else if (mainView.cameraMode == "Free")
            {
                mainView.setCameraMode("2D");
                cameraButton.setText("Camera [2D]");
            }

        }.bind(this));

        var undoButton =  new BoxView({text: "Undo", size:[100,80], position:[300,0,0], clickable:false, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        var redoButton =  new BoxView({text: "Redo", size:[100,80], position:[400,0,0], clickable:false, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});

        undoButton.on('click',function(){
            this.gapiModel.undo();
        }.bind(this));

        redoButton.on('click',function(){
            this.gapiModel.redo();
        }.bind(this));


        rootNode.add(authButton.getModifier()).add(authButton.getRenderController());
        rootNode.add(cameraButton.getModifier()).add(cameraButton);
        rootNode.add(editButton.getModifier()).add(editButton);
        rootNode.add(undoButton.getModifier()).add(undoButton);
        rootNode.add(redoButton.getModifier()).add(redoButton);

        this.editButton = editButton;
        this.undoButton = undoButton;
        this.redoButton = redoButton;
        this.authButton = authButton;
    }


    function _onFileLoaded(document){
        console.log("Document '"+document+"' loaded, model = " + document.getModel().toString());
        this.gapiModel = document.getModel();

        this.modelLoader = new ModelLoader(document.getModel(),this.objectRegistry);
        this.modelLoader.loadModel(this.mainView);

        //this.modelLoader.getObject("PageTableObject");



        jQuery.get('./text.txt', function(data)
        {
            var blocks = parseText.call(this,data);
            for (var i=0;i<blocks.length;i++)
            {
                var block = blocks[i];
                this.mainView.addText(block.text,block.name);
            }

        }.bind(this));
    }

    function _initializeModel(model){
        console.log ("intialized model: " + model);

        var objects = model.createMap();
        model.getRoot().set('objects',objects);

        model.getRoot().set("lastId",100);

        var topObject = DynamicObject.create(model,'top','top');
        var baseState = topObject.createState('base');

        baseState.properties.set("FocusObject","MemorySystemController");
        model.getRoot().set('top',topObject);


        var pageTable = DynamicObject.create(model,'PageTableObject','predef');
        pageTable.createState('base');
        pageTable.properties.set("predefinedName","PageTable");

        var annotationRelationship = AnnotationContainer.create(model,'ac1');
        annotationRelationship.createState('base').children.push("L1");
        pageTable.relationships.push(annotationRelationship);

        var label1 = Label.create(model,"L1");
        label1.text = "HI AM LABELS";
        label1.createState('base').position = [10,10,0];

        var memControllerDef = DynamicObject.create(model,'MemorySystemController','predef');
        memControllerDef.createState('base');
        memControllerDef.properties.set('predefinedName',"MemorySystemView");

        var memControllerChildren = model.createList();

        memControllerDef.relationships.push(memControllerChildren);

        memControllerChildren.push("PageTableObject");

        objects.set(label1.id,label1);
        objects.set(pageTable.id,pageTable);
        objects.set(memControllerDef.id,memControllerDef);
    }

    function _handleErrors(err){
        console.error(err);
    }

    function _authComplete(){

        ModelLoader.registerModels();

        var callback = function(file){

            console.log('Loading file with id ' + file.id);
            gapi.drive.realtime.load(file.id, _onFileLoaded.bind(this), _initializeModel.bind(this), _handleErrors.bind(this));
        }

        if (this.fileId)
        {
            gapi.drive.realtime.load(this.fileId, _onFileLoaded.bind(this), _initializeModel.bind(this), _handleErrors.bind(this));
        }
        else
        {
            gapi.client.load('drive', 'v2', function ()
            {
                gapi.client.drive.files.insert({
                    'resource': {
                        mimeType: '',
                        title: "Meow"
                    }
                }).execute(callback.bind(this));
            });
        }


        this.authButton.hide();

        this.editButton.setClickable(true);
        this.redoButton.setClickable(true);
        this.undoButton.setClickable(true);
    }

    function _setEditMode(editMode)
    {
        this._editMode = editMode;
        this.editButton.setHighlighted(editMode);

        if (editMode)
            this.mainView.setEditMode("IsEditing");
        else
            this.mainView.setEditMode("ReadOnly");
    }


	function populateObjects(objectRegistry)
    {
        var memorySystemView = new StretchyLayout({
            direction:0,
            viewSpacing:[40,0],
            viewOrigin:[0.5,0.5],
            viewAlign:[0.3,0.5],
            isAnimated:false
        });


        var virtualMemorySpace = new MemorySpace({
            size:[100,700]
        });

        objectRegistry["VirtualSpace"] = virtualMemorySpace;
        virtualMemorySpace.gapiName = "VirtualSpace";

        memorySystemView.addChild(virtualMemorySpace,{weight:1, index:0});

        var pv1 = new BoxView({
            text:'Reserved by kernel',
            size:[100,100],
            position:[0,30,0],
            textAlign:[0,0]
        });
        virtualMemorySpace.addChild(pv1);

        var virtualBlock = new BoxView({
            text:"0xA0000000",
            size:[undefined,true],
            clickable:true,
            position: [0,220,5],
            textAlign: [0,0.5]
        });
        virtualBlock._memAddress = 0xA0000000;
        virtualMemorySpace.addChild(virtualBlock);

        var mappingBox = new DynamicDetailView({
            boxLabel:"Memory mapping subsystem",
            boxSize: [120,120],
            maxDetail: 1,
            position: [0,0,0]
        });
        mappingBox.setOrigin([0,0.5]);
        memorySystemView.addChild(mappingBox,{align: 'center',index:1});

        var pageTable = new PageLookupTable({
            startPage: 0xA0000,
            pageMappings: [
                0x10520,
                0x21234,
                0x0F2D4
            ]
        });

        objectRegistry["PageTable"] = mappingBox;

        mappingBox.makeComplexView = function(detail){
            if (detail == 1)
                return pageTable;
            else if (detail == 2)
            {
                var dc = new DynamicContainer({
                    edgePadding:[10,10]
                });

                var containerBackground = new BoxView({
                    color:annoColor,
                    style: 'borderOnly'
                });

                dc.add(containerBackground.getModifier()).add(containerBackground);

                var pageTable2 = new PageLookupTable({
                    startPage: 0xA0000,
                    pageMappings: [
                        0x10520,
                        0x21234,
                        0x0F2D4
                    ]
                });

                var label1 = new BoxView({
                    text: "Label #1!",
                    position: [-110,-10,0],
                    viewOrigin: [0,0],
                    size: [100,30]
                });

                var label2 = new BoxView({
                    text: "Hi am label 2",
                    position: [140,50,0],
                    size: [100,40]
                });

                dc.addChild(pageTable2);
                dc.addChild(label1);
                dc.addChild(label2);

                return dc;
            }
        };

        var physicalMemorySpace = new MemorySpace({
            memConfig:{
                startAddress:0,
                addressWidth:8,
                memSize:0x40000000
            },
            size:[100,500]
        });

        objectRegistry["PhysicalMemory"] = physicalMemorySpace;
        physicalMemorySpace.gapiName = "PhysicalMemory";

        memorySystemView.addChild(physicalMemorySpace,{align:'center',index:2});

        var physicalBlock = new BoxView({
            text:"0x10520000",
            size:[undefined,true],
            textAlign: [0,0.5]
        });

        physicalMemorySpace.addChild(physicalBlock);

        var dragController = new MouseSync();
        dragController.on('update',function(data){
            var ypos = virtualBlock.position[1] + data.delta[1];
            ypos = Math.max(220,ypos);
            ypos = Math.min(420,ypos);

            virtualBlock.setAnimated(false);
            virtualBlock.setPosition([virtualBlock.position[0],ypos,virtualBlock.position[2]]);

            var newAddr = Math.round(0xA0000000+(0x2FFF*((ypos-220)/200)));
            virtualBlock._memAddress = newAddr;
            virtualBlock.setText(Utils.hexString(newAddr,8));
            var pageNum = pageTable.access(virtualBlock._memAddress >>> 12);

            var address = (pageNum << 12) + (virtualBlock._memAddress & 0xFFF);

            ypos = (address/physicalMemorySpace.memConfig.memSize)*physicalMemorySpace._size[1];

            physicalBlock.setPosition([0,ypos,0]);
            physicalBlock.pulse(50,500);
            physicalBlock.setText(Utils.hexString(address,8));
        });

        virtualBlock.backSurface.pipe(dragController);

        memorySystemView.setEditMode = function(editMode){

            for (var i=0;i<this.children.length;i++)
            {
                if (this.children[i].setEditMode)
                {
                    this.children[i].setEditMode(editMode);
                }
            }
        };

        //var memController = new DynamicObjectController(null,memorySystemView);


        //objectRegistry["MemorySystemController"] = memController;


        objectRegistry["MemorySystemView"] = memorySystemView;
    }


    function parseText(text)
    {

        var textBlocks = [];

        var openTag = "{LINK=";
        var closeTag = "{/LINK}";

        var i =0;
        while (i < text.length)
        {
            var index = text.indexOf(openTag, i);

            if (index != i)
            {
                var end = index;
                if (index < 0)
                    end = text.length;
                textBlocks.push({
                    name:"",
                    text:text.slice(i,end)
                });
            }

            if (index < 0)
                break;

            var nameEndIndex = text.indexOf("}",index);
            var closingIndex = text.indexOf(closeTag,index);

            textBlocks.push({
                name:text.slice(index + openTag.length, nameEndIndex),
                text:text.slice(nameEndIndex+1, closingIndex)
            });

            i = closingIndex+closeTag.length;
            if (i < 0)
                break;
        }

        return textBlocks;
    }

	init();
});
























