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

	var LineCanvas = require('./LineCanvas');
	var BracketView = require('./BracketView');

	var MemoryPagingView = require('./MemoryPagingView');
	var MemoryBlockView = require('./MemoryBlockView');
	var PageTableView = require('./PageTableView');
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

	var currentScene = 0;
	var objectFactory = new ObjectFactory();


	var memoryConfig = {
		pageSize: 16
	};

    var rootNode;
	var dynamicNodes;
	var mainLayout;
    var strings = {};

	function init()
    {
		this.context = Engine.createContext(null);

		this.processes = {};
		this.pages = {};

		this.lines = [];
		this.lineIndex = 0;
		this.dynamicNodes = [];
		dynamicNodes = this.dynamicNodes;


		this.cameraModifier = new Modifier({
				transform: function () {return Transform.rotate(Math.PI * (-1 / 6) * this.state.get(), Math.PI * (1 / 4) * this.state.get(), 0);}
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
            //,1000);

        nextScene.call(this);
	}

	var nextButton;
	var textLayout;
    var virtualMemorySpace;
    var lastView;
    var virtualBlock;

	var scenes = [
		function ()
		{


			var textSurface = (new ObjectFactory()).makeLabelSurface("");
			var wrapSurface = new SurfaceWrappingView(textSurface,{size: [400,200]});

			textLayout.addChild(wrapSurface,{weight:2});
            lastView = wrapSurface;

			nextButton = objectFactory.makeButtonView("Next");
			nextButton.setSize([200, 80]);
			var wrappingView = new SurfaceWrappingView(nextButton,{size:[0,100]});

			textLayout.addChild(wrappingView);

			nextButton.on('click', function (){
			    nextScene.call(this);
			}.bind(this));

			//textLayout.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(objectFactory.makeSurface('','outline'));

			mainLayout.requestLayout();

            loadTextAsync("string1.txt", function(text){
                textSurface.setText(text);
                textLayout.requestLayout();
            });
		},
        function ()
        {
            lastView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            virtualMemorySpace = new MemorySpace({
                minimumContainerSize:[100,20]
            });




            var scene2 = "Let's take a look at a virtual memory space for a 32-bit system";

            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(scene2),{size: [400,200]});

            textLayout.addChild(textView,{weight: 1, index:textLayout.children.length-1});
            lastView = textView;
            mainLayout.addChild(virtualMemorySpace,{weight:1, index:0});
        },
        function()
        {

            lastView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});

            var string = "This is the virtual memory space of a process. It's big, but mostly empty.<br/>" +
                    "The program's code is mapped entirely into the virtual memory space. " +
                "However, this doesn't mean that the program itself is in memory!";


            var pv1 = new PositionableView({size:[undefined,100], position:[0,30,0]});
            pv1.add(objectFactory.makeSurface('Reserved by kernel'));
            virtualMemorySpace.addChild(pv1);


            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(string),{size: [300,200]});
            mainLayout.addChild(textView,{weight:1, index: 0});


            //var string2 = "If the program requests a block of memory from the OS (via malloc)," +
            //    " the resulting allocation is always contiguous, even if the physical memory is fragmented.";
            //
            //var textView2 = new SurfaceWrappingView(objectFactory.makeLabelSurface(string2),{
            //    size: [300,200],
            //    position: [0,400],
            //    name: 'label2'
            //});

            //textView.add(textView2.getModifier()).add(textView2);
            lastView = textView;
        },
        function()
        {
            lastView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            var string = "Let's focus on one particular virtual address. How does this address get mapped to physical memory?";

            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(string),{
                size: [400,true],
                position: [-20,220,0],
                viewOrigin:[1,0.5]
            });
            virtualMemorySpace.add(textView.getModifier()).add(textView);
            lastView = textView;

            virtualBlock = new objectFactory.makeLabelView("0xA0000000");
            virtualBlock.setSize([undefined,true]);
            virtualBlock.setPosition([0,220,0]);
            virtualMemorySpace.addChild(virtualBlock);

        },
        function()
        {
            lastView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});


            var mappingBox = new objectFactory.makeLabelView("Magic box");
            mappingBox.setSize([120,120]);
            mappingBox.setOrigin([0.5,0.5]);
            mainLayout.addChild(mappingBox);



            var string3 = "When the program accesses a virtual address, it gets translated into a physical address by the system. " +
                "But only if that virtual address is assigned to the program. If not, a variety of failure scenarios will occur.</br><br/>" +
                "This mapping is done in fixed-size blocks called <b>pages</b>." +
                "A page of virtual memory maps to a page of physical memory, or maybe a page on the disk. <br/>" +
                "Pages are the currency of the memory manager. Their size varies, but a common size is 4kB. <br/>" +
                "You can check your page size on most distros (and OSX!) with the command" +
                "<pre>getconf PAGESIZE</pre><br/><br/>Let's look at how this grouping is done.";

            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(string3),{size: [400,200]});


            textLayout.addChild(textView,{weight: 1, index:textLayout.children.length-1});
            lastView = textView;
        },
        function ()
        {
            return;
            lastView.opacityState.set(0.7,{duration: 200, curve:Easing.outQuad});
            //pageDemoView.setLevelOfDetail(1);

            var string = "A virtual address has two parts: A page address, and a page offset.<br/>" +
                " This is a 4kB page, with a page number of <b>0x01001</b>";

            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(string),{
                size: [400,true],
                position: [-20,240,0],
                viewOrigin:[1,0.5]
            });
            virtualMemorySpace.add(textView.getModifier()).add(textView);

            //var virtualMemory = new MemoryPagingView({
            //    position:[400,0],
            //    startAddress:0,
            //    pageCount:32,
            //    viewOrigin: [0,0.5]
            //});
        },
        function(){
            mainLayout.requestLayout();
            currentScene--;
        }
	];

	function nextScene()
	{
		scenes[currentScene++]();
	}

	function getProcess(name, processPosition, processRadius)
	{

		var newProcess;
		if (this.processes[name] == undefined)
		{
			newProcess = new process({position: processPosition, radius: processRadius, name: name});
			this.mainNode.add(newProcess.getModifier()).add(newProcess);
			newProcess.createCallstack = createCallstack;
			this.processes[name] = newProcess;
		}
		else
		{
			newProcess = this.processes[name];

			if (processPosition)
			{
				newProcess.setPosition(processPosition, 600);
			}

			if (processRadius)
			{
				newProcess.setRadius(processRadius);
			}
		}
		return newProcess;
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
        };

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
























