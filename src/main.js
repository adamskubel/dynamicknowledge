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
	var BracketView = require('./BracketView');

	var MemoryPagingView = require('./MemoryPagingView');
	var MemoryBlockView = require('./MemoryBlockView');
	var PageTableView = require('./old/PageTableView');
    var MemorySystemView = require('./MemorySystemView');
	var ObjectFactory = require('./ObjectFactory');
	var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');

    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
    var PositionableView = require('./PositioningLayouts/PositionableView');
    var DynamicDetailView = require('./DynamicDetailView');
    var DynamicContainer = require('./PositioningLayouts/DynamicContainer');

    var MemorySpace = require('./MemObjects/MemorySpace');
	var process = require('./process');
	var Timer = require('famous/utilities/Timer');
    var Utils = require('./Utils');
    var Vector = require('./ProperVector');

	var SurfaceWrappingView = require('./PositioningLayouts/SurfaceWrappingView');
    var BoxView = require('./PositioningLayouts/BoxView');
    var PageLookupTable = require('./MemObjects/PageLookupTable');

    var PScrollView = require('./PositioningLayouts/PositioningScrollView');

	var currentScene = 0;
	var objectFactory = new ObjectFactory();



	var memoryConfig = {
		pageSize: 16
	};

    var rootNode;
	var dynamicNodes;
	var mainLayout;
    var strings = {};
    var cameraAngles = [0,0];

    var objectRegistry = {};

	function init()
    {
		this.context = Engine.createContext(null);

		this.processes = {};
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


		//for (var i = 0; i < 60; i++)
		//{
		//	var newLine = new LineCanvas();
		//	this.lines.push(newLine);
		//	rootNode.add(newLine.getModifier()).add(newLine);
		//}


		mainLayout = new StretchyLayout({
			direction:0,
			viewSpacing:[40,0],
            viewOrigin:[1,0.5],
            viewAlign:[0.5,0.5],
            isAnimated:false
		});


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

        //textLayout.add(new BoxView({
        //    color:6000,
        //    size:[undefined,undefined]
        //}));

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


        //Timer.setInterval(function() {nextScene.call(this);},100);

        jQuery.get('./text.txt', function(data)
        {
            var blocks = parseText.call(this,data);

            for (var i=0;i<5;i++)
            {
                nextScene.call(this);
            }

            for (var i=0;i<blocks.length;i++)
            {
                var block = blocks[i];
                var pointAt = objectRegistry[block.name];
                addText.call(this,block.text,pointAt);
            }

        }.bind(this));

	}

    var nextButton;
    var textLayout;
    var virtualMemorySpace;
    var activeTextView;
    var virtualBlock;
    var mappingBox;
    var annoColor = 6000;
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

    //function addTextAsync(string,pointAt){
    //
    //    var textView = addText("",pointAt);
    //    loadTextAsync(string,function(data){
    //        textView.setText(data);
    //        textLayout.requestLayout();
    //    });
    //    return textView;
    //}



    var scenes = [
		function ()
		{

            setCameraState("2D");

			nextButton = new BoxView({text: "Next", size:[200,80], clickable:true, color:6000,viewAlign:[1,1],viewOrigin:[1,1]});
            textLayout.add(nextButton.getModifier()).add(nextButton);

			nextButton.on('click', function (){
			    nextScene.call(this);
			}.bind(this));

			mainLayout.requestLayout();
		},
        function ()
        {
            virtualMemorySpace = new MemorySpace({
                size:[100,700]
            });

            objectRegistry["VirtualSpace"] = virtualMemorySpace;

            mainLayout.addChild(virtualMemorySpace,{weight:1, index:0});
        },
        function()
        {
            var pv1 = new BoxView({
                text:'Reserved by kernel',
                size:[100,100],
                position:[0,30,0],
                textAlign:[0,0]
            });
            virtualMemorySpace.addChild(pv1);
        },
        function()
        {
            virtualBlock = new BoxView({
                text:"0xA0000000",
                size:[undefined,true],
                clickable:true,
                position: [0,220,0],
                textAlign: [0,0.5]
            });
            virtualBlock._memAddress = 0xA0000000;
            virtualMemorySpace.addChild(virtualBlock);
        },
        function()
        {
            mappingBox = new DynamicDetailView({
                boxLabel:"Memory mapping subsystem",
                boxSize: [120,120],
                maxDetail: 2
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
                    var dc = new DynamicContainer();
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

                var ypos = (address/physicalMemorySpace.memConfig.memSize)*physicalMemorySpace._size[1];
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

    function loadTextAsync(name, callback)
    {
        jQuery.get('./'+name, function(data) {
            callback(data);
        });
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

	var labelAngles = [
		-Math.PI / 4,
		Math.PI / 4,
        Math.PI* (3/4),
        -Math.PI* (3/4)
	];

	function label(object, text, labelIndex)
	{
		if (labelIndex == undefined)
		{
			labelIndex = 0;
		}

		var angle = labelAngles[labelIndex];

		var _labelSurface = objectFactory.makeLabelSurface(text);
        var labelSurface = new SurfaceWrappingView(_labelSurface);
        labelSurface.renderController = new RenderController();
        labelSurface.renderController.show(labelSurface);

        if (object.labels == undefined || object.labels[labelIndex] == undefined)
		{
			var labelLine = new LineCanvas({opacityRange: [1, 1]});


			var updatePosition;
			updatePosition = function ()
			{
                var objectPos = Vector.fromArray(object.calculatePosition());
                var objectSize = Vector.fromArray(object.calculateSize());
				var offset = (Vector.fromAngles(0, angle).multiply(80));
                //objectPos.x += objectSize.x;
				labelSurface.setPosition(objectPos.add(offset).toArray());
			};

			updatePosition();

            rootNode.add(labelLine.getModifier()).add(labelLine);
            rootNode.add(labelSurface.getModifier()).add(labelSurface.renderController);

			labelLine.setLineObjects(object, labelSurface);

			object.on('positionChange', function ()
			{
				updatePosition();
				labelLine.update();
			});

			object.labels = [];
			object.labels[labelIndex] = [labelSurface];
		} else
		{
			var labelViews = object.labels[labelIndex];
			var lastView = labelViews[labelViews.length - 1];

			updatePosition = function ()
			{
				var objectPos = Vector.fromArray(lastView.calculatePosition());
				var objectSize = Vector.fromArray(lastView.calculateSize());
				var labelPos = objectPos.add(new Vector(0, objectSize.y, 0));
				labelSurface.setPosition(labelPos.toArray());
			};

			updatePosition();
			object.on('positionChange', function ()
			{
				updatePosition();
			});

			rootNode.add(labelSurface.getModifier()).add(labelSurface);
			labelViews.push(labelSurface);
		}
        labelSurface.wrapSurface.setMaxSize([300, true]);
	}

    function testStretch()
    {
        var stretchy = new StretchyLayout({
            size: [300, 300],
            position: [0, 0, 0],
            viewAlign: [0.5, 0.5]
        });
        stretchy.setPosition([-100, -100, 0]);
        stretchy.setAlign([0.5, 0.5]);
        stretchy.setOrigin([0.5, 0.5]);

        var factory = new ObjectFactory();

        function makepv(text) {
            var pv = new PositionableView();
            pv.surface = factory.makeSurface(text);
            pv.add(pv.surface);

            pv.surface.on('click', function () {
                if (pv._stretchConfig.weight == 1)
                    pv._stretchConfig.weight = 2;
                else
                    pv._stretchConfig.weight = 1;

                stretchy.reflow([300, 200]);
            });
            return pv;
        }

        var pv1 = makepv("PV1");
        var pv2 = makepv("PV2");
        var pv3 = makepv("PV3");

        stretchy.addChild(pv1, {weight: 1, targetSize: [200, 120], minSize: [200, 20]});
        stretchy.addChild(pv2, {weight: 2, targetSize: [200, 250], minSize: [200, 20]});
        stretchy.addChild(pv3, {weight: 1, targetSize: [200, 130], minSize: [200, 20]});

        rootNode.add(stretchy.getModifier()).add(stretchy);
        var s = stretchy.measure([300,200]);
        stretchy.layout(s.minimumSize);
    }



	init();
});
























