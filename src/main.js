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
    var PScrollView = require('./PositioningLayouts/PositioningScrollView');

    var MemorySpace = require('./MemObjects/MemorySpace');
    var PageLookupTable = require('./MemObjects/PageLookupTable');
	var Timer = require('famous/utilities/Timer');
    var Utils = require('./Utils');
    var Vector = require('./ProperVector');

    var Label = require('Model/Label');

    var AnnotationController = require('./AnnotationController');

    //Globals
	var currentScene = 0;
    var rootNode;
	var dynamicNodes;
	var mainLayout;
    var cameraAngles = [0,0];
    var objectRegistry = {};

	function init()
    {
		this.context = Engine.createContext(null);

        this.annotationButtons = [];
		this.lines = [];
		this.lineIndex = 0;
		this.dynamicNodes = [];
		dynamicNodes = this.dynamicNodes;


		this.cameraModifier = new Modifier({
				//transform: function () {return Transform.rotate(Math.PI * (-1 / 6) * this.state.get(), Math.PI * (1 / 4) * this.state.get(), 0);}
                transform: function () {return Transform.rotate(cameraAngles[0]*(Math.PI/180),cameraAngles[1]*(Math.PI/180), 0);}
        });
		this.cameraModifier.state = new Transitionable(0);


        var mainView = new View();
        rootNode = mainView.add(new Modifier({
            align: [0.5,0.5]
        })).add(this.cameraModifier);

        this.context.add(mainView);

		mainLayout = new StretchyLayout({
			direction:0,
			viewSpacing:[40,0],
            viewOrigin:[0.5,0.5],
            viewAlign:[0.3,0.5],
            isAnimated:false
		});

        mainLayout.calculatePosition = function(){
            var p = Vector.fromArray(mainLayout.position);
            var s = this.context.getSize();
            if (s)
            {
                p = p.sub(Vector.fromArray(s).multiply(new Vector(0.2, 0, 0)));
            }
            return p.toArray();
        }.bind(this);

        var textWidth = this.context.getSize()[0]*0.4;
        textLayout = new PScrollView({
            direction: 1,
            viewOrigin: [0,0.5],
            viewAlign: [0.6,0.5],
            size:[textWidth,undefined]
        });
        textLayout.textWidth= textWidth;

        textLayout.setPosition([0,0,0]);

        textLayout.calculatePosition = function(){
            var p = Vector.fromArray(textLayout.position);
            var s = this.context.getSize();
            if (s)
            {
                p = p.sub(Vector.fromArray(s).multiply(new Vector(-0.1, 0.5, 0)));
            }
            return p.toArray();
        }.bind(this);

        var mouseCaptureSurface = new Surface();
        this.context.add(new Modifier({transform:Transform.translate(0,0,-100)})).add(mouseCaptureSurface);

		rootNode.add(mainLayout.getModifier()).add(mainLayout);
        rootNode.add(textLayout.getModifier()).add(textLayout);
        //mainLayout.addChild(textLayout,{weight:2});
		dynamicNodes.push(mainLayout);
        dynamicNodes.push(textLayout);

		setCameraState("2D");

		Engine.on('prerender',function(){
        //Timer.setInterval(function(){
			for (var i=0;i<dynamicNodes.length;i++)
			{
				var dn = dynamicNodes[i];
				if (dn.needsLayout())
				{
					var sizes = dn.measure();
					dn.layout(sizes.minimumSize);
				}
			}
		});

        //var cameraSync = new MouseSync();
        //
        //mouseCaptureSurface.pipe(cameraSync);
        //cameraSync.on('update',function(data){
        //    cameraAngles[0] += data.delta[1]*-0.2;
        //    cameraAngles[1] += data.delta[0]*0.2;
        //});

        jQuery.get('./text.txt', function(data)
        {
            var blocks = parseText.call(this,data);

            nextScene.call(this);

            for (var i=0;i<blocks.length;i++)
            {
                var block = blocks[i];
                var pointAt = objectRegistry[block.name];
                addText.call(this,block.text,pointAt);
            }

        }.bind(this));

        gapi.load('auth:client,drive-realtime,drive-share', function() {
            _initUI.call(this);
        }.bind(this));
	}

    var textLayout;
    var virtualMemorySpace;
    var virtualBlock;
    var mappingBox;
    var annoColor = 6000;
    var editColor = 12000;
    var pageTable;
    var physicalMemorySpace;

    function addText(string, pointAt){

        var textView = new BoxView({
            size:[textLayout.textWidth,true],
            color:annoColor,
            text:string,
            textAlign:[0,0],
            style:(pointAt) ? 'noBorder' : 'noBorder',
            fontSize:'normal',
            scrollviewSizeHack: true
        });

        if (pointAt)
        {
            var pointLine = new LineCanvas();
            pointLine.setLineObjects(textView, pointAt);
            rootNode.add(pointLine.getModifier()).add(pointLine);
            textLayout.on('positionUpdate',function(){
                pointLine.update();
            });

            if (pointAt.annoClick)
            {
                textView.setClickable(true);
                textView.on('click', function ()
                {
                    pointAt.annoClick();
                });
            }
        }

        textLayout.addChild(textView);
        return textView;
    }

    function _fetchUserId(callback)
    {
        var _this = this;
        gapi.client.load('oauth2', 'v2', function()
        {
            gapi.client.oauth2.userinfo.get().execute(function(resp)
            {
                if (resp.id) {
                    _this.userId = resp.id;
                }

                if (callback) {
                    callback();
                }
            });
        });
    }


    function _auth(onAuthComplete) {

        var rtclient = rtclient || {};

        rtclient.INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install';
        rtclient.FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
        rtclient.OPENID_SCOPE = 'openid';
        rtclient.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';


        this.fileId = '0B6eNzoTXZGgIWG5HbXo4RXFlN1k';
        var clientId = '645480454740-n8ui9o5v4tieo3s0utqvhta6k8gakcrt.apps.googleusercontent.com';

        var userId = null;
        var _this = this;

        var handleAuthResult = function(authResult) {
            if (authResult && !authResult.error) {

                _this.authButton.setClickable(false);

                _fetchUserId(onAuthComplete);
                console.log('yay!');
            } else {
                authorizeWithPopup();
            }
        };

        var authorizeWithPopup = function() {
            gapi.auth.authorize({
                client_id: clientId,
                scope: [
                    rtclient.INSTALL_SCOPE,
                    rtclient.FILE_SCOPE,
                    rtclient.OPENID_SCOPE
                ],
                user_id: userId,
                immediate: false
            }, handleAuthResult);
            console.log(clientId);
        };

        // Try with no popups first.
        gapi.auth.authorize({
            client_id: clientId,
            scope: [
                rtclient.INSTALL_SCOPE,
                rtclient.FILE_SCOPE,
                rtclient.OPENID_SCOPE
            ],
            user_id: userId,
            immediate: true
        }, handleAuthResult);
    }

    function _initUI()
    {
        var nextButton = new BoxView({text: "Next", size:[200,80], clickable:true, color:6000,viewAlign:[1,1],viewOrigin:[1,1],fontSize:'large'});
        textLayout.add(nextButton.getModifier()).add(nextButton);

        nextButton.on('click', function (){
            nextScene.call(this);
        }.bind(this));

        this.editButton = new BoxView({text: "Edit", size:[100,80], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        rootNode.add(this.editButton.getModifier()).add(this.editButton);

        this.editButton.on('click',function(){
            _setEditMode.call(this,true);
        }.bind(this));

        this.authButton = new BoxView({text: "Auth", size:[100,80], position:[100,0,0], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        rootNode.add(this.authButton.getModifier()).add(this.authButton);
        this.authButton.on('click',function(){
            _auth.call(this,_authComplete.bind(this));
        }.bind(this));

        var undoButton =  new BoxView({text: "Undo", size:[100,80], position:[300,0,0], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});
        var redoButton =  new BoxView({text: "Redo", size:[100,80], position:[400,0,0], clickable:true, color:editColor,viewAlign:[0,1],viewOrigin:[0,1],fontSize:'large'});

        undoButton.on('click',function(){
            this.gapiModel.undo();
        }.bind(this));

        redoButton.on('click',function(){
            this.gapiModel.redo();
        }.bind(this));

        rootNode.add(undoButton.getModifier()).add(undoButton);
        rootNode.add(redoButton.getModifier()).add(redoButton);
    }


    function _onFileLoaded(document){
        console.log("Document '"+document+"' loaded, model = " + document.getModel().toString());
        this.gapiModel = document.getModel();
    }

    function _initializeModel(model){
        console.log ("intialized model: " + model);
        model.getRoot().set('annotationMap',model.createMap());
    }

    function _handleErrors(err){
        console.error(err);
    }

    function _authComplete(){

        Label.registerGAPIModel();

        function callback(file){

            console.log('Loading file with id ' + file.id);
            gapi.drive.realtime.load(file.id, _onFileLoaded.bind(this), _initializeModel.bind(this), _handleErrors.bind(this));
        };

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
                }).execute(callback);
            });
        }

        //gapi.drive.realtime.load('cat_file', _onFileLoaded.bind(this), _initializeModel.bind(this), _handleErrors.bind(this));
    }



    function _addAnnotationButton(object)
    {
        var annotateObjectButton = new BoxView({
            text: "An",
            size: [50, 50],
            clickable: true,
            color: annoColor,
            position: [0, 0, 5]
        });


        Utils.attachRenderController(annotateObjectButton);
        annotateObjectButton.show();
        object.add(annotateObjectButton.getModifier()).add(annotateObjectButton.renderController);

        object._annotateObjectButton = annotateObjectButton;

        annotateObjectButton.on('click', function ()
        {
            this.activeController = new AnnotationController(object,mainLayout,this.gapiModel);
            this.activeController.annotationButton = annotateObjectButton;
            annotateObjectButton.hide();
        }.bind(this));

        this.annotationButtons.push(annotateObjectButton);
    }

    function _setEditMode(editMode)
    {
        this.editButton.setHighlighted(editMode);
        if (editMode)
        {
            for (var key in objectRegistry)
            {
                var object = objectRegistry[key];
                _addAnnotationButton(object);
            }
        }
        else
        {
            if (this.activeController)
                this.activeController.close();

            for (var i=0;i<this.annotationButtons.length;i++)
            {
                this.annotationButtons[i].hide();
            }
            this.annotationButtons.clear();
        }
    }

    var scenes = [
		function ()
		{
            setCameraState("2D");

			mainLayout.requestLayout();

            virtualMemorySpace = new MemorySpace({
                size:[100,700]
            });

            objectRegistry["VirtualSpace"] = virtualMemorySpace;

            mainLayout.addChild(virtualMemorySpace,{weight:1, index:0});

            var pv1 = new BoxView({
                text:'Reserved by kernel',
                size:[100,100],
                position:[0,30,0],
                textAlign:[0,0]
            });
            virtualMemorySpace.addChild(pv1);

            virtualBlock = new BoxView({
                text:"0xA0000000",
                size:[undefined,true],
                clickable:true,
                position: [0,220,0],
                textAlign: [0,0.5]
            });
            virtualBlock._memAddress = 0xA0000000;
            virtualMemorySpace.addChild(virtualBlock);

            mappingBox = new DynamicDetailView({
                boxLabel:"Memory mapping subsystem",
                boxSize: [120,120],
                maxDetail: 1
            });
            mappingBox.setOrigin([0,0.5]);
            mainLayout.addChild(mappingBox,{align: 'center',index:1});

            pageTable = new PageLookupTable({
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

            mappingBox.annoClick = function () {
                mappingBox.setLevelOfDetail(1);
            };

            physicalMemorySpace = new MemorySpace({
                memConfig:{
                    startAddress:0,
                    addressWidth:8,
                    memSize:0x40000000
                },
                size:[100,500]
            });

            objectRegistry["PhysicalMemory"] = physicalMemorySpace;

            mainLayout.addChild(physicalMemorySpace,{align:'center',index:2});

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
        },
        function ()
        {
            mappingBox.setLevelOfDetail(1);
        },
        function(){
            mainLayout.requestLayout();
            currentScene--;
        }
	];

	function nextScene()
	{
		scenes[currentScene++].call(this);
	}

    function parseText(text){

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

	function drawLine(fromPoint, toPoint)
	{
		// console.log(lineIndex + '=' + fromPoint + '-->' + toPoint);
		this.lines[this.lineIndex].setLinePoints(fromPoint, toPoint);
		this.lineIndex = (this.lineIndex + 1) % this.lines.length;
	}

	function createCallstack()
	{

		var callstack = [];
		callstack.push = function ()
		{
			for (var i = 0, l = arguments.length; i < l; i++)
			{
				this[this.length] = arguments[i];
				console.log(this[this.length - 2], this[this.length - 1]);
				if (this.length >= 2)
				{
					drawLine(this[this.length - 2], this[this.length - 1]);
				}
			}
			return this.length;
		};

		return callstack;
	}

	function setCameraState(cameraMode)
	{
		var transition = {duration: 500, curve: Easing.inOutQuad};

        if (this.cameraModifier.state.isActive())
            this.cameraModifier.state.halt();
		if (cameraMode == "2D")
		{
			//noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(0, transition);
		}
		else if (cameraMode == "3D")
		{
			//noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(1, transition);
		}
        this.cameraMode = cameraMode;
    }

	init();
});
























