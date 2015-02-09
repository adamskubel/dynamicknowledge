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

	var SurfaceWrappingView = require('./PositioningLayouts/SurfaceWrappingView');
    var BoxView = require('./PositioningLayouts/BoxView');
    var PageLookupTable = require('./MemObjects/PageLookupTable');

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
            isAnimated:false
		});


        textLayout = new StretchyLayout({
            direction: 1,
            viewOrigin: [0,0.5]
        });

        textLayout.add(new BoxView({
            size:[undefined,undefined]
        }));

        var mouseCaptureSurface = new Surface();
        this.context.add(new Modifier({transform:Transform.translate(0,0,-100)})).add(mouseCaptureSurface);

		rootNode.add(mainLayout.getModifier()).add(mainLayout);
        rootNode.add(textLayout.getModifier()).add(textLayout);
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

        for (var i=0;i<5;i++)
            nextScene.call(this);

        //Timer.setInterval(function() {nextScene.call(this);},100);
	}

    var nextButton;
    var textLayout;
    var virtualMemorySpace;
    var activeTextView;
    var virtualBlock;
    var mappingBox;
    var annoColor = 4600;
    var pageTable;
    var physicalMemorySpace;

    function addText(string, pointAt){


    }



    var scenes = [
        //function()
        //{
        //    setCameraState("3D");
        //    var systemView = new MemorySystemView();
        //    rootNode.add(systemView);
        //},
		function ()
		{

            setCameraState("2D");

            activeTextView = new BoxView({size:[400,true], tintColor:annoColor});
			textLayout.addChild(activeTextView,{weight:2});

			nextButton = new BoxView({text: "Next", size:[200,80], clickable:true, tintColor:2800});
			textLayout.addChild(nextButton);

			nextButton.on('click', function (){
			    nextScene.call(this);
			}.bind(this));

			mainLayout.requestLayout();


		},
        function ()
        {
            activeTextView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            virtualMemorySpace = new MemorySpace({
                size:[100,700]
            });

            var scene2 = "Let's take a look at a virtual memory space for a 32-bit system";
            activeTextView = new BoxView({text: scene2, size: [400,true], textAlign:[0,0.5], tintColor:annoColor});

            textLayout.addChild(activeTextView,{weight: 1, index:textLayout.children.length-1});
            mainLayout.addChild(virtualMemorySpace,{weight:1, index:0});
        },
        function()
        {

            activeTextView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});

            var string = "This is the virtual memory space of a process. It's big, but mostly empty.<br/>" +
                    "The program's code is mapped entirely into the virtual memory space. " +
                "However, this doesn't mean that the program itself is in memory!";

            var pv1 = new BoxView({
                text:'Reserved by kernel',
                size:[100,100],
                position:[0,30,0],
                textAlign:[0,0]
            });
            virtualMemorySpace.addChild(pv1);

            activeTextView = new BoxView({
                text:string,
                size: [300,true],
                tintColor:annoColor
            });

            mainLayout.addChild(activeTextView,{weight:1, index: 0});
        },
        function()
        {
            activeTextView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            var string = "Let's focus on one particular virtual address. How does this address get mapped to physical memory?";

            activeTextView = new BoxView({
                text:string,
                size: [300,true],
                position: [-20,220,0],
                viewOrigin:[1,0.5],
                tintColor:annoColor
            });

            dynamicNodes.push(activeTextView);
            virtualMemorySpace.add(activeTextView.getModifier()).add(activeTextView);

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
                boxLabel:"Magic!",
                boxSize: [120,120]
            });
            mappingBox.setOrigin([0,0.5]);
            mainLayout.addChild(mappingBox,{align: 'center'});

            pageTable = new PageLookupTable({
                startPage: 0xA0000,
                pageMappings: [
                    0x10520,
                    0x21234,
                    0x0F2D4
                ]
            });

            mappingBox.makeComplexView = function(){
                return pageTable;
            };



            physicalMemorySpace = new MemorySpace({
                memConfig:{
                    startAddress:0,
                    addressWidth:8,
                    memSize:0x40000000
                },
                size:[100,500]
            });

            mainLayout.addChild(physicalMemorySpace,{align:'center'});

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


            activeTextView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            var string = "Memory mapping isn't done per-address. Instead, addresses are grouped into 4kB blocks called pages.<br/>" +
                "The page of an address can be found simply by shifting the bits. For a 4kB page, we can just drop the last 3 hex digits";
            activeTextView = new BoxView({text:string, size:[400,true], position:[-20,300,0], viewOrigin:[1,0.5], tintColor:annoColor});


            virtualMemorySpace.add(activeTextView.getModifier()).add(activeTextView);
            dynamicNodes.push(activeTextView);
        },
        function ()
        {
            var string = "This page number is then used as an offset into a <b>Page Lookup Table</b>. " +
                "The entry at that offset is then concatenated with the 12 bits shifted out earlier, to determine the physical memory address.<br/><br/>" +
                "Drag the virtual address to see the mapping in action!";
            activeTextView = new BoxView({text: string, size: [400,true], textAlign:[0,0.5], tintColor:annoColor});

            addText(string,pageTable);
            //textLayout.addChild(activeTextView,{weight: 1, index:textLayout.children.length-1});
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
























